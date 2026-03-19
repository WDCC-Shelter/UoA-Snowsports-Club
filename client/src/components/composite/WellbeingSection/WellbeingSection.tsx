import PortableTextRenderer from "@/components/utils/PortableTextRender/PortableTextRenderer"
import type { PortableTextBlock } from "@portabletext/react"

export type WellbeingLinkProps = {
  displayName: string
  url: string
}

export interface IWellbeingSectionProps {
  /**
   * Optional heading for the section
   */
  sectionTitle?: string
  /**
   * Rich text content rendered via PortableTextRenderer
   */
  content?: PortableTextBlock[]
  /**
   * Array of external links to render as styled buttons
   */
  links?: WellbeingLinkProps[]
}

const ExternalLinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
)

const ResourceLinks = ({ links }: { links: WellbeingLinkProps[] }) => {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-light-blue-100 hover:bg-dark-blue-100 inline-flex items-center gap-2 rounded-md px-4 py-2 text-white transition-colors"
        >
          <span className="font-medium">{link.displayName}</span>
          <ExternalLinkIcon />
        </a>
      ))}
    </div>
  )
}

const WellbeingSection = ({
  sectionTitle,
  content,
  links
}: IWellbeingSectionProps) => {
  return (
    <div className="border-gray-3 flex w-full flex-col gap-10 rounded-md border bg-white p-8">
      {sectionTitle && (
        <h2 className="font-weight-bold text-dark-blue-100 italic">
          {sectionTitle}
        </h2>
      )}
      {content && <PortableTextRenderer value={content} />}
      {links && links.length > 0 && <ResourceLinks links={links} />}
    </div>
  )
}

export default WellbeingSection
