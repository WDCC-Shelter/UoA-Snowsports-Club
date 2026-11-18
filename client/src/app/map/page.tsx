"use client"

import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import MapPinPopup from "@/components/composite/MapPins/MapPinPopup/MapPinPopup"
import {
  type MapView,
  NZ_VIEW
} from "@/components/composite/MapPins/PinMap/PinMapConstants"
import Loader from "@/components/generic/SuspenseComponent/Loader"
import type { MapBounds } from "@/models/MapPin"
import { useDeleteMapPinMutation } from "@/services/MapPin/MapPinMutations"
import { useMapPinsQuery } from "@/services/MapPin/MapPinQueries"
import { PIN_LINK_ZOOM, toQueryBounds } from "@/services/MapPin/MapPinUtils"
import { useAppData } from "@/store/Store"

// MapLibre needs `window`, so can't be rendered during static export
const PinMap = dynamic(
  () => import("@/components/composite/MapPins/PinMap/PinMap"),
  { ssr: false, loading: () => <Loader /> }
)

/**
 * Search params that can be used to link to a specific place or pin,
 * i.e `/map?lat=-36.8&lng=174.7&zoom=15&pin={id}`, see `mapPinHref`
 */
const LAT_PARAM = "lat"
const LNG_PARAM = "lng"
const ZOOM_PARAM = "zoom"
const PIN_PARAM = "pin"

const parseNumber = (value: string | null) => {
  if (value === null || value.trim() === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const MapPage = () => {
  const params = useSearchParams()
  const [{ currentUserClaims }] = useAppData()
  const isAdmin = !!currentUserClaims?.admin
  const isMember = !!currentUserClaims?.member || isAdmin

  // Only used for the initial view, so later changes to the params are ignored
  const [initialView] = useState<MapView>(() => {
    const latitude = parseNumber(params.get(LAT_PARAM))
    const longitude = parseNumber(params.get(LNG_PARAM))
    if (latitude === undefined || longitude === undefined) return NZ_VIEW
    return {
      latitude,
      longitude,
      zoom: parseNumber(params.get(ZOOM_PARAM)) ?? PIN_LINK_ZOOM
    }
  })

  const [bounds, setBounds] = useState<MapBounds>()
  const [selectedPinId, setSelectedPinId] = useState<string | undefined>(
    params.get(PIN_PARAM) || undefined
  )

  const { data: pins } = useMapPinsQuery(bounds)
  const { mutate: deletePin, isPending: isDeleting } = useDeleteMapPinMutation()

  const onBoundsChange = useCallback((visible: MapBounds) => {
    setBounds(toQueryBounds(visible))
  }, [])

  const onDelete = useCallback(
    (id: string) => {
      if (!window.confirm("Delete this pin? This can't be undone.")) return
      deletePin(id, { onSuccess: () => setSelectedPinId(undefined) })
    },
    [deletePin]
  )

  return (
    <div className="relative h-[calc(100dvh-51px)] w-full">
      <PinMap
        pins={pins || []}
        initialView={initialView}
        onBoundsChange={onBoundsChange}
        selectedPinId={selectedPinId}
        onSelectPin={setSelectedPinId}
        renderPopup={(pin) => (
          <MapPinPopup
            pin={pin}
            canDelete={isAdmin}
            isDeleting={isDeleting}
            onDelete={onDelete}
          />
        )}
      />
      {!isMember && (
        <p className="bg-gray-1/90 text-dark-blue-100 absolute bottom-8 left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow">
          Only members can upload pins
        </p>
      )}
    </div>
  )
}

export default MapPage
