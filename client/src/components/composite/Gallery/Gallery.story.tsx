import type { Meta, StoryObj } from "@storybook/react"
import Gallery from "./Gallery"
import type { GalleryImage } from "@/models/sanity/GalleryImage/Utils"

const meta = {
  title: "Composite/Gallery",
  component: Gallery,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
} satisfies Meta<typeof Gallery>

export default meta
type Story = StoryObj<typeof meta>

const mockImages: GalleryImage[] = [
  {
    _id: "1",
    title: "Cardrona Opening Weekend",
    description:
      "An incredible start to the season at Cardrona Alpine Resort. Perfect powder conditions greeted the club for the opening weekend, with blue skies all day.",
    imageUrl:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&auto=format",
    year: 2024,
    event: "Opening Weekend",
    location: "Cardrona Alpine Resort"
  },
  {
    _id: "2",
    title: "Club Racing Day",
    description:
      "Members put their skills to the test on the giant slalom course. A fantastic competitive atmosphere with some seriously quick times recorded.",
    imageUrl:
      "https://images.unsplash.com/photo-1548885991-553f4b7f20a6?w=800&auto=format",
    year: 2024,
    event: "Racing Day",
    location: "Coronet Peak"
  },
  {
    _id: "3",
    title: "Après-Ski Social",
    description:
      "After a long day on the slopes, the club gathered at the lodge for our annual après-ski social. Great food, great company, and plenty of stories from the mountain.",
    imageUrl:
      "https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=800&auto=format",
    year: 2024,
    event: "Social Night",
    location: "UASC Lodge"
  },
  {
    _id: "4",
    title: "Sunrise on the Peak",
    description:
      "An early morning hike rewarded us with this stunning sunrise over The Remarkables. Worth every step of the climb.",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format",
    year: 2024,
    location: "The Remarkables"
  },
  {
    _id: "5",
    title: "Group Photo — Winter Trip",
    description:
      "The full squad assembled for the annual winter trip. 40 members, 5 days, and more vertical metres than we could count.",
    imageUrl:
      "https://images.unsplash.com/photo-1610878180933-123728745d22?w=800&auto=format",
    year: 2023,
    event: "Winter Trip",
    location: "Queenstown"
  },
  {
    _id: "6",
    title: "Powder Day",
    description:
      "50cm overnight dump meant one thing — an early alarm and first tracks through untouched powder. Days like this are what the club is all about.",
    imageUrl:
      "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=800&auto=format",
    year: 2023,
    event: "Winter Trip",
    location: "Mt Hutt"
  },
  {
    _id: "7",
    title: "Beginners' Lesson Day",
    description:
      "We welcomed 15 new members onto the snow for the first time. By the end of the day everyone was making their way down the beginner trails with big smiles.",
    imageUrl:
      "https://images.unsplash.com/photo-1516139516-6a82da8b6a15?w=800&auto=format",
    year: 2023,
    event: "Learn to Ski",
    location: "Coronet Peak"
  },
  {
    _id: "8",
    title: "Lodge Weekend Getaway",
    description:
      "A quieter weekend retreat at the lodge. Board games, hot chocolates by the fire, and a gentle day on the slopes — the perfect reset.",
    imageUrl:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format",
    year: 2023,
    location: "UASC Lodge"
  },
  {
    _id: "9",
    title: "End of Season Banquet",
    description:
      "Celebrating another fantastic season together. Awards were handed out, memories were shared, and plans were already being made for next year.",
    imageUrl:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format",
    year: 2022,
    event: "End of Season",
    location: "Auckland"
  },
  {
    _id: "10",
    title: "Halfpipe Session",
    description:
      "Our freestyle crew spent the afternoon throwing tricks in the halfpipe. Some seriously impressive riding on show from the club's snowboard contingent.",
    imageUrl:
      "https://images.unsplash.com/photo-1602265585142-6b221d84e0af?w=800&auto=format",
    year: 2022,
    event: "Freestyle Day",
    location: "Cardrona Alpine Resort"
  }
]

export const Default: Story = {
  args: {
    images: mockImages
  }
}

export const SingleYear: Story = {
  name: "Single Year (No Filter Chips)",
  args: {
    images: mockImages.filter((img) => img.year === 2024)
  }
}

export const MinimalMetadata: Story = {
  name: "Images Without Optional Fields",
  args: {
    images: mockImages.map(({ event, location, ...rest }) => rest)
  }
}

export const EmptyState: Story = {
  name: "Empty State",
  args: {
    images: []
  }
}
