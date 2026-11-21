import { storage } from "business-layer/security/Firebase"
import type { MapPin, SafeSearchResult } from "data-layer/models/MapPin"
import MapPinService from "data-layer/services/MapPinService"
import { Timestamp } from "firebase-admin/firestore"
import { cleanFirestore } from "test-config/TestUtils"
import MapPinImageService from "./MapPinImageService"
import MapPinModerationService from "./MapPinModerationService"

const mapPinService = new MapPinService()
const imageService = new MapPinImageService()

const clean: SafeSearchResult = {
  adult: "VERY_UNLIKELY",
  racy: "UNLIKELY",
  violence: "VERY_UNLIKELY",
  medical: "VERY_UNLIKELY",
  spoof: "UNLIKELY"
}

/**
 * The SafeSearch result for each image, keyed by the image's contents
 */
const results: Record<string, SafeSearchResult | "error"> = {
  "clean-image": clean,
  "borderline-image": { ...clean, adult: "LIKELY" },
  "explicit-image": { ...clean, adult: "VERY_LIKELY" },
  "broken-image": "error"
}

const fakeCheck = jest.fn(async (image: Buffer) => {
  const result = results[image.toString()]
  if (result === "error") throw new Error("Vision unavailable")
  return result
})

const seedPin = async (
  id: string,
  imageContents: string,
  overrides: Partial<MapPin> = {}
) => {
  const imagePath = MapPinImageService.imagePathFor("uploader", id)
  await storage.bucket().file(imagePath).save(Buffer.from(imageContents))
  await mapPinService.createMapPin(id, {
    type: "sticker",
    latitude: -36.8485,
    longitude: 174.7633,
    geohash: MapPinService.geohashFor(-36.8485, 174.7633),
    image_path: imagePath,
    uploader_id: "uploader",
    created_at: Timestamp.now(),
    moderation_status: "pending",
    ...overrides
  })
  return imagePath
}

describe("MapPinModerationService", () => {
  afterEach(async () => {
    fakeCheck.mockClear()
    await cleanFirestore()
    await storage.bucket().deleteFiles({ prefix: "map-pins/" })
  })

  it("approves, flags and removes pending pins based on their photo", async () => {
    await seedPin("clean-pin", "clean-image")
    await seedPin("borderline-pin", "borderline-image")
    const explicitPath = await seedPin("explicit-pin", "explicit-image")

    const summary = await new MapPinModerationService(
      fakeCheck
    ).moderatePendingPins()

    expect(summary).toEqual({ approved: 1, flagged: 1, removed: 1, failed: 0 })

    const approved = await mapPinService.getMapPinById("clean-pin")
    expect(approved?.moderation_status).toBe("approved")
    expect(approved?.moderated_at).toBeDefined()
    expect(approved?.safe_search).toEqual(clean)

    const flagged = await mapPinService.getMapPinById("borderline-pin")
    expect(flagged?.moderation_status).toBe("flagged")
    expect(flagged?.safe_search?.adult).toBe("LIKELY")

    expect(await mapPinService.getMapPinById("explicit-pin")).toBeUndefined()
    expect(await imageService.imageExists(explicitPath)).toBe(false)
  })

  it("only checks pending pins", async () => {
    await seedPin("already-approved", "clean-image", {
      moderation_status: "approved"
    })
    await seedPin("already-flagged", "borderline-image", {
      moderation_status: "flagged"
    })

    const summary = await new MapPinModerationService(
      fakeCheck
    ).moderatePendingPins()

    expect(fakeCheck).not.toHaveBeenCalled()
    expect(summary).toEqual({ approved: 0, flagged: 0, removed: 0, failed: 0 })
  })

  it("leaves pins pending when checking fails, so they are retried", async () => {
    await seedPin("broken-pin", "broken-image")
    await seedPin("clean-pin", "clean-image")
    const consoleError = jest.spyOn(console, "error").mockImplementation()

    const summary = await new MapPinModerationService(
      fakeCheck
    ).moderatePendingPins()

    expect(summary).toEqual({ approved: 1, flagged: 0, removed: 0, failed: 1 })
    expect(
      (await mapPinService.getMapPinById("broken-pin"))?.moderation_status
    ).toBe("pending")
    consoleError.mockRestore()
  })

  it("checks at most the given number of pins per run", async () => {
    await Promise.all(
      [1, 2, 3].map((n) => seedPin(`pin-${n}-1234`, "clean-image"))
    )

    const summary = await new MapPinModerationService(
      fakeCheck
    ).moderatePendingPins(2)

    expect(summary.approved).toBe(2)
    expect(await mapPinService.getPendingMapPins(10)).toHaveLength(1)
  })
})
