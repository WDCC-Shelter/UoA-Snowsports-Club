import type { Meta, StoryObj } from "@storybook/react"
import AdminMapPinsView from "./AdminMapPinsView"

const meta: Meta<typeof AdminMapPinsView> = {
  component: AdminMapPinsView
}
export default meta
type Story = StoryObj<typeof meta>

const pins = [1, 2, 3, 4].map((n) => ({
  id: `pin-${n}`,
  type: n % 2 === 0 ? ("member_photo" as const) : ("sticker" as const),
  caption: n === 1 ? "Sticker on the chairlift" : undefined,
  latitude: -39.2312,
  longitude: 175.5594,
  image_url: "https://placehold.co/600x600/png",
  created_at: { _seconds: 1794981600, _nanoseconds: 0 } as never,
  uploader_id: `member-${n}`,
  moderation_status: n === 2 ? ("flagged" as const) : ("approved" as const),
  ...(n === 2 && {
    safe_search: {
      adult: "LIKELY" as const,
      racy: "POSSIBLE" as const,
      violence: "VERY_UNLIKELY" as const,
      medical: "VERY_UNLIKELY" as const,
      spoof: "VERY_UNLIKELY" as const
    }
  })
}))

export const Default: Story = {
  args: { pins, hasMore: true }
}

export const WithPinsToReview: Story = {
  args: {
    pins,
    flaggedPins: pins.filter((pin) => pin.moderation_status === "flagged"),
    hasMore: true
  }
}

export const Empty: Story = {
  args: { pins: [] }
}
