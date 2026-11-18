import type { MapPin } from "data-layer/models/MapPin"
import { Timestamp } from "firebase-admin/firestore"
import { cleanFirestore } from "test-config/TestUtils"
import MapPinService from "./MapPinService"

const mapPinService = new MapPinService()

const makePin = (
  latitude: number,
  longitude: number,
  overrides: Partial<MapPin> = {}
): MapPin => ({
  type: "sticker",
  latitude,
  longitude,
  geohash: MapPinService.geohashFor(latitude, longitude),
  image_path: "map-pins/uploader/image",
  uploader_id: "uploader",
  created_at: Timestamp.fromMillis(0),
  ...overrides
})

// Auckland, Wellington, Queenstown, Tokyo, Fiji (east of the antimeridian)
const auckland = makePin(-36.8485, 174.7633)
const wellington = makePin(-41.2865, 174.7762)
const queenstown = makePin(-45.0312, 168.6626)
const tokyo = makePin(35.6762, 139.6503)
const samoa = makePin(-13.759, -172.1046)

const NZ_BOX = { min_lat: -48, min_lng: 165, max_lat: -34, max_lng: 179 }
const NORTH_ISLAND_BOX = {
  min_lat: -42,
  min_lng: 172,
  max_lat: -34,
  max_lng: 179
}

describe("MapPinService", () => {
  afterEach(async () => {
    await cleanFirestore()
  })

  it("creates and fetches a pin by id", async () => {
    await mapPinService.createMapPin("pin-1", auckland)
    expect(await mapPinService.getMapPinById("pin-1")).toEqual(auckland)
  })

  it("does not allow creating a pin with an existing id", async () => {
    await mapPinService.createMapPin("pin-1", auckland)
    await expect(
      mapPinService.createMapPin("pin-1", wellington)
    ).rejects.toThrow()
  })

  it("deletes a pin", async () => {
    await mapPinService.createMapPin("pin-1", auckland)
    await mapPinService.deleteMapPin("pin-1")
    expect(await mapPinService.getMapPinById("pin-1")).toBeUndefined()
  })

  describe("getMapPinsInBoundingBox", () => {
    beforeEach(async () => {
      await Promise.all([
        mapPinService.createMapPin("auckland", auckland),
        mapPinService.createMapPin("wellington", wellington),
        mapPinService.createMapPin("queenstown", queenstown),
        mapPinService.createMapPin("tokyo", tokyo),
        mapPinService.createMapPin("samoa", samoa)
      ])
    })

    const ids = (pins: { id: string }[]) => pins.map((p) => p.id).sort()

    it("only returns pins inside the box", async () => {
      expect(ids(await mapPinService.getMapPinsInBoundingBox(NZ_BOX))).toEqual([
        "auckland",
        "queenstown",
        "wellington"
      ])
      expect(
        ids(await mapPinService.getMapPinsInBoundingBox(NORTH_ISLAND_BOX))
      ).toEqual(["auckland", "wellington"])
    })

    it("returns every pin for a box covering the world", async () => {
      expect(
        ids(
          await mapPinService.getMapPinsInBoundingBox({
            min_lat: -90,
            min_lng: -180,
            max_lat: 90,
            max_lng: 180
          })
        )
      ).toEqual(["auckland", "queenstown", "samoa", "tokyo", "wellington"])
    })

    it("handles boxes crossing the antimeridian", async () => {
      expect(
        ids(
          await mapPinService.getMapPinsInBoundingBox({
            min_lat: -48,
            min_lng: 165,
            max_lat: -10,
            max_lng: -170
          })
        )
      ).toEqual(["auckland", "queenstown", "samoa", "wellington"])
    })

    it("caps the number of pins returned", async () => {
      expect(
        await mapPinService.getMapPinsInBoundingBox(NZ_BOX, 2)
      ).toHaveLength(2)
    })
  })

  it("fetches pins by uploader newest first", async () => {
    await Promise.all([
      mapPinService.createMapPin(
        "old",
        makePin(-36, 174, {
          uploader_id: "me",
          created_at: Timestamp.fromMillis(1000)
        })
      ),
      mapPinService.createMapPin(
        "new",
        makePin(-36, 174, {
          uploader_id: "me",
          created_at: Timestamp.fromMillis(2000)
        })
      ),
      mapPinService.createMapPin(
        "someone-else",
        makePin(-36, 174, { uploader_id: "someone-else" })
      )
    ])

    const pins = await mapPinService.getMapPinsByUploader("me")
    expect(pins.map((p) => p.id)).toEqual(["new", "old"])
  })

  it("paginates the latest pins newest first", async () => {
    await Promise.all(
      [1, 2, 3].map((n) =>
        mapPinService.createMapPin(
          `pin-${n}`,
          makePin(-36, 174, { created_at: Timestamp.fromMillis(n * 1000) })
        )
      )
    )

    const firstPage = await mapPinService.getLatestMapPins(2)
    expect(firstPage.data.map((p) => p.id)).toEqual(["pin-3", "pin-2"])
    expect(firstPage.nextCursor).toBe("pin-2")

    const secondPage = await mapPinService.getLatestMapPins(
      2,
      await mapPinService.getMapPinSnapshot(firstPage.nextCursor)
    )
    expect(secondPage.data.map((p) => p.id)).toEqual(["pin-1"])
    expect(secondPage.nextCursor).toBeUndefined()
  })
})
