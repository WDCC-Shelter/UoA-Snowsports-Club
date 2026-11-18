import type { ReactNode } from "react"
import { MAP_PIN_TYPE_LABELS, type MapPinType } from "@/models/MapPin"

export const MAX_CAPTION_LENGTH = 140

export interface INewPinDetailsForm {
  /**
   * Object URL of the photo being posted
   */
  previewUrl: string
  /**
   * The map used to choose the location, passed in as it must be loaded client side only
   */
  locationPicker: ReactNode
  hasLocation: boolean
  /**
   * Where the current location came from, shown as a hint
   */
  locationSource?: "photo" | "device" | "map"
  onUseCurrentLocation: () => void
  isLocating?: boolean
  locationError?: string
  type: MapPinType
  onTypeChange: (type: MapPinType) => void
  caption: string
  onCaptionChange: (caption: string) => void
  onRetake: () => void
  onSubmit: () => void
  isSubmitting?: boolean
  error?: string
}

const LOCATION_SOURCE_HINTS = {
  photo: "Location taken from the photo. Drag the pin if it's not right.",
  device: "Using your current location. Drag the pin if it's not right.",
  map: "Drag the pin or tap the map to move it."
} as const

const PIN_TYPES: MapPinType[] = ["sticker", "member_photo"]

/**
 * Second step of posting a pin: confirming the location and adding details
 */
const NewPinDetailsForm = ({
  previewUrl,
  locationPicker,
  hasLocation,
  locationSource,
  onUseCurrentLocation,
  isLocating,
  locationError,
  type,
  onTypeChange,
  caption,
  onCaptionChange,
  onRetake,
  onSubmit,
  isSubmitting,
  error
}: INewPinDetailsForm) => {
  return (
    <form
      className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="flex items-start gap-4">
        {/* biome-ignore lint/performance/noImgElement: object URL preview, can't be optimised */}
        <img
          src={previewUrl}
          alt="Preview of the new pin"
          className="size-28 shrink-0 rounded-md object-cover"
        />
        <button
          type="button"
          onClick={onRetake}
          className="text-dark-blue-100 text-sm font-bold underline"
        >
          Retake
        </button>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-dark-blue-100 mb-2 font-bold">
          What&apos;s in the photo?
        </legend>
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
                name="pin-type"
                value={pinType}
                checked={type === pinType}
                onChange={() => onTypeChange(pinType)}
                className="sr-only"
              />
              {MAP_PIN_TYPE_LABELS[pinType]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-dark-blue-100 font-bold">Location</span>
          <button
            type="button"
            onClick={onUseCurrentLocation}
            disabled={isLocating}
            className="text-dark-blue-100 text-sm font-bold underline disabled:opacity-50"
          >
            {isLocating ? "Locating..." : "Use my current location"}
          </button>
        </div>
        <div className="border-gray-3 h-64 w-full overflow-hidden rounded-md border">
          {locationPicker}
        </div>
        <p className="text-gray-4 text-sm">
          {locationError ||
            (hasLocation && locationSource
              ? LOCATION_SOURCE_HINTS[locationSource]
              : "Tap the map to place the pin.")}
        </p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-dark-blue-100 font-bold">Caption (optional)</span>
        <textarea
          value={caption}
          maxLength={MAX_CAPTION_LENGTH}
          onChange={(event) => onCaptionChange(event.target.value)}
          rows={2}
          className="border-gray-3 rounded-md"
        />
        <span className="text-gray-4 self-end text-xs">
          {caption.length}/{MAX_CAPTION_LENGTH}
        </span>
      </label>

      {error && <p className="text-red text-sm">{error}</p>}

      <button
        type="submit"
        disabled={!hasLocation || isSubmitting}
        className="bg-dark-blue-100 disabled:bg-dark-blue-60 rounded-md px-8 py-3 font-bold uppercase text-white"
      >
        {isSubmitting ? "Posting..." : "Post pin"}
      </button>
    </form>
  )
}

export default NewPinDetailsForm
