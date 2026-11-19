export type GpsLocation = {
  latitude: number
  longitude: number
}

const JPEG_SOI = 0xffd8
const JPEG_APP1 = 0xffe1
const JPEG_SOS = 0xffda
const EXIF_HEADER = 0x45786966 // "Exif"
const TIFF_LITTLE_ENDIAN = 0x4949 // "II"
const TIFF_BIG_ENDIAN = 0x4d4d // "MM"
const TIFF_MAGIC = 42
const GPS_IFD_POINTER_TAG = 0x8825
const IFD_ENTRY_SIZE = 12

const GPS_LATITUDE_REF_TAG = 1
const GPS_LATITUDE_TAG = 2
const GPS_LONGITUDE_REF_TAG = 3
const GPS_LONGITUDE_TAG = 4

/**
 * Reads the GPS location from the EXIF data of a JPEG, which is how phones
 * store where a photo was taken.
 *
 * Only reads the 4 GPS tags needed, rather than pulling in a full EXIF library.
 *
 * @param buffer the contents of the image file
 * @returns the location, or `undefined` if the image is not a JPEG or has no location
 */
export const readExifGps = (buffer: ArrayBuffer): GpsLocation | undefined => {
  try {
    const view = new DataView(buffer)
    if (view.getUint16(0) !== JPEG_SOI) return undefined

    let offset = 2
    while (offset + 4 <= view.byteLength) {
      const marker = view.getUint16(offset)
      if ((marker & 0xff00) !== 0xff00 || marker === JPEG_SOS) return undefined

      const segmentSize = view.getUint16(offset + 2)
      if (
        marker === JPEG_APP1 &&
        view.getUint32(offset + 4) === EXIF_HEADER &&
        view.getUint16(offset + 8) === 0
      ) {
        return readTiffGps(view, offset + 10)
      }
      offset += 2 + segmentSize
    }
  } catch {
    // Malformed EXIF data (i.e reading out of bounds), treat as no location
  }
  return undefined
}

const readTiffGps = (
  view: DataView,
  tiffStart: number
): GpsLocation | undefined => {
  const byteOrder = view.getUint16(tiffStart)
  if (byteOrder !== TIFF_LITTLE_ENDIAN && byteOrder !== TIFF_BIG_ENDIAN) {
    return undefined
  }
  const littleEndian = byteOrder === TIFF_LITTLE_ENDIAN
  const u16 = (o: number) => view.getUint16(o, littleEndian)
  const u32 = (o: number) => view.getUint32(o, littleEndian)

  if (u16(tiffStart + 2) !== TIFF_MAGIC) return undefined

  /**
   * Finds the offset of an entry with the given tag in an IFD
   */
  const findEntry = (ifdStart: number, tag: number) => {
    const count = u16(ifdStart)
    for (let i = 0; i < count; i++) {
      const entry = ifdStart + 2 + i * IFD_ENTRY_SIZE
      if (u16(entry) === tag) return entry
    }
    return undefined
  }

  const ifd0 = tiffStart + u32(tiffStart + 4)
  const gpsPointer = findEntry(ifd0, GPS_IFD_POINTER_TAG)
  if (gpsPointer === undefined) return undefined
  const gpsIfd = tiffStart + u32(gpsPointer + 8)

  /**
   * Reads a reference tag, which is a single ASCII character stored inline (i.e `N` or `S`)
   */
  const readRef = (tag: number) => {
    const entry = findEntry(gpsIfd, tag)
    return entry === undefined
      ? undefined
      : String.fromCharCode(view.getUint8(entry + 8))
  }

  /**
   * Reads degrees, minutes and seconds (3 rationals) and converts them to decimal degrees
   */
  const readDegrees = (tag: number) => {
    const entry = findEntry(gpsIfd, tag)
    if (entry === undefined) return undefined
    const valuesStart = tiffStart + u32(entry + 8)
    const [degrees, minutes, seconds] = [0, 1, 2].map((i) => {
      const numerator = u32(valuesStart + i * 8)
      const denominator = u32(valuesStart + i * 8 + 4)
      return denominator === 0 ? 0 : numerator / denominator
    })
    return degrees + minutes / 60 + seconds / 3600
  }

  const latitude = readDegrees(GPS_LATITUDE_TAG)
  const longitude = readDegrees(GPS_LONGITUDE_TAG)
  if (latitude === undefined || longitude === undefined) return undefined
  // Some cameras write 0, 0 when they don't have a fix
  if (latitude === 0 && longitude === 0) return undefined

  const location = {
    latitude: readRef(GPS_LATITUDE_REF_TAG) === "S" ? -latitude : latitude,
    longitude: readRef(GPS_LONGITUDE_REF_TAG) === "W" ? -longitude : longitude
  }
  if (Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) {
    return undefined
  }
  return location
}

/**
 * Longest edge of an uploaded pin image in pixels
 */
export const MAX_IMAGE_DIMENSION = 1600

/**
 * Must be kept below the limit in `storage.rules` (2MB)
 */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024 - 1

const QUALITIES = [0.85, 0.7, 0.55, 0.4] as const

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

/**
 * Resizes and re-encodes an image for upload. Drawing to a canvas also strips
 * all metadata (including the location), so the only location stored is the
 * one the member confirmed.
 *
 * Uses WebP where the browser can encode it, falling back to JPEG (i.e older Safari).
 *
 * @throws if the image can't be decoded or can't be made small enough
 */
export const prepareMapPinImage = async (file: Blob): Promise<Blob> => {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image"
  })
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height)
  )
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Unable to process image")
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  for (const quality of QUALITIES) {
    let blob = await canvasToBlob(canvas, "image/webp", quality)
    // Browsers that can't encode WebP silently return a PNG instead
    if (!blob || blob.type !== "image/webp") {
      blob = await canvasToBlob(canvas, "image/jpeg", quality)
    }
    if (blob && blob.size <= MAX_IMAGE_BYTES) return blob
  }
  throw new Error("Image is too large")
}
