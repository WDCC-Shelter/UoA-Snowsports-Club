import Image from "next/image"
import type { GalleryImage } from "@/models/sanity/GalleryImage/Utils"

export interface GalleryImageCardProps
  extends Pick<
    GalleryImage,
    "title" | "description" | "imageUrl" | "year" | "event" | "location"
  > {
  onClick?: () => void
}

const GalleryImageCard = ({
  title,
  description,
  imageUrl,
  year,
  event,
  location,
  onClick
}: GalleryImageCardProps) => {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-square h-full w-full cursor-pointer overflow-hidden rounded-sm"
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Dark gradient overlay - always present at bottom for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Full overlay on hover */}
      <div className="bg-dark-blue-100 absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-85" />

      {/* Bottom title — visible by default */}
      <div className="absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-300 group-hover:opacity-0">
        <p className="truncate text-[small] font-semibold uppercase tracking-wider text-white">
          {title}
        </p>
        {(event || location) && (
          <p className="truncate text-[0.7rem] text-white/70">
            {[event, location].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {/* Hover detail panel */}
      <div className="absolute inset-0 flex translate-y-2 flex-col justify-center gap-2 p-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/60">
          {year}
          {event ? ` · ${event}` : ""}
        </p>
        <h4 className="font-bold leading-tight text-white">{title}</h4>
        <p className="mt-1 line-clamp-4 text-[0.85rem] leading-relaxed text-white/80">
          {description}
        </p>
        {location && (
          <p className="mt-auto text-[0.7rem] font-medium uppercase tracking-wider text-white/50">
            📍 {location}
          </p>
        )}
      </div>
    </div>
  )
}

export default GalleryImageCard
