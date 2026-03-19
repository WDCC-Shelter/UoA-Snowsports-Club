import type { Metadata } from "next"
import { sanityQuery } from "../../../../sanity/lib/utils"
import {
  WELLBEING_PAGE_GROQ_QUERY,
  type WellbeingPage
} from "@/models/sanity/WellbeingPage/Utils"
import WellbeingSection from "@/components/composite/WellbeingSection/WellbeingSection"
import { Footer } from "@/components/generic/Footer/Footer"

export const metadata: Metadata = {
  title: "Wellbeing - UASC",
  description: "Wellbeing resources and support from UASC"
}

const WellbeingPageRoute = async () => {
  const wellbeingPages = await sanityQuery<WellbeingPage[]>(
    WELLBEING_PAGE_GROQ_QUERY
  )
  const pageData = wellbeingPages?.[0]

  return (
    <>
      <div
        className="bg-mountain-background-image relative z-10 flex min-h-[100vh] w-fit
        min-w-full flex-col items-center bg-cover bg-top bg-no-repeat md:px-8"
      >
        {/* Tinted page overlay */}
        <div className="bg-gray-1 pointer-events-none absolute -z-30 h-full w-full opacity-70" />
        <div className="mb-4 flex max-w-[1100px] flex-col w-full gap-2">
          <h2 className="text-dark-blue-100 my-8 text-center italic">
            {pageData?.title || "Wellbeing"}
          </h2>
          {pageData?.description && (
            <p className="text-h4 text-black mb-8 text-center px-4">
              {pageData.description}
            </p>
          )}
          {pageData?.sections?.map((section, index) => (
            <WellbeingSection
              key={section._key || index}
              sectionTitle={section.sectionTitle}
              content={section.content}
              links={section.links}
            />
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default WellbeingPageRoute
