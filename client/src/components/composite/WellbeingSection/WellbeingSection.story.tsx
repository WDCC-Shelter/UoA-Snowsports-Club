import type { Meta } from "@storybook/react"
import WellbeingSection from "./WellbeingSection"

const meta: Meta<typeof WellbeingSection> = {
  component: WellbeingSection
}

export default meta

export const DefaultWellbeingSection = () => {
  const content = [
    {
      _type: "block",
      style: "normal",
      children: [
        {
          _type: "span",
          text: "Our wellbeing program supports guests with resources and external links to services that promote mental health and relaxation during their stay."
        }
      ]
    }
  ]

  const links = [
    { displayName: "Beyond Blue", url: "https://www.beyondblue.org.au" },
    { displayName: "Headspace", url: "https://www.headspace.com" }
  ]

  return (
    <WellbeingSection
      sectionTitle="Wellbeing"
      content={content as any}
      links={links}
    />
  )
}
