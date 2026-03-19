import type { PortableTextBlock } from "@portabletext/react"

export const WELLBEING_PAGE_GROQ_QUERY =
  `*[_type == "wellbeing-page"]{sections[]{content[]{..., _type == "image" => {"imageUrl": asset->url}}, "imageUrl": image.asset->url, ...}, ...}` as const

export type WellbeingLink = {
  displayName: string
  url: string
}

export type WellbeingSection = {
  _key: string
  sectionTitle?: string
  content?: PortableTextBlock[]
  links?: WellbeingLink[]
}

export type WellbeingPage = {
  _id: string
  title?: string
  description?: string
  sections?: WellbeingSection[]
}
