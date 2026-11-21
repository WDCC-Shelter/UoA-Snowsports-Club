import FirestoreCollections from "data-layer/adapters/FirestoreCollections"
import type {
  DocumentDataWithUid,
  PaginatedFirebaseResponse
} from "data-layer/models/common"
import type {
  MapPin,
  MapPinModerationStatus,
  SafeSearchResult
} from "data-layer/models/MapPin"
import { type DocumentSnapshot, Timestamp } from "firebase-admin/firestore"
import { geohashForLocation } from "geofire-common"

/**
 * The maximum number of pins returned from a single bounding box query
 */
export const MAX_PINS_PER_QUERY = 500

/**
 * A latitude/longitude bounding box. If `min_lng > max_lng` the box is assumed
 * to cross the antimeridian (180° longitude).
 */
export interface BoundingBox {
  min_lat: number
  min_lng: number
  max_lat: number
  max_lng: number
}

/**
 * Checks whether a point lies inside a bounding box that does **not** cross the antimeridian
 */
const isInBox = (lat: number, lng: number, box: BoundingBox) =>
  lat >= box.min_lat &&
  lat <= box.max_lat &&
  lng >= box.min_lng &&
  lng <= box.max_lng

/**
 * Splits a bounding box crossing the antimeridian into two that don't
 */
const splitAtAntimeridian = (box: BoundingBox): BoundingBox[] =>
  box.min_lng <= box.max_lng
    ? [box]
    : [
        { ...box, max_lng: 180 },
        { ...box, min_lng: -180 }
      ]

/**
 * The maximum number of geohash cells (and therefore Firestore queries) used to
 * cover a single bounding box, unless the box needs the coarsest precision
 */
const MAX_CELLS_PER_BOX = 16

/**
 * Finest geohash precision used for queries. Precision 7 cells are ~150m wide
 */
const MAX_PRECISION = 7

/**
 * Width and height in degrees of a geohash cell at a given precision
 */
const cellSize = (precision: number) => {
  const bits = precision * 5
  // Geohash interleaves bits starting with longitude
  const lngBits = Math.ceil(bits / 2)
  const latBits = Math.floor(bits / 2)
  return { lat: 180 / 2 ** latBits, lng: 360 / 2 ** lngBits }
}

/**
 * Gets the start of each grid row/column covering a range, aligned to the geohash grid
 */
const gridStarts = (min: number, max: number, size: number) => {
  const starts: number[] = []
  for (let start = Math.floor(min / size) * size; start <= max; start += size) {
    starts.push(start)
  }
  return starts
}

/**
 * Finds the geohash prefixes of every cell overlapping a bounding box that does
 * **not** cross the antimeridian, using the finest precision that keeps the number
 * of cells small.
 */
const coveringGeohashes = (box: BoundingBox): string[] => {
  const cellsAt = (precision: number) => {
    const size = cellSize(precision)
    return {
      lats: gridStarts(box.min_lat, box.max_lat, size.lat),
      lngs: gridStarts(box.min_lng, box.max_lng, size.lng),
      size
    }
  }

  let precision = 1
  while (precision < MAX_PRECISION) {
    const { lats, lngs } = cellsAt(precision + 1)
    if (lats.length * lngs.length > MAX_CELLS_PER_BOX) break
    precision++
  }

  const { lats, lngs, size } = cellsAt(precision)
  const hashes = new Set<string>()
  for (const lat of lats) {
    for (const lng of lngs) {
      // Use the centre of the cell so the hash isn't ambiguous at an edge
      const centreLat = Math.min(lat + size.lat / 2, 90)
      const centreLng = Math.min(lng + size.lng / 2, 180)
      hashes.add(geohashForLocation([centreLat, centreLng], precision))
    }
  }
  return [...hashes]
}

class MapPinService {
  /**
   * Computes the geohash used for spatial queries of a location
   */
  public static geohashFor(latitude: number, longitude: number) {
    return geohashForLocation([latitude, longitude])
  }

  /**
   * Creates a pin with a specific id. Fails if a pin with that id already exists.
   *
   * @param id the id of the pin, which should match the id of its image
   * @param pin the pin to create
   */
  public async createMapPin(id: string, pin: MapPin) {
    return await FirestoreCollections.mapPins.doc(id).create(pin)
  }

  /**
   * Fetches a pin by id
   *
   * @returns the pin, or `undefined` if it doesn't exist
   */
  public async getMapPinById(id: string): Promise<MapPin | undefined> {
    const result = await FirestoreCollections.mapPins.doc(id).get()
    return result.data()
  }

  /**
   * Hard deletes a pin by id
   */
  public async deleteMapPin(id: string) {
    return await FirestoreCollections.mapPins.doc(id).delete()
  }

  /**
   * Fetches pins within a bounding box, capped at {@link MAX_PINS_PER_QUERY}.
   *
   * Firestore can't query by bounding box directly, so the box is covered with
   * geohash cells which are each queried as a prefix range. Results are then
   * filtered down to the exact box.
   */
  public async getMapPinsInBoundingBox(
    box: BoundingBox,
    limit: number = MAX_PINS_PER_QUERY
  ): Promise<DocumentDataWithUid<MapPin>[]> {
    const boxes = splitAtAntimeridian(box)
    const prefixes = new Set(boxes.flatMap(coveringGeohashes))

    const snapshots = await Promise.all(
      [...prefixes].map((prefix) =>
        FirestoreCollections.mapPins
          .orderBy("geohash")
          .startAt(prefix)
          .endAt(`${prefix}~`)
          .limit(limit)
          .get()
      )
    )

    const seen = new Set<string>()
    const pins: DocumentDataWithUid<MapPin>[] = []
    for (const snapshot of snapshots) {
      for (const doc of snapshot.docs) {
        if (seen.has(doc.id)) continue
        const pin = doc.data()
        // Flagged pins are hidden until an admin reviews them
        if (pin.moderation_status === "flagged") continue
        if (boxes.some((b) => isInBox(pin.latitude, pin.longitude, b))) {
          seen.add(doc.id)
          pins.push({ ...pin, id: doc.id })
        }
      }
    }

    return pins.slice(0, limit)
  }

  /**
   * Fetches all pins uploaded by a user, newest first
   */
  public async getMapPinsByUploader(
    uploaderId: string
  ): Promise<DocumentDataWithUid<MapPin>[]> {
    // Sorted in memory to avoid needing a composite index, a single member
    // won't have many pins
    const result = await FirestoreCollections.mapPins
      .where("uploader_id", "==", uploaderId)
      .get()

    return result.docs
      .map((doc) => ({ ...doc.data(), id: doc.id }))
      .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
  }

  /**
   * Utility method for getting the snapshot of a pin, used for pagination cursors
   */
  public async getMapPinSnapshot(
    id: string
  ): Promise<DocumentSnapshot<MapPin>> {
    return await FirestoreCollections.mapPins.doc(id).get()
  }

  /**
   * Fetches the latest pins, newest first, using cursor based pagination
   *
   * @param limit how many pins to fetch
   * @param startAfter snapshot of the last pin of the previous page, see {@link getMapPinSnapshot}
   */
  public async getLatestMapPins(
    limit: number,
    startAfter?: DocumentSnapshot<MapPin>
  ): Promise<PaginatedFirebaseResponse<DocumentDataWithUid<MapPin>>> {
    let query = FirestoreCollections.mapPins
      .orderBy("created_at", "desc")
      .limit(limit)
    if (startAfter?.exists) {
      query = query.startAfter(startAfter)
    }
    const res = await query.get()

    return {
      data: res.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
      nextCursor:
        res.docs.length === limit
          ? res.docs[res.docs.length - 1]?.id
          : undefined
    }
  }

  /**
   * Fetches pins whose photo hasn't been checked yet, in no particular order
   * (ordering would need a composite index)
   *
   * @param limit the maximum number of pins to fetch
   */
  public async getPendingMapPins(
    limit: number
  ): Promise<DocumentDataWithUid<MapPin>[]> {
    const result = await FirestoreCollections.mapPins
      .where("moderation_status", "==", "pending")
      .limit(limit)
      .get()
    return result.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
  }

  /**
   * Fetches every pin waiting for an admin to review it, newest first
   */
  public async getFlaggedMapPins(): Promise<DocumentDataWithUid<MapPin>[]> {
    // Sorted in memory to avoid needing a composite index, there should only be a few
    const result = await FirestoreCollections.mapPins
      .where("moderation_status", "==", "flagged")
      .get()
    return result.docs
      .map((doc) => ({ ...doc.data(), id: doc.id }))
      .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
  }

  /**
   * Records the result of checking a pin's photo
   */
  public async setModerationStatus(
    id: string,
    status: MapPinModerationStatus,
    safeSearch?: SafeSearchResult
  ) {
    return await FirestoreCollections.mapPins.doc(id).update({
      moderation_status: status,
      moderated_at: Timestamp.now(),
      ...(safeSearch && { safe_search: safeSearch })
    })
  }

  /**
   * Marks pins created before moderation existed as `pending`, so they get checked.
   *
   * Firestore can't query for a missing field, so this reads every pin. Only meant
   * to be run occasionally (i.e when the server starts).
   *
   * @returns the number of pins marked as pending
   */
  public async markUnmoderatedPinsAsPending(): Promise<number> {
    const result = await FirestoreCollections.mapPins
      .select("moderation_status")
      .get()
    const unmoderated = result.docs.filter(
      (doc) => !doc.get("moderation_status")
    )
    await Promise.all(
      unmoderated.map((doc) =>
        FirestoreCollections.mapPins
          .doc(doc.id)
          .update({ moderation_status: "pending" })
      )
    )
    return unmoderated.length
  }
}

export default MapPinService
