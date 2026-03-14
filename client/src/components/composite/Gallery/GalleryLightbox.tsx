"use client"

import Image from "next/image"
import { useEffect, useCallback } from "react"
import type { GalleryImage } from "@/models/sanity/GalleryImage/Utils"
import CloseSign from "@/assets/icons/close_sign.svg"

interface GalleryLightboxProps {
  image: GalleryImage | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}

const GalleryLightbox = ({
  image,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext
}: GalleryLightboxProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && hasPrev) onPrev()
      if (e.key === "ArrowRight" && hasNext) onNext()
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  )

  useEffect(() => {
    if (!image) return
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [image, handleKeyDown])

  if (!image) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 md:p-8"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close lightbox"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full
          bg-white/10 text-white transition-colors hover:bg-white/25"
      >
        <CloseSign className="h-4 w-4 fill-white" />
      </button>

      {/* Prev button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onPrev()
        }}
        disabled={!hasPrev}
        aria-label="Previous image"
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center
          justify-center rounded-full bg-white/10 text-white transition-colors
          hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-30 md:left-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Next button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onNext()
        }}
        disabled={!hasNext}
        aria-label="Next image"
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center
          justify-center rounded-full bg-white/10 text-white transition-colors
          hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-30 md:right-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Content card — stop propagation so clicking it doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden
          rounded-sm bg-black shadow-2xl md:flex-row"
      >
        {/* Image area */}
        <div className="relative min-h-[50vw] w-full flex-shrink-0 bg-black md:min-h-0 md:w-[65%]">
          <Image
            src={image.lightboxUrl}
            alt={image.title}
            fill
            sizes="(max-width: 768px) 100vw, 65vw"
            className="object-contain"
            priority
          />
        </div>

        {/* Info panel */}
        <div className="flex flex-col gap-3 overflow-y-auto bg-white p-6 md:w-[35%]">
          {/* Year / event chip row */}
          <div className="flex flex-wrap gap-2">
            <span
              className="bg-light-blue-100 rounded-full px-3 py-0.5 text-[0.7rem]
                font-bold uppercase tracking-widest text-white"
            >
              {image.year}
            </span>
            {image.event && (
              <span
                className="border-light-blue-60 text-dark-blue-100 rounded-full border px-3
                  py-0.5 text-[0.7rem] font-semibold uppercase tracking-widest"
              >
                {image.event}
              </span>
            )}
          </div>

          <h3 className="text-dark-blue-100 font-bold leading-snug">
            {image.title}
          </h3>

          {image.location && (
            <p className="text-gray-4 flex items-center gap-1.5 text-[0.8rem] font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-light-blue-100 h-3.5 w-3.5 flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.43-4.793 3.43-8.083a8.72 8.72 0 00-8.72-8.72 8.72 8.72 0 00-8.72 8.72c0 3.29 1.487 6.004 3.43 8.083a19.58 19.58 0 002.683 2.282c.348.244.694.467 1.03.665l.116.067zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              {image.location}
            </p>
          )}

          <div className="bg-gray-2 h-px w-full" />

          <p className="text-gray-4 flex-1 text-[0.9rem] leading-relaxed">
            {image.description}
          </p>
        </div>
      </div>
    </div>
  )
}

export default GalleryLightbox
