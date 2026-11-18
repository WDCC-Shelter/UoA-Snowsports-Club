import { readExifGps } from "./ImageUtils"

type Dms = [number, number, number]

/**
 * Builds a minimal JPEG containing only an EXIF segment with GPS tags
 */
const buildJpegWithGps = ({
  latRef,
  lat,
  lngRef,
  lng,
  littleEndian = false,
  includeGps = true
}: {
  latRef: string
  lat: Dms
  lngRef: string
  lng: Dms
  littleEndian?: boolean
  includeGps?: boolean
}) => {
  const tiff = new DataView(new ArrayBuffer(128))
  const u16 = (o: number, v: number) => tiff.setUint16(o, v, littleEndian)
  const u32 = (o: number, v: number) => tiff.setUint32(o, v, littleEndian)
  const entry = (o: number, tag: number, type: number, count: number) => {
    u16(o, tag)
    u16(o + 2, type)
    u32(o + 4, count)
  }

  tiff.setUint16(0, littleEndian ? 0x4949 : 0x4d4d)
  u16(2, 42)
  u32(4, 8)

  // IFD0 with a pointer to the GPS IFD (or an unrelated tag)
  u16(8, 1)
  entry(10, includeGps ? 0x8825 : 0x0112, 4, 1)
  u32(18, 26)
  u32(22, 0)

  // GPS IFD with 4 entries, values stored after it
  u16(26, 4)
  entry(28, 1, 2, 2)
  tiff.setUint8(36, latRef.charCodeAt(0))
  entry(40, 2, 5, 3)
  u32(48, 80)
  entry(52, 3, 2, 2)
  tiff.setUint8(60, lngRef.charCodeAt(0))
  entry(64, 4, 5, 3)
  u32(72, 104)
  u32(76, 0)

  const writeDms = (start: number, dms: Dms) =>
    dms.forEach((value, i) => {
      // Store with a denominator of 100 to exercise the rational maths
      u32(start + i * 8, Math.round(value * 100))
      u32(start + i * 8 + 4, 100)
    })
  writeDms(80, lat)
  writeDms(104, lng)

  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0, 0]
  const segmentLength = 2 + exifHeader.length + tiff.byteLength
  const bytes = new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe1,
    segmentLength >> 8,
    segmentLength & 0xff,
    ...exifHeader,
    ...Array.from(new Uint8Array(tiff.buffer)),
    0xff,
    0xd9
  ])
  return bytes.buffer
}

describe("readExifGps", () => {
  it("reads a southern, eastern location (big endian)", () => {
    const location = readExifGps(
      buildJpegWithGps({
        latRef: "S",
        lat: [36, 50, 54.6],
        lngRef: "E",
        lng: [174, 45, 47.88]
      })
    )
    expect(location?.latitude).toBeCloseTo(-36.8485, 4)
    expect(location?.longitude).toBeCloseTo(174.7633, 4)
  })

  it("reads a northern, western location (little endian)", () => {
    const location = readExifGps(
      buildJpegWithGps({
        latRef: "N",
        lat: [40, 42, 46],
        lngRef: "W",
        lng: [74, 0, 22],
        littleEndian: true
      })
    )
    expect(location?.latitude).toBeCloseTo(40.7128, 4)
    expect(location?.longitude).toBeCloseTo(-74.0061, 4)
  })

  it("returns undefined when there is no GPS data", () => {
    expect(
      readExifGps(
        buildJpegWithGps({
          latRef: "S",
          lat: [36, 0, 0],
          lngRef: "E",
          lng: [174, 0, 0],
          includeGps: false
        })
      )
    ).toBeUndefined()
  })

  it("treats 0, 0 as no location", () => {
    expect(
      readExifGps(
        buildJpegWithGps({
          latRef: "N",
          lat: [0, 0, 0],
          lngRef: "E",
          lng: [0, 0, 0]
        })
      )
    ).toBeUndefined()
  })

  it("returns undefined for files that aren't JPEGs", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(readExifGps(png.buffer)).toBeUndefined()
  })

  it("returns undefined for truncated files instead of throwing", () => {
    const full = buildJpegWithGps({
      latRef: "S",
      lat: [36, 50, 54.6],
      lngRef: "E",
      lng: [174, 45, 47.88]
    })
    expect(readExifGps(full.slice(0, 60))).toBeUndefined()
  })
})
