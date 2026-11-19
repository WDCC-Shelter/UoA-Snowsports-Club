"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import { useEffect, useRef, useState } from "react"
import MapGL, {
  type MapLayerMouseEvent,
  type MapRef,
  Marker,
  type MarkerDragEvent,
  NavigationControl
} from "react-map-gl/maplibre"
import type { GpsLocation } from "@/services/MapPin/ImageUtils"
import { MAP_STYLE_URL, NZ_VIEW } from "../PinMap/PinMapConstants"

export interface ILocationPicker {
  value?: GpsLocation
  onChange: (location: GpsLocation) => void
}

/**
 * Zoom used when the map centres on a chosen location
 */
const LOCATION_ZOOM = 15

/**
 * Small map for confirming where a pin goes. The marker can be dragged, or the
 * map tapped, to move it. Must be loaded client side only.
 */
const LocationPicker = ({ value, onChange }: ILocationPicker) => {
  const mapRef = useRef<MapRef>(null)
  const [initialView] = useState(() =>
    value ? { ...value, zoom: LOCATION_ZOOM } : NZ_VIEW
  )

  // Follow the value when it's set from outside (i.e "use my current location")
  // but not while the user is moving the marker themselves
  const lastSetByMap = useRef<GpsLocation>()
  useEffect(() => {
    if (!value || value === lastSetByMap.current) return
    mapRef.current?.flyTo({
      center: [value.longitude, value.latitude],
      zoom: Math.max(mapRef.current.getZoom(), LOCATION_ZOOM)
    })
  }, [value])

  const setFromMap = (location: GpsLocation) => {
    lastSetByMap.current = location
    onChange(location)
  }

  return (
    <MapGL
      ref={mapRef}
      initialViewState={initialView}
      mapStyle={MAP_STYLE_URL}
      style={{ width: "100%", height: "100%" }}
      // The container may not have its final size when the map is created
      onLoad={(event) => event.target.resize()}
      onClick={(event: MapLayerMouseEvent) =>
        setFromMap({
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng
        })
      }
    >
      <NavigationControl position="top-right" showCompass={false} />
      {value && (
        <Marker
          latitude={value.latitude}
          longitude={value.longitude}
          draggable
          color="#FF6D04"
          onDragEnd={(event: MarkerDragEvent) =>
            setFromMap({
              latitude: event.lngLat.lat,
              longitude: event.lngLat.lng
            })
          }
        />
      )}
    </MapGL>
  )
}

export default LocationPicker
