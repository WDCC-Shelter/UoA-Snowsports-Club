"use client"

import { useEffect, useId, useState } from "react"
import CloseSign from "@/assets/icons/close_sign.svg"
import PortableTextRenderer from "@/components/utils/PortableTextRender/PortableTextRenderer"
import type { PageHelp } from "@/models/sanity/PageHelp/Utils"

export interface IHelpButton {
  /**
   * Help content from Sanity. Nothing is rendered if there is none, so pages
   * can use this before any content has been written.
   */
  help?: PageHelp | null
  /**
   * Classes for positioning the button, i.e `absolute left-4 top-4`
   */
  className?: string
}

/**
 * A "?" button that opens a popup explaining the current page, with content
 * managed in Sanity (see the `page-help` schema)
 */
const HelpButton = ({ help, className = "" }: IHelpButton) => {
  const [isOpen, setIsOpen] = useState(false)
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen])

  if (!help) return null

  return (
    <>
      <button
        type="button"
        aria-label={`Help: ${help.title}`}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
        className={`bg-dark-blue-100 z-10 flex size-10 items-center justify-center rounded-full text-xl font-bold text-white shadow-lg ${className}`}
      >
        ?
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-md bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close help"
              onClick={() => setIsOpen(false)}
              className="bg-dark-blue-100 absolute right-4 top-4 flex size-7 items-center justify-center rounded-full"
            >
              {/* The icon is white, so it needs a dark background */}
              <CloseSign />
            </button>
            <h3 id={titleId} className="text-dark-blue-100 mb-4 pr-8">
              {help.title}
            </h3>
            {help.content && <PortableTextRenderer value={help.content} />}
          </div>
        </div>
      )}
    </>
  )
}

export default HelpButton
