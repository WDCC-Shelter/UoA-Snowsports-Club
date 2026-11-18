import MapPinImageService from "business-layer/services/MapPinImageService"
import type { DocumentDataWithUid } from "data-layer/models/common"
import type { MapPin } from "data-layer/models/MapPin"
import type {
  AdminMapPin,
  PublicMapPin
} from "service-layer/response-models/MapPinResponse"

/**
 * Converts a stored pin into the shape that is safe to show publicly,
 * which notably excludes the uploader
 */
export const toPublicMapPin = (
  pin: DocumentDataWithUid<MapPin>
): PublicMapPin => ({
  id: pin.id,
  type: pin.type,
  ...(pin.caption && { caption: pin.caption }),
  latitude: pin.latitude,
  longitude: pin.longitude,
  created_at: pin.created_at,
  image_url: MapPinImageService.publicUrlFor(pin.image_path)
})

/**
 * Converts a stored pin into the shape shown to admins
 */
export const toAdminMapPin = (
  pin: DocumentDataWithUid<MapPin>
): AdminMapPin => ({
  ...toPublicMapPin(pin),
  uploader_id: pin.uploader_id
})
