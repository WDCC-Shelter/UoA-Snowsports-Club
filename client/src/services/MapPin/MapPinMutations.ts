import { useMutation } from "@tanstack/react-query"
import type { MapPinType } from "@/models/MapPin"
import queryClient from "@/services/QueryClient"
import StorageService from "@/services/Storage/StorageService"
import { MAP_PINS_QUERY_KEY } from "./MapPinQueries"
import MapPinService from "./MapPinService"

/**
 * Invalidates every query that might contain map pins
 */
export const invalidateMapPinQueries = async () => {
  await queryClient.invalidateQueries({ queryKey: [MAP_PINS_QUERY_KEY] })
}

export function useDeleteMapPinMutation() {
  return useMutation({
    mutationKey: ["delete-map-pin"],
    mutationFn: MapPinService.deleteMapPin,
    onSettled: invalidateMapPinQueries
  })
}

export type CreateMapPinVariables = {
  uploaderId: string
  /**
   * The already resized image to upload
   */
  image: Blob
  type: MapPinType
  caption?: string
  latitude: number
  longitude: number
}

/**
 * Uploads the image for a pin to storage, then creates the pin
 */
export function useCreateMapPinMutation() {
  return useMutation({
    mutationKey: ["create-map-pin"],
    mutationFn: async ({
      uploaderId,
      image,
      ...details
    }: CreateMapPinVariables) => {
      const imageId = await StorageService.uploadMapPinImage(uploaderId, image)
      return await MapPinService.createMapPin({ image_id: imageId, ...details })
    },
    onSuccess: invalidateMapPinQueries
  })
}
