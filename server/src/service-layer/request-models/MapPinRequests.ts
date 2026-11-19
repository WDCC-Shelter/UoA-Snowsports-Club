import type { MapPinType } from "data-layer/models/MapPin"

export interface CreateMapPinRequestBody {
  /**
   * The id of the image already uploaded to `map-pins/{uid}/{image_id}` in
   * Firebase Storage. Becomes the id of the pin.
   *
   * @pattern ^[A-Za-z0-9_-]{8,64}$ Invalid image id
   */
  image_id: string
  /**
   * What the photo is of
   */
  type: MapPinType
  /**
   * Optional short caption
   *
   * @maxLength 140 Caption must be at most 140 characters
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
}
