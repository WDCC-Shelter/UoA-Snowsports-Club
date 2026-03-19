import { type SchemaTypeDefinition, defineField } from "sanity"

export const WellbeingPageSchema: SchemaTypeDefinition = {
  name: "wellbeing-page",
  title: "Wellbeing Page",
  description: "Content for the club wellbeing and welfare page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      description:
        "The page heading displayed at the top of the wellbeing page",
      type: "string",
      validation: (v) => v.required()
    }),
    defineField({
      name: "description",
      title: "Description",
      description: "A brief intro or subtitle for the wellbeing page",
      type: "text"
    }),
    defineField({
      name: "sections",
      title: "Sections",
      description: "Content sections that make up the wellbeing page",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "sectionTitle",
              title: "Section Title",
              description: "Optional heading for this section",
              type: "string"
            }),
            defineField({
              name: "content",
              title: "Content",
              description:
                "Rich text content for this section, supports inline images",
              type: "array",
              of: [{ type: "block" }, { type: "image" }]
            }),
            defineField({
              name: "links",
              title: "Links",
              description:
                "Optional list of external resource links for this section",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    {
                      name: "displayName",
                      title: "Display Name",
                      description: "The text shown for the link",
                      type: "string",
                      validation: (v) => v.required()
                    },
                    {
                      name: "url",
                      title: "URL",
                      description: "The full URL the link points to",
                      type: "url",
                      validation: (v) => v.required()
                    }
                  ]
                }
              ]
            })
          ]
        }
      ]
    })
  ]
}
