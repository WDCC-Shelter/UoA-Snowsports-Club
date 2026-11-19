import type { Timestamp } from "firebase-admin/firestore"

/**
 * The kind of photo a pin represents. Used to pick the marker icon on the map.
 */
export type MapPinType = "sticker" | "member_photo"

/**
 * A single photo pinned to a location on the public UASC map.
 *
 * Pins are immutable once created, and the document id is the same as the
 * id of the uploaded image (see {@link MapPin.image_path}).
 */
export interface MapPin {
  /**
   * What the photo is of
   */
  type: MapPinType
  /**
   * Optional short caption shown alongside the photo
   */
  caption?: string
  /**
   * @minimum -90
   * @maximum 90
   */
  latitude: number
  /**
   * @minimum -180
   * @maximum 180
   */
  longitude: number
  /**
   * Geohash of the location, used for bounding box queries
   */
  geohash: string
  /**
   * Path of the image in Firebase Storage, in the form `map-pins/{uploader_id}/{pin_id}`
   */
  image_path: string
  /**
   * The uid of the member who uploaded the pin. **Never** exposed publicly.
   */
  uploader_id: string
  /**
   * When the pin was created
   */
  created_at: Timestamp
}
