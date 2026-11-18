import MapPinImageService from "business-layer/services/MapPinImageService"
import { AuthServiceClaims } from "business-layer/utils/AuthServiceClaims"
import { toPublicMapPin } from "business-layer/utils/MapPinUtils"
import MapPinService from "data-layer/services/MapPinService"
import { Timestamp } from "firebase-admin/firestore"
import { getReasonPhrase, StatusCodes } from "http-status-codes"
import type { CreateMapPinRequestBody } from "service-layer/request-models/MapPinRequests"
import type { SelfRequestModel } from "service-layer/request-models/UserRequests"
import type { CommonResponse } from "service-layer/response-models/CommonResponse"
import type {
  CreateMapPinResponse,
  GetMapPinsResponse
} from "service-layer/response-models/MapPinResponse"
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  SuccessResponse
} from "tsoa"

/**
 * gRPC status code returned by Firestore when creating a document that already exists
 */
const FIRESTORE_ALREADY_EXISTS = 6

const isValidLatitude = (lat: number) =>
  Number.isFinite(lat) && lat >= -90 && lat <= 90
const isValidLongitude = (lng: number) =>
  Number.isFinite(lng) && lng >= -180 && lng <= 180

@Route("map-pins")
export class MapPinController extends Controller {
  /**
   * Fetches pins inside a bounding box, capped at 500 pins. Public, and does not
   * include who uploaded each pin.
   *
   * If `min_lng` is greater than `max_lng` the box is treated as crossing the antimeridian.
   */
  @SuccessResponse("200", "Fetched map pins")
  @Get()
  public async getMapPins(
    @Query() min_lat: number,
    @Query() min_lng: number,
    @Query() max_lat: number,
    @Query() max_lng: number
  ): Promise<GetMapPinsResponse> {
    if (
      !isValidLatitude(min_lat) ||
      !isValidLatitude(max_lat) ||
      !isValidLongitude(min_lng) ||
      !isValidLongitude(max_lng) ||
      min_lat > max_lat
    ) {
      this.setStatus(StatusCodes.BAD_REQUEST)
      return { error: "Invalid bounding box" }
    }

    try {
      const pins = await new MapPinService().getMapPinsInBoundingBox({
        min_lat,
        min_lng,
        max_lat,
        max_lng
      })
      return { data: pins.map(toPublicMapPin) }
    } catch (e) {
      console.error("Failed to fetch map pins", e)
      this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR)
      return { error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) }
    }
  }

  /**
   * Fetches the pins uploaded by the current user, newest first. Available to any
   * logged in user so that lapsed members can still see their pins.
   */
  @SuccessResponse("200", "Fetched own map pins")
  @Security("jwt")
  @Get("self")
  public async getOwnMapPins(
    @Request() request: SelfRequestModel
  ): Promise<GetMapPinsResponse> {
    try {
      const pins = await new MapPinService().getMapPinsByUploader(
        request.user.uid
      )
      return { data: pins.map(toPublicMapPin) }
    } catch (e) {
      console.error("Failed to fetch own map pins", e)
      this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR)
      return { error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) }
    }
  }

  /**
   * Creates a pin for an image the member has already uploaded to
   * `map-pins/{uid}/{image_id}` in Firebase Storage
   */
  @SuccessResponse("201", "Created map pin")
  @Security("jwt", ["member"])
  @Security("jwt", ["admin"])
  @Post()
  public async createMapPin(
    @Request() request: SelfRequestModel,
    @Body() body: CreateMapPinRequestBody
  ): Promise<CreateMapPinResponse> {
    const { uid } = request.user
    const { image_id, type, caption, latitude, longitude } = body

    const imagePath = MapPinImageService.imagePathFor(uid, image_id)
    const mapPinService = new MapPinService()

    try {
      if (!(await new MapPinImageService().imageExists(imagePath))) {
        this.setStatus(StatusCodes.BAD_REQUEST)
        return { error: "The image for this pin has not been uploaded" }
      }

      const trimmedCaption = caption?.trim()
      const pin = {
        type,
        ...(trimmedCaption && { caption: trimmedCaption }),
        latitude,
        longitude,
        geohash: MapPinService.geohashFor(latitude, longitude),
        image_path: imagePath,
        uploader_id: uid,
        created_at: Timestamp.now()
      }
      await mapPinService.createMapPin(image_id, pin)

      this.setStatus(StatusCodes.CREATED)
      return { data: toPublicMapPin({ ...pin, id: image_id }) }
    } catch (e) {
      if ((e as { code?: number })?.code === FIRESTORE_ALREADY_EXISTS) {
        this.setStatus(StatusCodes.CONFLICT)
        return { error: "A pin for this image already exists" }
      }
      console.error("Failed to create map pin", e)
      this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR)
      return { error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) }
    }
  }

  /**
   * Deletes a pin and its image. Members can only delete their own pins,
   * admins can delete any pin.
   */
  @SuccessResponse("204", "Deleted map pin")
  @Security("jwt", ["member"])
  @Security("jwt", ["admin"])
  @Delete("{id}")
  public async deleteMapPin(
    @Request() request: SelfRequestModel,
    @Path() id: string
  ): Promise<CommonResponse | undefined> {
    const { uid, customClaims } = request.user
    const isAdmin = !!customClaims?.[AuthServiceClaims.ADMIN]
    const mapPinService = new MapPinService()

    try {
      const pin = await mapPinService.getMapPinById(id)
      if (!pin) {
        this.setStatus(StatusCodes.NOT_FOUND)
        return { error: "Pin not found" }
      }
      if (!isAdmin && pin.uploader_id !== uid) {
        this.setStatus(StatusCodes.FORBIDDEN)
        return { error: "You can only delete your own pins" }
      }

      await new MapPinImageService().deleteImage(pin.image_path)
      await mapPinService.deleteMapPin(id)
      this.setStatus(StatusCodes.NO_CONTENT)
      return undefined
    } catch (e) {
      console.error("Failed to delete map pin", e)
      this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR)
      return { error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) }
    }
  }
}
