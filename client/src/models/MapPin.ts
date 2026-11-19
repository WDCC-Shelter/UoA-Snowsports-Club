import type { components } from "./__generated__/schema"

export type MapPinType = components["schemas"]["MapPinType"]

export type PublicMapPin = components["schemas"]["PublicMapPin"]

export type AdminMapPin = components["schemas"]["AdminMapPin"]

export type CreateMapPinRequestBody =
  components["schemas"]["CreateMapPinRequestBody"]

/**
 * Bounding box of the visible area of the map
 */
export type MapBounds = {
  min_lat: number
  min_lng: number
  max_lat: number
  max_lng: number
}

export const MAP_PIN_TYPE_LABELS: Record<MapPinType, string> = {
  sticker: "Sticker",
  member_photo: "Member photo"
}
