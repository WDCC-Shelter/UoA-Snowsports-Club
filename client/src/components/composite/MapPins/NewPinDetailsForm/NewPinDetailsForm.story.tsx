import type { Meta, StoryObj } from "@storybook/react"
import NewPinDetailsForm from "./NewPinDetailsForm"

const meta: Meta<typeof NewPinDetailsForm> = {
  component: NewPinDetailsForm
}
export default meta
type Story = StoryObj<typeof meta>

const base = {
  previewUrl: "https://placehold.co/600x600/png",
  locationPicker: (
    <div className="bg-gray-2 flex h-full items-center justify-center">Map</div>
  ),
  type: "sticker" as const,
  caption: ""
}

export const LocationFromPhoto: Story = {
  args: { ...base, hasLocation: true, locationSource: "photo" }
}

export const NoLocation: Story = {
  args: { ...base, hasLocation: false }
}

export const LocationError: Story = {
  args: {
    ...base,
    hasLocation: false,
    locationError: "Couldn't get your location"
  }
}

export const Submitting: Story = {
  args: {
    ...base,
    hasLocation: true,
    locationSource: "map",
    caption: "Sticker on the chairlift",
    isSubmitting: true
  }
}
