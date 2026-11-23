import type { Meta, StoryObj } from "@storybook/react"
import EditMapPinForm from "./EditMapPinForm"

const meta: Meta<typeof EditMapPinForm> = {
  component: EditMapPinForm
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    pin: {
      id: "pin-1",
      type: "sticker",
      caption: "Found one on the Sky Waka!",
      latitude: -39.2312,
      longitude: 175.5594,
      image_url: "https://placehold.co/600x600/png",
      created_at: { _seconds: 1794981600, _nanoseconds: 0 } as never,
      uploader_id: "member-uid",
      moderation_status: "approved"
    },
    renderLocationPicker: () => (
      <div className="bg-gray-2 flex h-full items-center justify-center">
        Map
      </div>
    )
  }
}
