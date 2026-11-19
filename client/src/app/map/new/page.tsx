import type { Metadata } from "next"
import { fetchPageHelp } from "@/models/sanity/PageHelp/Fetch"
import NewMapPinPageClient from "./NewMapPinPageClient"

export const metadata: Metadata = {
  title: "Post a pin | University of Auckland Snowsports Club"
}

const NewMapPinPage = async () => {
  const help = await fetchPageHelp("map-new")
  return <NewMapPinPageClient help={help} />
}

export default NewMapPinPage
