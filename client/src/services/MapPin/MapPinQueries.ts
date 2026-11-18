import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery
} from "@tanstack/react-query"
import type { MapBounds } from "@/models/MapPin"
import MapPinService from "./MapPinService"

export const MAP_PINS_QUERY_KEY = "map-pins" as const
export const OWN_MAP_PINS_QUERY_KEY = "own-map-pins" as const
export const LATEST_MAP_PINS_ADMIN_QUERY_KEY = "latest-map-pins-admin" as const

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

/**
 * Fetches the pins uploaded by the current user
 */
export function useOwnMapPinsQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: [OWN_MAP_PINS_QUERY_KEY],
    queryFn: MapPinService.getOwnMapPins,
    enabled
  })
}

/**
 * Paginated list of the latest pins, newest first, for admins
 */
export function useLatestMapPinsAdminQuery() {
  return useInfiniteQuery({
    queryKey: [LATEST_MAP_PINS_ADMIN_QUERY_KEY],
    queryFn: MapPinService.getLatestMapPinsAsAdmin,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  })
}
