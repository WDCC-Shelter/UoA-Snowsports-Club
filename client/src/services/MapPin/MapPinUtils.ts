import type { MapBounds } from "@/models/MapPin"

/**
 * How many decimal places bounds are rounded *outwards* to, so that small pans
 * of the map reuse the same cached query. 1 decimal place is ~11km.
 */
const BOUNDS_PRECISION = 1

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/**
 * Normalises a longitude into the range [-180, 180]
 */
export const wrapLongitude = (lng: number) => {
  const wrapped = ((((lng + 180) % 360) + 360) % 360) - 180
  // Keep 180 as 180 rather than wrapping it to -180
  return wrapped === -180 && lng > 0 ? 180 : wrapped
}

/**
 * Converts the visible bounds of the map into the bounds sent to the server:
 * - rounded outwards so the query key is stable while panning a little
 * - latitudes clamped to valid values
 * - longitudes wrapped, and the whole world used if more than 360° is visible
 *   (if the wrapped box crosses the antimeridian, `min_lng > max_lng`)
 */
export const toQueryBounds = (bounds: MapBounds): MapBounds => {
  const factor = 10 ** BOUNDS_PRECISION
  const floor = (n: number) => Math.floor(n * factor) / factor
  const ceil = (n: number) => Math.ceil(n * factor) / factor

  const min_lat = clamp(floor(bounds.min_lat), -90, 90)
  const max_lat = clamp(ceil(bounds.max_lat), -90, 90)

  if (bounds.max_lng - bounds.min_lng >= 360) {
    return { min_lat, max_lat, min_lng: -180, max_lng: 180 }
  }

  return {
    min_lat,
    max_lat,
    min_lng: clamp(floor(wrapLongitude(bounds.min_lng)), -180, 180),
    max_lng: clamp(ceil(wrapLongitude(bounds.max_lng)), -180, 180)
  }
}

/**
 * Zoom used when linking to a single pin
 */
export const PIN_LINK_ZOOM = 15

/**
 * Link to a pin on the map, which centres on the pin and opens its popup
 */
export const mapPinHref = (pin: {
  id: string
  latitude: number
  longitude: number
}) =>
  `/map?${new URLSearchParams({
    lat: String(pin.latitude),
    lng: String(pin.longitude),
    zoom: String(PIN_LINK_ZOOM),
    pin: pin.id
  }).toString()}`
