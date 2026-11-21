import { storage } from "business-layer/security/Firebase"
import { decideModeration } from "business-layer/utils/MapPinModeration"
import type { SafeSearchResult } from "data-layer/models/MapPin"
import MapPinService from "data-layer/services/MapPinService"
import MapPinImageService from "./MapPinImageService"
import SafeSearchService from "./SafeSearchService"

/**
 * The maximum number of pins checked in one run, to keep runs short and well
 * within the free 1000 images a month
 */
export const MAX_PINS_PER_RUN = 50

export type ModerationRunSummary = {
  approved: number
  flagged: number
  removed: number
  failed: number
}

type CheckImage = (image: Buffer) => Promise<SafeSearchResult>

/**
 * Checks the photos of pins that haven't been checked yet, and approves, hides
 * (flags) or deletes them
 */
export default class MapPinModerationService {
  /**
   * @param checkImage how photos are checked, defaults to Cloud Vision SafeSearch
   */
  constructor(
    private readonly checkImage: CheckImage = (image) =>
      new SafeSearchService().check(image),
    private readonly mapPinService = new MapPinService(),
    private readonly imageService = new MapPinImageService()
  ) {}

  public async moderatePendingPins(
    limit: number = MAX_PINS_PER_RUN
  ): Promise<ModerationRunSummary> {
    const summary: ModerationRunSummary = {
      approved: 0,
      flagged: 0,
      removed: 0,
      failed: 0
    }
    const pins = await this.mapPinService.getPendingMapPins(limit)

    // One at a time, as volume is low and it keeps memory use small
    for (const pin of pins) {
      try {
        const [image] = await storage.bucket().file(pin.image_path).download()
        const result = await this.checkImage(image)

        switch (decideModeration(result)) {
          case "remove":
            await this.imageService.deleteImage(pin.image_path)
            await this.mapPinService.deleteMapPin(pin.id)
            // Logged so there's a record of what was removed and why
            console.warn(
              `[map-pin-moderation] removed pin ${pin.id} by ${pin.uploader_id}`,
              result
            )
            summary.removed++
            break
          case "flag":
            await this.mapPinService.setModerationStatus(
              pin.id,
              "flagged",
              result
            )
            summary.flagged++
            break
          case "approve":
            await this.mapPinService.setModerationStatus(
              pin.id,
              "approved",
              result
            )
            summary.approved++
            break
        }
      } catch (e) {
        // Left as pending so it's retried on the next run
        console.error(`[map-pin-moderation] failed to check pin ${pin.id}`, e)
        summary.failed++
      }
    }
    return summary
  }
}
