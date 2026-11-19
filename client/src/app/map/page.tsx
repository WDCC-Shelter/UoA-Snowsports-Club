import type { Metadata } from "next"
import { fetchPageHelp } from "@/models/sanity/PageHelp/Fetch"
import MapPageClient from "./MapPageClient"

export const metadata: Metadata = {
  title: "Map | University of Auckland Snowsports Club",
  description:
    "See where UASC stickers and members have turned up around the world.",
  openGraph: {
    title: "Map | University of Auckland Snowsports Club",
    description:
      "See where UASC stickers and members have turned up around the world.",
    type: "website"
  }
}

const MapPage = async () => {
  const help = await fetchPageHelp("map")
  return <MapPageClient help={help} />
}

export default MapPage
