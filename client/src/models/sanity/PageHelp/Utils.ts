import type { PortableTextBlock } from "@portabletext/react"

/**
 * Pages that can have help content in Sanity. Add a key here (and use
 * `HelpButton` on the page) to give another page a help menu.
 */
export const PAGE_HELP_PAGES = {
  map: "Map (/map)",
  "map-new": "Post a map pin (/map/new)"
} as const

export type PageHelpKey = keyof typeof PAGE_HELP_PAGES

export type PageHelp = {
  title: string
  content?: PortableTextBlock[]
}

/**
 * Query for the help content of a single page
 */
export const pageHelpGroqQuery = (page: PageHelpKey) =>
  `*[_type == "page-help" && page == ${JSON.stringify(page)}][0]{title, content[]{..., _type == "image" => {"imageUrl": asset->url}}}` as const
