"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import type { GeoJSONSource } from "maplibre-gl"
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react"
import MapGL, {
  GeolocateControl,
  Layer,
  type LayerProps,
  type MapLayerMouseEvent,
  type MapRef,
  NavigationControl,
  Popup,
  Source
} from "react-map-gl/maplibre"
import type { MapBounds, PublicMapPin } from "@/models/MapPin"
import { MAP_STYLE_URL, type MapView, NZ_VIEW } from "./PinMapConstants"

const PIN_SOURCE_ID = "map-pins"
const CLUSTER_LAYER_ID = "map-pin-clusters"
const CLUSTER_COUNT_LAYER_ID = "map-pin-cluster-count"
const PIN_LAYER_ID = "map-pin-points"

const DARK_BLUE = "#283D87"
const LIGHT_BLUE = "#4088C3"
const ORANGE = "#FF6D04"

/**
 * Marker colour for each type of pin
 */
export const PIN_TYPE_COLOURS = {
  sticker: LIGHT_BLUE,
  member_photo: ORANGE
} as const

const clusterLayer: LayerProps = {
  id: CLUSTER_LAYER_ID,
  type: "circle",
  source: PIN_SOURCE_ID,
  filter: ["has", "point_count"],
  paint: {
    "circle-color": DARK_BLUE,
    "circle-opacity": 0.85,
    "circle-stroke-color": "#FFFFFF",
    "circle-stroke-width": 2,
    "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 28]
  }
}

const clusterCountLayer: LayerProps = {
  id: CLUSTER_COUNT_LAYER_ID,
  type: "symbol",
  source: PIN_SOURCE_ID,
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["Noto Sans Bold"],
    "text-size": 13
  },
  paint: { "text-color": "#FFFFFF" }
}

const pinLayer: LayerProps = {
  id: PIN_LAYER_ID,
  type: "circle",
  source: PIN_SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": [
      "match",
      ["get", "type"],
      "member_photo",
      PIN_TYPE_COLOURS.member_photo,
      PIN_TYPE_COLOURS.sticker
    ],
    "circle-radius": 8,
    "circle-stroke-color": "#FFFFFF",
    "circle-stroke-width": 2
  }
}

export interface IPinMap {
  pins: PublicMapPin[]
  /**
   * Where the map starts, defaults to {@link NZ_VIEW}
   */
  initialView?: MapView
  /**
   * Called with the visible area once the map loads and after it stops moving
   */
  onBoundsChange?: (bounds: MapBounds) => void
  selectedPinId?: string
  onSelectPin?: (id?: string) => void
  /**
   * Content of the popup shown for the selected pin
   */
  renderPopup?: (pin: PublicMapPin) => ReactNode
  /**
   * Shows a button to centre the map on the user's location
   */
  showGeolocate?: boolean
  /**
   * Overlays rendered on top of the map
   */
  children?: ReactNode
}

/**
 * Map of pins that clusters pins based on zoom. Must be loaded client side
 * only (i.e with `next/dynamic` and `ssr: false`) as MapLibre needs `window`.
 */
const PinMap = ({
  pins,
  initialView = NZ_VIEW,
  onBoundsChange,
  selectedPinId,
  onSelectPin,
  renderPopup,
  showGeolocate = true,
  children
}: IPinMap) => {
  const mapRef = useRef<MapRef>(null)
  const [cursor, setCursor] = useState<string>("")

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: pins.map((pin) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [pin.longitude, pin.latitude]
        },
        properties: { id: pin.id, type: pin.type }
      }))
    }),
    [pins]
  )

  const selectedPin = useMemo(
    () => pins.find((pin) => pin.id === selectedPinId),
    [pins, selectedPinId]
  )

  const emitBounds = useCallback(() => {
    const bounds = mapRef.current?.getBounds()
    if (!bounds) return
    onBoundsChange?.({
      min_lat: bounds.getSouth(),
      min_lng: bounds.getWest(),
      max_lat: bounds.getNorth(),
      max_lng: bounds.getEast()
    })
  }, [onBoundsChange])

  const onClick = useCallback(
    async (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (!feature) {
        onSelectPin?.(undefined)
        return
      }

      if (feature.layer.id === CLUSTER_LAYER_ID) {
        const source = mapRef.current?.getSource(PIN_SOURCE_ID) as
          | GeoJSONSource
          | undefined
        if (!source || feature.geometry.type !== "Point") return
        const zoom = await source.getClusterExpansionZoom(
          feature.properties.cluster_id
        )
        mapRef.current?.easeTo({
          center: feature.geometry.coordinates as [number, number],
          zoom
        })
        return
      }

      onSelectPin?.(feature.properties.id)
    },
    [onSelectPin]
  )

  return (
    <MapGL
      ref={mapRef}
      initialViewState={initialView}
      mapStyle={MAP_STYLE_URL}
      style={{ width: "100%", height: "100%" }}
      interactiveLayerIds={[CLUSTER_LAYER_ID, PIN_LAYER_ID]}
      cursor={cursor}
      onMouseEnter={() => setCursor("pointer")}
      onMouseLeave={() => setCursor("")}
      onClick={onClick}
      onLoad={(event) => {
        // The container may not have had its final size when the map was
        // created (i.e styles still loading), which the map doesn't recover from
        event.target.resize()
        emitBounds()
      }}
      onMoveEnd={emitBounds}
    >
      <NavigationControl position="top-right" showCompass={false} />
      {showGeolocate && <GeolocateControl position="top-right" />}
      <Source
        id={PIN_SOURCE_ID}
        type="geojson"
        data={geojson}
        cluster
        clusterMaxZoom={14}
        clusterRadius={50}
      >
        <Layer {...clusterLayer} />
        <Layer {...clusterCountLayer} />
        <Layer {...pinLayer} />
      </Source>
      {selectedPin && renderPopup && (
        <Popup
          latitude={selectedPin.latitude}
          longitude={selectedPin.longitude}
          anchor="bottom"
          offset={12}
          maxWidth="none"
          closeOnClick={false}
          onClose={() => onSelectPin?.(undefined)}
        >
          {renderPopup(selectedPin)}
        </Popup>
      )}
      {children}
    </MapGL>
  )
}

export default PinMap
