import type { MetadataRoute } from "next"

const FRONTEND_URL = process.env.FRONTEND_BASE_URL

export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.NEXT_CONFIG_ENV !== "production" || !FRONTEND_URL) return []

  return [
    {
      url: FRONTEND_URL,
      priority: 1
    },
    {
      url: `${FRONTEND_URL}/bookings`,
      priority: 0.9
    },
    {
      url: `${FRONTEND_URL}/events`,
      priority: 0.8
    },
    {
      url: `${FRONTEND_URL}/about`,
      priority: 0.7
    },
    {
      url: `${FRONTEND_URL}/about/faq`,
      priority: 0.7
    },
    {
      url: `${FRONTEND_URL}/about/gallery`,
      priority: 0.6
    },
    {
      url: `${FRONTEND_URL}/about/wellbeing`,
      priority: 0.6
    },
    {
      url: `${FRONTEND_URL}/contact`,
      priority: 0.5
    },
    {
      url: `${FRONTEND_URL}/register`,
      priority: 0.5
    },
    {
      url: `${FRONTEND_URL}/login`,
      priority: 0.4
    },
    {
      url: `${FRONTEND_URL}/shop`,
      priority: 0.4
    }
  ]
}
