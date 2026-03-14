import type { Metadata } from "next"
import Gallery from "@/components/composite/Gallery/Gallery"
import {
  GALLERY_IMAGES_GROQ_QUERY,
  type GalleryImage
} from "@/models/sanity/GalleryImage/Utils"
import { sanityQuery } from "../../../../sanity/lib/utils"

export const metadata: Metadata = {
  title: "Gallery - UASC",
  description: "Photos from UASC trips, events, and life at the club"
}

const GalleryPage = async () => {
  const images = await sanityQuery<GalleryImage[]>(GALLERY_IMAGES_GROQ_QUERY)

  return <Gallery images={images} />
}

export default GalleryPage
