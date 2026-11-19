import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import MapPinPopup from "../MapPinPopup/MapPinPopup"
import PinMap from "./PinMap"

const meta: Meta<typeof PinMap> = {
  component: PinMap,
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

const created_at = { _seconds: 1794981600, _nanoseconds: 0 } as never

const pins = [
  [-36.8485, 174.7633],
  [-36.85, 174.77],
  [-36.86, 174.75],
  [-41.2865, 174.7762],
  [-45.0312, 168.6626],
  [-39.2312, 175.5594]
].map(([latitude, longitude], i) => ({
  id: `pin-${i}`,
  type: i % 2 === 0 ? ("sticker" as const) : ("member_photo" as const),
  caption: `Pin ${i}`,
  latitude,
  longitude,
  image_url: "https://placehold.co/600x600/png",
  created_at
}))

export const Default: Story = {
  args: { pins }
}

export const WithPopups: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string>()
    return (
      <PinMap
        {...args}
        pins={args.pins || []}
        selectedPinId={selected}
        onSelectPin={setSelected}
        renderPopup={(pin) => <MapPinPopup pin={pin} />}
      />
    )
  },
  args: { pins }
}
