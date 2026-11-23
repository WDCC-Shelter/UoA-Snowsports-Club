import type { Timestamp } from "firebase-admin/firestore"

/**
 * The kind of photo a pin represents. Used to pick the marker icon on the map.
 */
export type MapPinType = "sticker" | "member_photo"

/**
 * Result of automatically checking a pin's photo:
 * - `pending`: not checked yet, still shown on the map
 * - `approved`: checked (automatically or by an admin), shown on the map
 * - `flagged`: possibly inappropriate, hidden from the map until an admin reviews it
 *
 * Photos that are very likely inappropriate are deleted outright instead.
 */
export type MapPinModerationStatus = "pending" | "approved" | "flagged"

/**
 * How likely a photo is to contain a kind of content, from Google Cloud Vision SafeSearch
 */
export type SafeSearchLikelihood =
  | "UNKNOWN"
  | "VERY_UNLIKELY"
  | "UNLIKELY"
  | "POSSIBLE"
  | "LIKELY"
  | "VERY_LIKELY"

export interface SafeSearchResult {
  adult: SafeSearchLikelihood
  racy: SafeSearchLikelihood
  violence: SafeSearchLikelihood
  medical: SafeSearchLikelihood
  spoof: SafeSearchLikelihood
}

/**
 * A single photo pinned to a location on the public UASC map.
 *
 * Members can't edit pins once created, only admins can (type, caption and
 * location). The document id is the same as the id of the uploaded image
 * (see {@link MapPin.image_path}).
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
  /**
   * Whether the photo has been checked for inappropriate content. Pins created
   * before moderation existed may not have this, and are treated as `pending`.
   */
  moderation_status?: MapPinModerationStatus
  /**
   * When the photo was last checked or reviewed
   */
  moderated_at?: Timestamp
  /**
   * The automatic check's results, shown to admins when reviewing flagged pins
   */
  safe_search?: SafeSearchResult
  /**
   * When an admin last edited the pin
   */
  edited_at?: Timestamp
  /**
   * The uid of the admin who last edited the pin. **Never** exposed publicly.
   */
  edited_by?: string
}
