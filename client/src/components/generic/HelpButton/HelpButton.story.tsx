import type { Meta, StoryObj } from "@storybook/react"
import HelpButton from "./HelpButton"

const meta: Meta<typeof HelpButton> = {
  component: HelpButton
}
export default meta
type Story = StoryObj<typeof meta>

const paragraph = (key: string, text: string) => ({
  _type: "block",
  _key: key,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: `${key}-span`, text, marks: [] }]
})

export const Default: Story = {
  args: {
    help: {
      title: "About the map",
      content: [
        paragraph(
          "1",
          "Every pin is a photo of a UASC sticker or members, taken somewhere in the world."
        ),
        paragraph(
          "2",
          "Zoom in to split up clusters, and tap a pin to see its photo."
        )
      ]
    }
  }
}

export const NoContent: Story = {
  args: { help: null }
}
