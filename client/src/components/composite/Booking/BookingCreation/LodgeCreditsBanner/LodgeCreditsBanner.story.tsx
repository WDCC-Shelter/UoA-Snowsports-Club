export { default as LodgeCreditsBanner } from "./LodgeCreditsBanner"
import type { Meta, StoryObj } from "@storybook/react"
import LodgeCreditsBanner from "./LodgeCreditsBanner"

const meta: Meta<typeof LodgeCreditsBanner> = {
  component: LodgeCreditsBanner
}

export default meta
type Story = StoryObj<typeof meta>

export const SingleCredit: Story = {
  args: {
    availableCredits: 1
  }
}

export const MultipleCredits: Story = {
  args: {
    availableCredits: 5
  }
}

export const NoCredits: Story = {
  args: {
    availableCredits: 0
  }
}
