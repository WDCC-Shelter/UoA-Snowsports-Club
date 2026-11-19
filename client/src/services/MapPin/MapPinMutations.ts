import { useMutation } from "@tanstack/react-query"
import queryClient from "@/services/QueryClient"
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
