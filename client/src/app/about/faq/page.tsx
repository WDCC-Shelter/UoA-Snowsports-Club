import type { Metadata } from "next"
import FAQ from "@/components/composite/FAQ/FAQ"
import {
  FAQ_CATEGORIES_GROQ_QUERY,
  type FAQCategory
} from "@/models/sanity/FAQCategory/Utils"
import { sanityQuery } from "../../../../sanity/lib/utils"

export const metadata: Metadata = {
  title: "FAQ | University of Auckland Snowsports Club",
  description:
    "Find answers to frequently asked questions about UASC membership, lodge bookings, pricing, events, and more.",
  openGraph: {
    title: "FAQ | University of Auckland Snowsports Club",
    description:
      "Find answers to frequently asked questions about UASC membership, lodge bookings, pricing, events, and more.",
    type: "website"
  }
}

const FAQPage = async () => {
  const faqCategories = await sanityQuery<FAQCategory[]>(
    FAQ_CATEGORIES_GROQ_QUERY
  )

  return <FAQ categories={faqCategories} />
}

export default FAQPage
