export { default as LodgeCreditsBanner } from "./LodgeCreditsBanner"
import type { Meta, StoryObj } from "@storybook/react"
import LodgeCreditsBanner from "./LodgeCreditsBanner"

const meta: Meta<typeof LodgeCreditsBanner> = {
  component: LodgeCreditsBanner
}

export default meta
type Story = StoryObj<typeof meta>

export const SingleAnyNightCredit: Story = {
  args: {
    availableCredits: { anyNight: 1, weekNightsOnly: 0 }
  }
}

export const SingleWeekNightCredit: Story = {
  args: {
    availableCredits: { anyNight: 0, weekNightsOnly: 1 }
  }
}

export const MultipleAnyNightCredits: Story = {
  args: {
    availableCredits: { anyNight: 5, weekNightsOnly: 0 }
  }
}

export const MultipleWeekNightCredits: Story = {
  args: {
    availableCredits: { anyNight: 0, weekNightsOnly: 3 }
  }
}

export const MixedCredits: Story = {
  args: {
    availableCredits: { anyNight: 2, weekNightsOnly: 3 }
  }
}

export const NoCredits: Story = {
  args: {
    availableCredits: { anyNight: 0, weekNightsOnly: 0 }
  }
}
