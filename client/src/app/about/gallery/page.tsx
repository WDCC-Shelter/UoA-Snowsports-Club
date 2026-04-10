import type { Metadata } from "next"
import Gallery from "@/components/composite/Gallery/Gallery"
import {
  GALLERY_IMAGES_GROQ_QUERY,
  type GalleryImage
} from "@/models/sanity/GalleryImage/Utils"
import { SanityImageUrl, sanityQuery } from "../../../../sanity/lib/utils"

export const metadata: Metadata = {
  title: "Gallery - UASC",
  description: "Photos from UASC trips, events, and life at the club"
}

const GalleryPage = async () => {
  const images = await sanityQuery<GalleryImage[]>(GALLERY_IMAGES_GROQ_QUERY)

  // URL construction lives here in the server component rather than inside
  // presentation components so that:
  //   1. The transformation runs once at build/request time on the server,
  //      not on every client render.
  //   2. Presentation components stay pure — they receive plain strings and
  //      have no knowledge of the Sanity CDN or image pipeline.
  //
  // autoFormat()  → instructs Sanity's CDN to serve WebP where the browser
  //                 supports it, reducing file size with no visual loss.
  // width()       → tells the CDN to downscale the image to the largest size
  //                 it will ever be displayed at, so the browser never
  //                 downloads more pixels than it can actually render:
  //                   - all thumbnail cards use 1200 px for high quality
  //                   - lightbox occupies up to 65 vw on a    → 1600 px
  //                     large screen
  const sortedImages = [...images].sort((a, b) => b.year - a.year)

  const enrichedImages = sortedImages.map((image) => {
    return {
      ...image,
      thumbnailUrl: image.imageUrl
        ? new SanityImageUrl(image.imageUrl).autoFormat().width(1200).toString()
        : image.imageUrl,
      lightboxUrl: image.imageUrl
        ? new SanityImageUrl(image.imageUrl).autoFormat().width(1600).toString()
        : image.imageUrl
    }
  })

  return <Gallery images={enrichedImages} />
}

export default GalleryPage
