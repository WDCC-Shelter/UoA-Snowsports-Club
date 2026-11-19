/**
 * Free vector tiles that need no API key, see https://openfreemap.org
 */
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty"

export type MapView = {
  latitude: number
  longitude: number
  zoom: number
}

/**
 * Initial view of the map, which shows all of New Zealand
 */
export const NZ_VIEW: MapView = { latitude: -41, longitude: 173, zoom: 4.3 }
