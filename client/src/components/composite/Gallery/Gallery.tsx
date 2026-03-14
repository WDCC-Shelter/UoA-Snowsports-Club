"use client"

import { useState, useMemo } from "react"
import { Footer } from "@/components/generic/Footer/Footer"
import GalleryImageCard from "@/components/generic/GalleryImageCard/GalleryImageCard"
import GalleryLightbox from "./GalleryLightbox"
import type { GalleryImage } from "@/models/sanity/GalleryImage/Utils"

export interface GalleryImageFormat extends GalleryImage {
  thumbnailUrl: string
  lightboxUrl: string
}
interface IGallery {
  images: GalleryImageFormat[]
}

const ALL_YEARS_LABEL = "All"

const Gallery = ({ images }: IGallery) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [activeImage, setActiveImage] = useState<GalleryImage | null>(null)

  const years = useMemo(() => {
    return Array.from(new Set(images.map((img) => img.year))).sort(
      (a, b) => b - a
    )
  }, [images])

  const filteredImages = useMemo(() => {
    if (selectedYear === null) return images
    return images.filter((img) => img.year === selectedYear)
  }, [images, selectedYear])

  const activeIndex = useMemo(() => {
    if (!activeImage) return -1
    return filteredImages.findIndex((img) => img._id === activeImage._id)
  }, [activeImage, filteredImages])

  const handlePrev = () => {
    if (activeIndex > 0) setActiveImage(filteredImages[activeIndex - 1])
  }

  const handleNext = () => {
    if (activeIndex < filteredImages.length - 1)
      setActiveImage(filteredImages[activeIndex + 1])
  }

  return (
    <>
      <div
        className="bg-mountain-background-image relative z-10 flex min-h-[100vh] w-fit
        min-w-full flex-col items-center bg-cover bg-top bg-no-repeat md:px-8"
      >
        {/* Tinted page overlay */}
        <div className="bg-gray-1 pointer-events-none absolute -z-30 h-full w-full opacity-70" />

        <div className="z-20 flex w-full max-w-[1100px] flex-col items-center gap-6 pb-12 pt-16">
          {/* Header */}
          <div className="flex w-full flex-col gap-2">
            <h2 className="text-dark-blue-100 mr-auto italic">Gallery</h2>
          </div>

          {/* Year filter chips */}
          {years.length > 1 && (
            <div className="flex w-full flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedYear(null)}
                className={`rounded-full border px-4 py-1.5 text-[0.75rem] font-bold uppercase
                  tracking-widest transition-colors duration-200
                  ${
                    selectedYear === null
                      ? "bg-dark-blue-100 border-dark-blue-100 text-white"
                      : "border-gray-3 text-gray--4 hover:border-dark-blue-100 hover:text-dark-blue-100 bg-white"
                  }`}
              >
                {ALL_YEARS_LABEL}
              </button>
              {years.map((year) => (
                <button
                  type="button"
                  key={year}
                  onClick={() =>
                    setSelectedYear(year === selectedYear ? null : year)
                  }
                  className={`rounded-full border px-4 py-1.5 text-[0.75rem] font-bold uppercase
                    tracking-widest transition-colors duration-200
                    ${
                      selectedYear === year
                        ? "bg-dark-blue-100 border-dark-blue-100 text-white"
                        : "border-gray-3 bg-white text-gray-4 hover:border-dark-blue-100 hover:text-dark-blue-100"
                    }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {/* Image count */}
          <p className="text-gray-4 mr-auto text-[0.8rem]">
            {filteredImages.length}{" "}
            {filteredImages.length === 1 ? "photo" : "photos"}
            {selectedYear !== null ? ` from ${selectedYear}` : ""}
          </p>

          {/* Grid */}
          {filteredImages.length === 0 ? (
            <div className="flex w-full flex-col items-center justify-center gap-3 rounded-sm border border-black bg-white py-24">
              <p className="text-gray-4 text-center">
                No photos available{selectedYear ? ` for ${selectedYear}` : ""}.
              </p>
              {selectedYear && (
                <button
                  type="button"
                  onClick={() => setSelectedYear(null)}
                  className="text-light-blue-100 text-[0.85rem] underline underline-offset-2"
                >
                  View all photos
                </button>
              )}
            </div>
          ) : (
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredImages.map((image, index) => {
                // Every 7th image starting from the 1st (index 0, 7, 14…) spans 2 columns on lg
                const isWide = index % 7 === 0
                return (
                  <div
                    key={image._id}
                    className={isWide ? "sm:col-span-2 lg:col-span-2" : ""}
                  >
                    <GalleryImageCard
                      title={image.title}
                      description={image.description}
                      imageUrl={image.thumbnailUrl}
                      year={image.year}
                      event={image.event}
                      location={image.location}
                      onClick={() => setActiveImage(image)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Lightbox */}
      <GalleryLightbox
        image={activeImage}
        onClose={() => setActiveImage(null)}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={activeIndex > 0}
        hasNext={activeIndex < filteredImages.length - 1}
      />
    </>
  )
}

export default Gallery
