import { admin } from "business-layer/security/Firebase"
import type { SafeSearchResult } from "data-layer/models/MapPin"

const VISION_ANNOTATE_URL = "https://vision.googleapis.com/v1/images:annotate"

type AnnotateResponse = {
  responses?: Array<{
    safeSearchAnnotation?: SafeSearchResult
    error?: { code: number; message: string }
  }>
  error?: { code: number; message: string; status?: string }
}

/**
 * Checks photos for inappropriate content using Google Cloud Vision SafeSearch.
 *
 * Authenticates with the same service account as the rest of the server, so the
 * only setup needed is enabling the Cloud Vision API on the Google Cloud project.
 * The first 1000 images a month are free.
 */
export default class SafeSearchService {
  /**
   * @param image the contents of the image (JPEG, PNG, WebP, etc.)
   * @throws if the Vision API returns an error, i.e it isn't enabled for the project
   */
  public async check(image: Buffer): Promise<SafeSearchResult> {
    const { access_token } = await admin
      .app()
      .options.credential!.getAccessToken()

    const response = await fetch(VISION_ANNOTATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requests: [
          {
            image: { content: image.toString("base64") },
            features: [{ type: "SAFE_SEARCH_DETECTION" }]
          }
        ]
      })
    })

    const body = (await response.json()) as AnnotateResponse
    const result = body.responses?.[0]
    const error = body.error ?? result?.error
    if (!response.ok || error || !result?.safeSearchAnnotation) {
      throw new Error(
        `Cloud Vision SafeSearch failed (HTTP ${response.status}): ${
          error?.message ?? "no result returned"
        }`
      )
    }
    return result.safeSearchAnnotation
  }
}
