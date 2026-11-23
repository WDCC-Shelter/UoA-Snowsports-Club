import { storage } from "business-layer/security/Firebase"
import MapPinImageService from "business-layer/services/MapPinImageService"
import type { MapPin } from "data-layer/models/MapPin"
import MapPinService from "data-layer/services/MapPinService"
import { Timestamp } from "firebase-admin/firestore"
import { StatusCodes } from "http-status-codes"
import { ADMIN_USER_UID, GUEST_USER_UID, MEMBER_USER_UID } from "../routes.mock"
import { adminToken, guestToken, memberToken, request } from "../routes.setup"

const mapPinService = new MapPinService()
const imageService = new MapPinImageService()

const IMAGE_ID = "image-id-1234"

const uploadImage = async (uid: string, imageId: string = IMAGE_ID) => {
  await storage
    .bucket()
    .file(MapPinImageService.imagePathFor(uid, imageId))
    .save(Buffer.from("not really an image"), { contentType: "image/webp" })
}

const seedPin = async (
  id: string,
  uploaderId: string,
  overrides: Partial<MapPin> = {}
) => {
  const imagePath = MapPinImageService.imagePathFor(uploaderId, id)
  await uploadImage(uploaderId, id)
  await mapPinService.createMapPin(id, {
    type: "sticker",
    latitude: -36.8485,
    longitude: 174.7633,
    geohash: MapPinService.geohashFor(-36.8485, 174.7633),
    image_path: imagePath,
    uploader_id: uploaderId,
    created_at: Timestamp.now(),
    ...overrides
  })
}

const validBody = {
  image_id: IMAGE_ID,
  type: "member_photo",
  caption: "  Sticker on the chairlift  ",
  latitude: -39.2312,
  longitude: 175.5594
}

const NZ_QUERY = "min_lat=-48&min_lng=165&max_lat=-34&max_lng=179"

afterEach(async () => {
  await storage.bucket().deleteFiles({ prefix: "map-pins/" })
})

describe("MapPinController endpoint tests", () => {
  describe("GET /map-pins", () => {
    it("returns pins in the box publicly, without the uploader", async () => {
      await seedPin("in-nz-pin", MEMBER_USER_UID)
      await seedPin("in-tokyo-pin", MEMBER_USER_UID, {
        latitude: 35.6762,
        longitude: 139.6503,
        geohash: MapPinService.geohashFor(35.6762, 139.6503)
      })

      const res = await request.get(`/map-pins?${NZ_QUERY}`).send()

      expect(res.status).toEqual(StatusCodes.OK)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].id).toEqual("in-nz-pin")
      expect(res.body.data[0].image_url).toContain(
        encodeURIComponent(
          MapPinImageService.imagePathFor(MEMBER_USER_UID, "in-nz-pin")
        )
      )
      expect(res.body.data[0].uploader_id).toBeUndefined()
      expect(res.body.data[0].image_path).toBeUndefined()
      expect(res.body.data[0].geohash).toBeUndefined()
    })

    it("rejects an invalid bounding box", async () => {
      const res = await request
        .get("/map-pins?min_lat=-30&min_lng=165&max_lat=-40&max_lng=179")
        .send()
      expect(res.status).toEqual(StatusCodes.BAD_REQUEST)

      const outOfRange = await request
        .get("/map-pins?min_lat=-91&min_lng=165&max_lat=-40&max_lng=179")
        .send()
      expect(outOfRange.status).toEqual(StatusCodes.BAD_REQUEST)
    })
  })

  describe("GET /map-pins/self", () => {
    it("returns only the current user's pins", async () => {
      await seedPin("my-pin-1234", MEMBER_USER_UID)
      await seedPin("their-pin-1234", ADMIN_USER_UID)

      const res = await request
        .get("/map-pins/self")
        .set("Authorization", `Bearer ${memberToken}`)
        .send()

      expect(res.status).toEqual(StatusCodes.OK)
      expect(res.body.data.map((p: { id: string }) => p.id)).toEqual([
        "my-pin-1234"
      ])
      // Pins from before moderation are treated as pending
      expect(res.body.data[0].moderation_status).toEqual("pending")
    })

    it("is available to guests so lapsed members can see their pins", async () => {
      await seedPin("old-pin-1234", GUEST_USER_UID)

      const res = await request
        .get("/map-pins/self")
        .set("Authorization", `Bearer ${guestToken}`)
        .send()

      expect(res.status).toEqual(StatusCodes.OK)
      expect(res.body.data).toHaveLength(1)
    })

    it("requires being logged in", async () => {
      const res = await request.get("/map-pins/self").send()
      expect(res.status).toEqual(StatusCodes.UNAUTHORIZED)
    })
  })

  describe("POST /map-pins", () => {
    it("lets members create a pin for their uploaded image", async () => {
      await uploadImage(MEMBER_USER_UID)

      const res = await request
        .post("/map-pins")
        .set("Authorization", `Bearer ${memberToken}`)
        .send(validBody)

      expect(res.status).toEqual(StatusCodes.CREATED)
      expect(res.body.data.id).toEqual(IMAGE_ID)
      expect(res.body.data.caption).toEqual("Sticker on the chairlift")
      expect(res.body.data.uploader_id).toBeUndefined()

      const stored = await mapPinService.getMapPinById(IMAGE_ID)
      expect(stored).toMatchObject({
        type: "member_photo",
        latitude: validBody.latitude,
        longitude: validBody.longitude,
        geohash: MapPinService.geohashFor(
          validBody.latitude,
          validBody.longitude
        ),
        uploader_id: MEMBER_USER_UID,
        image_path: MapPinImageService.imagePathFor(MEMBER_USER_UID, IMAGE_ID),
        moderation_status: "pending"
      })
    })

    it("lets admins create pins", async () => {
      await uploadImage(ADMIN_USER_UID)

      const res = await request
        .post("/map-pins")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validBody)

      expect(res.status).toEqual(StatusCodes.CREATED)
    })

    it("does not let guests create pins", async () => {
      await uploadImage(GUEST_USER_UID)

      const res = await request
        .post("/map-pins")
        .set("Authorization", `Bearer ${guestToken}`)
        .send(validBody)

      expect(res.status).toEqual(StatusCodes.UNAUTHORIZED)
      expect(await mapPinService.getMapPinById(IMAGE_ID)).toBeUndefined()
    })

    it("rejects pins when the image was not uploaded to the member's folder", async () => {
      // Image exists, but belongs to someone else
      await uploadImage(ADMIN_USER_UID)

      const res = await request
        .post("/map-pins")
        .set("Authorization", `Bearer ${memberToken}`)
        .send(validBody)

      expect(res.status).toEqual(StatusCodes.BAD_REQUEST)
      expect(await mapPinService.getMapPinById(IMAGE_ID)).toBeUndefined()
    })

    it("rejects a second pin for the same image", async () => {
      await uploadImage(MEMBER_USER_UID)
      await request
        .post("/map-pins")
        .set("Authorization", `Bearer ${memberToken}`)
        .send(validBody)

      const res = await request
        .post("/map-pins")
        .set("Authorization", `Bearer ${memberToken}`)
        .send(validBody)

      expect(res.status).toEqual(StatusCodes.CONFLICT)
    })

    it.each([
      ["an invalid type", { type: "selfie" }],
      ["a caption over 140 characters", { caption: "a".repeat(141) }],
      ["an out of range latitude", { latitude: 91 }],
      ["an out of range longitude", { longitude: -181 }],
      ["an image id with a path in it", { image_id: "../other-user/image" }],
      ["extra fields", { uploader_id: ADMIN_USER_UID }]
    ])("rejects %s", async (_, override) => {
      await uploadImage(MEMBER_USER_UID)

      const res = await request
        .post("/map-pins")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ ...validBody, ...override })

      expect(res.status).toEqual(StatusCodes.BAD_REQUEST)
    })
  })

  describe("DELETE /map-pins/{id}", () => {
    it("lets members delete their own pin and its image", async () => {
      await seedPin("my-pin-1234", MEMBER_USER_UID)

      const res = await request
        .delete("/map-pins/my-pin-1234")
        .set("Authorization", `Bearer ${memberToken}`)
        .send()

      expect(res.status).toEqual(StatusCodes.NO_CONTENT)
      expect(await mapPinService.getMapPinById("my-pin-1234")).toBeUndefined()
      expect(
        await imageService.imageExists(
          MapPinImageService.imagePathFor(MEMBER_USER_UID, "my-pin-1234")
        )
      ).toBe(false)
    })

    it("does not let members delete other people's pins", async () => {
      await seedPin("their-pin-1234", ADMIN_USER_UID)

      const res = await request
        .delete("/map-pins/their-pin-1234")
        .set("Authorization", `Bearer ${memberToken}`)
        .send()

      expect(res.status).toEqual(StatusCodes.FORBIDDEN)
      expect(await mapPinService.getMapPinById("their-pin-1234")).toBeDefined()
    })

    it("lets admins delete any pin", async () => {
      await seedPin("member-pin-1234", MEMBER_USER_UID)

      const res = await request
        .delete("/map-pins/member-pin-1234")
        .set("Authorization", `Bearer ${adminToken}`)
        .send()

      expect(res.status).toEqual(StatusCodes.NO_CONTENT)
      expect(
        await mapPinService.getMapPinById("member-pin-1234")
      ).toBeUndefined()
    })

    it("does not let guests delete pins, even their own", async () => {
      await seedPin("old-pin-1234", GUEST_USER_UID)

      const res = await request
        .delete("/map-pins/old-pin-1234")
        .set("Authorization", `Bearer ${guestToken}`)
        .send()

      expect(res.status).toEqual(StatusCodes.UNAUTHORIZED)
      expect(await mapPinService.getMapPinById("old-pin-1234")).toBeDefined()
    })

    it("returns not found for a missing pin", async () => {
      const res = await request
        .delete("/map-pins/missing-pin")
        .set("Authorization", `Bearer ${memberToken}`)
        .send()

      expect(res.status).toEqual(StatusCodes.NOT_FOUND)
    })
  })

  describe("GET /admin/map-pins", () => {
    it("returns the latest pins with the uploader for admins", async () => {
      await seedPin("older-pin-1234", MEMBER_USER_UID, {
        created_at: Timestamp.fromMillis(1000)
      })
      await seedPin("newer-pin-1234", MEMBER_USER_UID, {
        created_at: Timestamp.fromMillis(2000)
      })

      const res = await request
        .get("/admin/map-pins?limit=1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send()

      expect(res.status).toEqual(StatusCodes.OK)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0]).toMatchObject({
        id: "newer-pin-1234",
        uploader_id: MEMBER_USER_UID
      })
      expect(res.body.nextCursor).toEqual("newer-pin-1234")

      const nextPage = await request
        .get(`/admin/map-pins?limit=1&cursor=${res.body.nextCursor}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send()
      expect(nextPage.body.data[0].id).toEqual("older-pin-1234")
    })

    it("is only available to admins", async () => {
      const res = await request
        .get("/admin/map-pins")
        .set("Authorization", `Bearer ${memberToken}`)
        .send()

      expect(res.status).toEqual(StatusCodes.UNAUTHORIZED)
    })
  })

  describe("admin moderation", () => {
    it("hides flagged pins from the public map", async () => {
      await seedPin("flagged-pin-1234", MEMBER_USER_UID, {
        moderation_status: "flagged"
      })

      const res = await request.get(`/map-pins?${NZ_QUERY}`).send()
      expect(res.body.data).toHaveLength(0)
    })

    it("lists flagged pins with their check results for admins", async () => {
      await seedPin("flagged-pin-1234", MEMBER_USER_UID, {
        moderation_status: "flagged",
        safe_search: {
          adult: "LIKELY",
          racy: "POSSIBLE",
          violence: "VERY_UNLIKELY",
          medical: "VERY_UNLIKELY",
          spoof: "VERY_UNLIKELY"
        }
      })
      await seedPin("approved-pin-1234", MEMBER_USER_UID, {
        moderation_status: "approved"
      })

      const res = await request
        .get("/admin/map-pins/flagged")
        .set("Authorization", `Bearer ${adminToken}`)
        .send()

      expect(res.status).toEqual(StatusCodes.OK)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0]).toMatchObject({
        id: "flagged-pin-1234",
        moderation_status: "flagged",
        uploader_id: MEMBER_USER_UID,
        safe_search: { adult: "LIKELY" }
      })
    })

    it("lets admins approve a flagged pin so it shows on the map", async () => {
      await seedPin("flagged-pin-1234", MEMBER_USER_UID, {
        moderation_status: "flagged"
      })

      const res = await request
        .post("/admin/map-pins/flagged-pin-1234/approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send()

      expect(res.status).toEqual(StatusCodes.NO_CONTENT)
      expect(
        (await mapPinService.getMapPinById("flagged-pin-1234"))
          ?.moderation_status
      ).toEqual("approved")
      const map = await request.get(`/map-pins?${NZ_QUERY}`).send()
      expect(map.body.data).toHaveLength(1)
    })

    it("returns not found when approving a missing pin", async () => {
      const res = await request
        .post("/admin/map-pins/missing-pin/approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send()
      expect(res.status).toEqual(StatusCodes.NOT_FOUND)
    })

    it("does not let members review pins", async () => {
      await seedPin("flagged-pin-1234", MEMBER_USER_UID, {
        moderation_status: "flagged"
      })

      const list = await request
        .get("/admin/map-pins/flagged")
        .set("Authorization", `Bearer ${memberToken}`)
        .send()
      const approve = await request
        .post("/admin/map-pins/flagged-pin-1234/approve")
        .set("Authorization", `Bearer ${memberToken}`)
        .send()

      expect(list.status).toEqual(StatusCodes.UNAUTHORIZED)
      expect(approve.status).toEqual(StatusCodes.UNAUTHORIZED)
    })
  })

  describe("PATCH /admin/map-pins/{id}", () => {
    const edit = (id: string, body: object, token = adminToken) =>
      request
        .patch(`/admin/map-pins/${id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(body)

    it("lets admins change the type and caption", async () => {
      await seedPin("pin-to-edit-1234", MEMBER_USER_UID, {
        caption: "old caption"
      })

      const res = await edit("pin-to-edit-1234", {
        type: "member_photo",
        caption: "  New caption  "
      })

      expect(res.status).toEqual(StatusCodes.OK)
      expect(res.body.data).toMatchObject({
        id: "pin-to-edit-1234",
        type: "member_photo",
        caption: "New caption",
        uploader_id: MEMBER_USER_UID
      })
      const stored = await mapPinService.getMapPinById("pin-to-edit-1234")
      expect(stored?.edited_by).toEqual(ADMIN_USER_UID)
      expect(stored?.edited_at).toBeDefined()
      // Who edited it is never returned
      expect(res.body.data.edited_by).toBeUndefined()
    })

    it("removes the caption when it's empty", async () => {
      await seedPin("pin-to-edit-1234", MEMBER_USER_UID, {
        caption: "old caption"
      })

      const res = await edit("pin-to-edit-1234", { caption: "   " })

      expect(res.status).toEqual(StatusCodes.OK)
      expect(res.body.data.caption).toBeUndefined()
      expect(
        (await mapPinService.getMapPinById("pin-to-edit-1234"))?.caption
      ).toBeUndefined()
    })

    it("moves the pin, keeping it findable at its new location", async () => {
      await seedPin("pin-to-move-1234", MEMBER_USER_UID)
      const tokyo = { latitude: 35.6762, longitude: 139.6503 }

      const res = await edit("pin-to-move-1234", tokyo)

      expect(res.status).toEqual(StatusCodes.OK)
      expect(
        (await mapPinService.getMapPinById("pin-to-move-1234"))?.geohash
      ).toEqual(MapPinService.geohashFor(tokyo.latitude, tokyo.longitude))

      const nz = await request.get(`/map-pins?${NZ_QUERY}`).send()
      expect(nz.body.data).toHaveLength(0)
      const japan = await request
        .get("/map-pins?min_lat=30&min_lng=130&max_lat=40&max_lng=145")
        .send()
      expect(japan.body.data.map((p: { id: string }) => p.id)).toEqual([
        "pin-to-move-1234"
      ])
    })

    it.each([
      ["only a latitude", { latitude: -36 }],
      ["only a longitude", { longitude: 174 }],
      ["nothing to change", {}],
      ["an invalid type", { type: "selfie" }],
      ["a caption over 140 characters", { caption: "a".repeat(141) }],
      ["an out of range latitude", { latitude: 91, longitude: 174 }],
      ["fields that can't be edited", { uploader_id: ADMIN_USER_UID }]
    ])("rejects %s", async (_, body) => {
      await seedPin("pin-to-edit-1234", MEMBER_USER_UID)

      const res = await edit("pin-to-edit-1234", body)

      expect(res.status).toEqual(StatusCodes.BAD_REQUEST)
      expect(
        (await mapPinService.getMapPinById("pin-to-edit-1234"))?.uploader_id
      ).toEqual(MEMBER_USER_UID)
    })

    it("returns not found for a missing pin", async () => {
      const res = await edit("missing-pin", { caption: "hi" })
      expect(res.status).toEqual(StatusCodes.NOT_FOUND)
    })

    it("does not let members edit pins, even their own", async () => {
      await seedPin("my-pin-1234", MEMBER_USER_UID, { caption: "mine" })

      const res = await edit("my-pin-1234", { caption: "changed" }, memberToken)

      expect(res.status).toEqual(StatusCodes.UNAUTHORIZED)
      expect(
        (await mapPinService.getMapPinById("my-pin-1234"))?.caption
      ).toEqual("mine")
    })
  })
})
