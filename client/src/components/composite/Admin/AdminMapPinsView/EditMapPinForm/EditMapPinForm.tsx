import { type ReactNode, useEffect, useId, useState } from "react"
import { MAX_CAPTION_LENGTH } from "@/components/composite/MapPins/NewPinDetailsForm/NewPinDetailsForm"
import {
  type AdminMapPin,
  type EditMapPinRequestBody,
  MAP_PIN_TYPE_LABELS,
  type MapPinType
} from "@/models/MapPin"
import type { GpsLocation } from "@/services/MapPin/ImageUtils"

const PIN_TYPES: MapPinType[] = ["sticker", "member_photo"]

export interface IEditMapPinForm {
  pin: AdminMapPin
  /**
   * Renders the map used to move the pin, passed in as it must be loaded client side only
   */
  renderLocationPicker: (
    value: GpsLocation,
    onChange: (location: GpsLocation) => void
  ) => ReactNode
  /**
   * Called with only the fields that changed
   */
  onSave: (changes: EditMapPinRequestBody) => void
  onCancel: () => void
  isSaving?: boolean
  error?: string
}

/**
 * Works out which fields changed, so only those are sent
 */
export const getMapPinChanges = (
  pin: AdminMapPin,
  edited: { type: MapPinType; caption: string; location: GpsLocation }
): EditMapPinRequestBody => {
  const changes: EditMapPinRequestBody = {}
  if (edited.type !== pin.type) changes.type = edited.type
  if (edited.caption.trim() !== (pin.caption ?? "")) {
    changes.caption = edited.caption.trim()
  }
  if (
    edited.location.latitude !== pin.latitude ||
    edited.location.longitude !== pin.longitude
  ) {
    changes.latitude = edited.location.latitude
    changes.longitude = edited.location.longitude
  }
  return changes
}

/**
 * Popup for admins to change a pin's type, caption or location
 */
const EditMapPinForm = ({
  pin,
  renderLocationPicker,
  onSave,
  onCancel,
  isSaving,
  error
}: IEditMapPinForm) => {
  const titleId = useId()
  const [type, setType] = useState<MapPinType>(pin.type)
  const [caption, setCaption] = useState(pin.caption ?? "")
  const [location, setLocation] = useState<GpsLocation>({
    latitude: pin.latitude,
    longitude: pin.longitude
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onCancel])

  const changes = getMapPinChanges(pin, { type, caption, location })
  const hasChanges = Object.keys(changes).length > 0

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90vh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-md bg-white p-6"
        onSubmit={(event) => {
          event.preventDefault()
          if (hasChanges) onSave(changes)
        }}
      >
        <h3 id={titleId} className="text-dark-blue-100">
          Edit pin
        </h3>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-dark-blue-100 mb-2 font-bold">Type</legend>
          <div className="flex gap-2">
            {PIN_TYPES.map((pinType) => (
              <label
                key={pinType}
                className={`flex-1 cursor-pointer rounded-md border px-4 py-2 text-center font-bold ${
                  type === pinType
                    ? "bg-dark-blue-100 border-dark-blue-100 text-white"
                    : "border-gray-3 text-dark-blue-100 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="edit-pin-type"
                  value={pinType}
                  checked={type === pinType}
                  onChange={() => setType(pinType)}
                  className="sr-only"
                />
                {MAP_PIN_TYPE_LABELS[pinType]}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="text-dark-blue-100 font-bold">Caption</span>
          <textarea
            value={caption}
            maxLength={MAX_CAPTION_LENGTH}
            onChange={(event) => setCaption(event.target.value)}
            rows={2}
            className="border-gray-3 rounded-md"
          />
          <span className="text-gray-4 self-end text-xs">
            {caption.length}/{MAX_CAPTION_LENGTH}
          </span>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-dark-blue-100 font-bold">Location</span>
          <div className="border-gray-3 h-64 w-full overflow-hidden rounded-md border">
            {renderLocationPicker(location, setLocation)}
          </div>
          <p className="text-gray-4 text-sm">
            Drag the pin or tap the map to move it.
          </p>
        </div>

        {error && <p className="text-red text-sm">{error}</p>}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="border-dark-blue-100 text-dark-blue-100 flex-1 rounded-md border px-4 py-2 font-bold uppercase"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!hasChanges || isSaving}
            className="bg-dark-blue-100 disabled:bg-dark-blue-60 flex-1 rounded-md px-4 py-2 font-bold uppercase text-white"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditMapPinForm
