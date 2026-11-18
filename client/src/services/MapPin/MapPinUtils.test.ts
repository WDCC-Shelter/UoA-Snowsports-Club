import { mapPinHref, toQueryBounds, wrapLongitude } from "./MapPinUtils"

describe("wrapLongitude", () => {
  it.each([
    [0, 0],
    [174.7, 174.7],
    [180, 180],
    [-180, -180],
    [190, -170],
    [-190, 170],
    [540, 180]
  ])("wraps %d to %d", (input, expected) => {
    expect(wrapLongitude(input)).toBeCloseTo(expected)
  })
})

describe("toQueryBounds", () => {
  it("rounds bounds outwards so small pans reuse the same query", () => {
    const first = toQueryBounds({
      min_lat: -37.04,
      min_lng: 174.62,
      max_lat: -36.71,
      max_lng: 174.93
    })
    const panned = toQueryBounds({
      min_lat: -37.01,
      min_lng: 174.64,
      max_lat: -36.75,
      max_lng: 174.91
    })
    expect(first).toEqual({
      min_lat: -37.1,
      min_lng: 174.6,
      max_lat: -36.7,
      max_lng: 175
    })
    expect(panned).toEqual(first)
  })

  it("clamps latitudes", () => {
    const bounds = toQueryBounds({
      min_lat: -95,
      min_lng: 0,
      max_lat: 95,
      max_lng: 10
    })
    expect(bounds.min_lat).toBe(-90)
    expect(bounds.max_lat).toBe(90)
  })

  it("uses the whole world when more than 360° of longitude is visible", () => {
    expect(
      toQueryBounds({ min_lat: -80, min_lng: -300, max_lat: 80, max_lng: 300 })
    ).toEqual({ min_lat: -80, min_lng: -180, max_lat: 80, max_lng: 180 })
  })

  it("wraps boxes crossing the antimeridian so min_lng > max_lng", () => {
    const bounds = toQueryBounds({
      min_lat: -20,
      min_lng: 170,
      max_lat: -10,
      max_lng: 190
    })
    expect(bounds.min_lng).toBe(170)
    expect(bounds.max_lng).toBe(-170)
  })
})

describe("mapPinHref", () => {
  it("links to the pin on the map", () => {
    expect(
      mapPinHref({ id: "abc", latitude: -36.8485, longitude: 174.7633 })
    ).toBe("/map?lat=-36.8485&lng=174.7633&zoom=15&pin=abc")
  })
})
