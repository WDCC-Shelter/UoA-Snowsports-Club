import type { Meta, StoryObj } from "@storybook/react"
import GalleryImageCard, {
  type GalleryImageCardProps
} from "./GalleryImageCard"

const meta = {
  title: "Components/generic/GalleryImageCard",
  component: GalleryImageCard,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"]
} satisfies Meta<typeof GalleryImageCard>

export default meta
type Story = StoryObj<typeof meta>

const MOCK_IMAGE_URL =
  "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&q=80"

export const Default: Story = {
  args: {
    title: "Club Trip to Mt Ruapehu",
    description:
      "An amazing weekend on the mountain with UASC members. Perfect snow conditions and great vibes all around.",
    imageUrl: MOCK_IMAGE_URL,
    year: 2024,
    event: "Winter Trip",
    location: "Mt Ruapehu, NZ"
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    )
  ]
}

export const WithoutOptionalFields: Story = {
  name: "Without Optional Fields (no event or location)",
  args: {
    title: "Opening Weekend",
    description:
      "The first weekend of the season — fresh powder and good company.",
    imageUrl: MOCK_IMAGE_URL,
    year: 2023
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    )
  ]
}

export const WithClickHandler: Story = {
  name: "With Click Handler (opens lightbox)",
  args: {
    title: "End of Season Party",
    description:
      "Celebrating another great season at the lodge with friends, food, and way too much fun.",
    imageUrl: MOCK_IMAGE_URL,
    year: 2024,
    event: "Social Event",
    location: "UASC Lodge",
    onClick: () => alert("Image clicked — lightbox would open here!")
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    )
  ]
}

export const LongContent: Story = {
  name: "Long Title & Description",
  args: {
    title:
      "This Is An Exceptionally Long Image Title That Should Be Truncated In The Card",
    description:
      "A very detailed description of this particular photo that goes on for quite some time. It covers the weather conditions, the people involved, the exact run they were on, and the general mood of the day. This should be clamped to four lines in the hover panel.",
    imageUrl: MOCK_IMAGE_URL,
    year: 2022,
    event: "Interclub Championship",
    location: "Whakapapa Ski Area, Mt Ruapehu"
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    )
  ]
}

export const GridPreview: Story = {
  name: "Grid Preview (3 cards)",
  render: (args: GalleryImageCardProps) => (
    <div className="grid w-[900px] grid-cols-3 gap-2">
      <GalleryImageCard {...args} title="Winter Trip 2024" year={2024} />
      <GalleryImageCard
        {...args}
        title="Opening Weekend"
        year={2023}
        event={undefined}
        location={undefined}
      />
      <GalleryImageCard
        {...args}
        title="End of Season Party"
        year={2022}
        event="Social Event"
      />
    </div>
  ),
  args: {
    title: "Sample Image Title",
    description: "An amazing time on the mountain with UASC members.",
    imageUrl: MOCK_IMAGE_URL,
    year: 2024,
    event: "Winter Trip",
    location: "Mt Ruapehu, NZ"
  }
}
