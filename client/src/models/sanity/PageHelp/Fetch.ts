import { sanityQuery } from "../../../../sanity/lib/utils"
import { type PageHelp, type PageHelpKey, pageHelpGroqQuery } from "./Utils"

/**
 * Fetches the help content for a page at build time. Returns `null` if there
 * is none or Sanity can't be reached, so a missing help menu never breaks the build.
 */
export const fetchPageHelp = async (
  page: PageHelpKey
): Promise<PageHelp | null> => {
  try {
    return (await sanityQuery<PageHelp | null>(pageHelpGroqQuery(page))) ?? null
  } catch (e) {
    console.error(`Failed to fetch help for page "${page}"`, e)
    return null
  }
}
