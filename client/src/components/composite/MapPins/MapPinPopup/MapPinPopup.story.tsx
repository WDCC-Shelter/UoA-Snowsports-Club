import type { Meta, StoryObj } from "@storybook/react"
import MapPinPopup from "./MapPinPopup"

const meta: Meta<typeof MapPinPopup> = {
  component: MapPinPopup
}
export default meta
type Story = StoryObj<typeof meta>

const pin = {
  id: "pin-1",
  type: "sticker" as const,
  caption: "Found one on the Sky Waka!",
  latitude: -39.2312,
  longitude: 175.5594,
  image_url: "https://placehold.co/600x600/png",
  created_at: { _seconds: 1794981600, _nanoseconds: 0 } as never
}

export const Default: Story = {
  args: { pin }
}

export const MemberPhotoWithoutCaption: Story = {
  args: { pin: { ...pin, type: "member_photo", caption: undefined } }
}

export const AdminCanDelete: Story = {
  args: { pin, canDelete: true }
}
