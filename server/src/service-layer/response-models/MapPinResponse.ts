import type { MapPin, MapPinModerationStatus } from "data-layer/models/MapPin"
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
 * A pin as shown to the member who uploaded it, which includes whether it's
 * hidden while waiting for an admin to review it
 */
export type OwnMapPin = PublicMapPin & {
  moderation_status: MapPinModerationStatus
}

/**
 * A pin as shown to admins, which includes who uploaded it and the results of
 * the automatic check for moderation
 */
export type AdminMapPin = OwnMapPin &
  Pick<MapPin, "uploader_id" | "safe_search">

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

export interface GetOwnMapPinsResponse extends CommonResponse {
  data?: OwnMapPin[]
}

export interface GetFlaggedMapPinsResponse extends CommonResponse {
  data?: AdminMapPin[]
}
