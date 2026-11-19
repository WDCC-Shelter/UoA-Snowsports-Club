import { defineField, type SchemaTypeDefinition } from "sanity"
import { apiVersion } from "../../../../sanity/env"
import { PAGE_HELP_PAGES } from "./Utils"

export const PageHelpSchema: SchemaTypeDefinition = {
  name: "page-help",
  title: "Page Help",
  description:
    "Help shown in a popup when the help (?) button is pressed on a page",
  type: "document",
  fields: [
    defineField({
      name: "page",
      title: "Page",
      description: "Which page this help is shown on. Only one per page.",
      type: "string",
      options: {
        list: Object.entries(PAGE_HELP_PAGES).map(([value, title]) => ({
          value,
          title
        }))
      },
      validation: (v) =>
        v.required().custom(async (page, context) => {
          // Only one help document per page, otherwise which one shows is undefined
          const id = context.document?._id.replace(/^drafts\./, "")
          const others = await context
            .getClient({ apiVersion })
            .fetch<number>(
              `count(*[_type == "page-help" && page == $page && !(_id in [$id, $draftId])])`,
              { page, id, draftId: `drafts.${id}` }
            )
          return others === 0 || "This page already has help content"
        })
    }),
    defineField({
      name: "title",
      title: "Title",
      description: "Heading of the help popup",
      type: "string",
      validation: (v) => v.required()
    }),
    defineField({
      name: "content",
      title: "Content",
      description: "Explanation of the page, supports inline images",
      type: "array",
      of: [{ type: "block" }, { type: "image" }]
    })
  ],
  preview: {
    select: { title: "title", page: "page" },
    prepare: ({ title, page }) => ({
      title,
      subtitle: PAGE_HELP_PAGES[page as keyof typeof PAGE_HELP_PAGES] ?? page
    })
  }
}
