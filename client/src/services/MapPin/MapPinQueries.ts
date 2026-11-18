import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { MapBounds } from "@/models/MapPin"
import MapPinService from "./MapPinService"

export const MAP_PINS_QUERY_KEY = "map-pins" as const

/**
 * Fetches pins in the given bounds. Should be given bounds from `toQueryBounds`
 * so that the query key is stable.
 */
export function useMapPinsQuery(bounds?: MapBounds) {
  return useQuery({
    queryKey: [MAP_PINS_QUERY_KEY, bounds],
    queryFn: () => MapPinService.getMapPins(bounds as MapBounds),
    enabled: !!bounds,
    // Keep showing the previous pins while the new area loads
    placeholderData: keepPreviousData,
    staleTime: 60_000
  })
}
