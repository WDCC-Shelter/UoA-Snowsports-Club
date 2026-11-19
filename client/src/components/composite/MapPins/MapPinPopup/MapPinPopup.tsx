import Image from "next/image"
import { DateUtils, type UnknownTimestamp } from "@/components/utils/DateUtils"
import { MAP_PIN_TYPE_LABELS, type PublicMapPin } from "@/models/MapPin"

export interface IMapPinPopup {
  pin: PublicMapPin
  /**
   * Shows the delete button if `true`
   */
  canDelete?: boolean
  isDeleting?: boolean
  onDelete?: (id: string) => void
}

/**
 * Formats the date a pin was created, i.e `18 Nov 2026`
 */
export const formatPinDate = (createdAt: PublicMapPin["created_at"]) =>
  new Date(
    DateUtils.timestampMilliseconds(createdAt as unknown as UnknownTimestamp)
  ).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })

/**
 * Shows the details of a single pin. Purely presentational, so it can be used
 * inside the map popup or a list.
 */
const MapPinPopup = ({
  pin,
  canDelete,
  isDeleting,
  onDelete
}: IMapPinPopup) => {
  return (
    <div className="flex w-64 flex-col gap-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-2">
        <Image
          src={pin.image_url}
          alt={pin.caption || MAP_PIN_TYPE_LABELS[pin.type]}
          fill
          sizes="256px"
          className="object-cover"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="bg-dark-blue-100 rounded-full text-white px-2 py-0.5 text-xs font-bold uppercase">
          {MAP_PIN_TYPE_LABELS[pin.type]}
        </span>
        <span className="text-gray-4 text-xs">
          {formatPinDate(pin.created_at)}
        </span>
      </div>
      {pin.caption && <p className="text-sm text-black">{pin.caption}</p>}
      {canDelete && (
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => onDelete?.(pin.id)}
          className="text-red self-start text-sm font-bold underline disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete pin"}
        </button>
      )}
    </div>
  )
}

export default MapPinPopup
