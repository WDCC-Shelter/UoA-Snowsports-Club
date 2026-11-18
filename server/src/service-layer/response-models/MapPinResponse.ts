import type { MapPin } from "data-layer/models/MapPin"
import type { CommonResponse, CursorPaginatedResponse } from "./CommonResponse"

/**
 * A pin as shown publicly on the map. Does not include who uploaded it.
 */
export type PublicMapPin = Pick<
  MapPin,
  "type" | "caption" | "latitude" | "longitude" | "created_at"
> & {
  id: string
  /**
   * Public URL of the pin's photo
   */
  image_url: string
}

/**
 * A pin as shown to admins, which includes who uploaded it for moderation
 */
export type AdminMapPin = PublicMapPin & Pick<MapPin, "uploader_id">

export interface GetMapPinsResponse extends CommonResponse {
  data?: PublicMapPin[]
}

export interface CreateMapPinResponse extends CommonResponse {
  data?: PublicMapPin
}

export interface GetLatestMapPinsResponse
  extends CommonResponse,
    CursorPaginatedResponse {
  data?: AdminMapPin[]
}
