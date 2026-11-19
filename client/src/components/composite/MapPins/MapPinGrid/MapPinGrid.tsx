import Link from "next/link"
import type { ReactNode } from "react"
import type { PublicMapPin } from "@/models/MapPin"
import { mapPinHref } from "@/services/MapPin/MapPinUtils"
import MapPinPopup from "../MapPinPopup/MapPinPopup"

export interface IMapPinGrid<T extends PublicMapPin> {
  pins: T[]
  /**
   * Shows the delete button on every pin if `true`
   */
  canDelete?: boolean
  onDelete?: (id: string) => void
  /**
   * The id of the pin currently being deleted
   */
  deletingId?: string
  /**
   * Extra details shown under each pin
   */
  renderDetails?: (pin: T) => ReactNode
}

/**
 * Grid of pins, each with a link to view it on the map
 */
const MapPinGrid = <T extends PublicMapPin>({
  pins,
  canDelete,
  onDelete,
  deletingId,
  renderDetails
}: IMapPinGrid<T>) => {
  return (
    <div className="flex flex-wrap gap-4">
      {pins.map((pin) => (
        <div
          key={pin.id}
          className="border-gray-3 flex flex-col gap-2 rounded-md border bg-white p-3"
        >
          <MapPinPopup
            pin={pin}
            canDelete={canDelete}
            isDeleting={deletingId === pin.id}
            onDelete={onDelete}
          />
          {renderDetails?.(pin)}
          <Link
            href={mapPinHref(pin)}
            className="text-dark-blue-100 text-sm font-bold underline"
          >
            View on map
          </Link>
        </div>
      ))}
    </div>
  )
}

export default MapPinGrid
