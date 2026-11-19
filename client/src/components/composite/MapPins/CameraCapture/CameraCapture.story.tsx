import type { Meta, StoryObj } from "@storybook/react"
import CameraCapture from "./CameraCapture"

const meta: Meta<typeof CameraCapture> = {
  component: CameraCapture,
  decorators: [
    (Story) => (
      <div style={{ height: "80vh" }}>
        <Story />
      </div>
    )
  ]
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
