import type { MapBounds } from "@/models/MapPin"
import fetchClient from "../OpenApiFetchClient"

const MapPinService = {
  getMapPins: async (bounds: MapBounds) => {
    const { data, response } = await fetchClient.GET("/map-pins", {
      params: { query: bounds }
    })
    if (!response.ok || !data?.data) {
      throw new Error("Failed to fetch map pins")
    }
    return data.data
  },
  deleteMapPin: async (id: string) => {
    const { response } = await fetchClient.DELETE("/map-pins/{id}", {
      params: { path: { id } }
    })
    if (!response.ok) {
      throw new Error("Failed to delete map pin")
    }
  }
} as const

export default MapPinService
