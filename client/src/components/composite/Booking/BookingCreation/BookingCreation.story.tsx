import type { Meta, StoryObj } from "@storybook/react"
import { CreateBookingSection } from "./BookingCreation"

const meta: Meta<typeof CreateBookingSection> = {
  component: CreateBookingSection
}

export default meta
type Story = StoryObj<typeof meta>

export const DefaultCreateBookingPage: Story = {
  decorators: [(Story) => <Story />],
  args: {
    lodgePrices: {
      normal: 69,
      weekend: 200,
      singleFridayOrSaturday: 420
    }
  }
}
