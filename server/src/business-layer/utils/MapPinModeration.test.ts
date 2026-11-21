import type { SafeSearchResult } from "data-layer/models/MapPin"
import { decideModeration } from "./MapPinModeration"

const clean: SafeSearchResult = {
  adult: "VERY_UNLIKELY",
  racy: "UNLIKELY",
  violence: "VERY_UNLIKELY",
  medical: "VERY_UNLIKELY",
  spoof: "UNLIKELY"
}

describe("decideModeration", () => {
  it.each<
    [string, Partial<SafeSearchResult>, ReturnType<typeof decideModeration>]
  >([
    ["clean photos", {}, "approve"],
    ["possible adult content", { adult: "POSSIBLE" }, "approve"],
    ["likely racy photos (i.e swimwear)", { racy: "LIKELY" }, "approve"],
    [
      "very likely medical or spoof",
      { medical: "VERY_LIKELY", spoof: "VERY_LIKELY" },
      "approve"
    ],
    ["likely adult content", { adult: "LIKELY" }, "flag"],
    ["likely violence", { violence: "LIKELY" }, "flag"],
    ["very likely racy photos", { racy: "VERY_LIKELY" }, "flag"],
    ["very likely adult content", { adult: "VERY_LIKELY" }, "remove"],
    ["very likely violence", { violence: "VERY_LIKELY" }, "remove"],
    [
      "removal over flagging",
      { adult: "VERY_LIKELY", racy: "VERY_LIKELY" },
      "remove"
    ]
  ])("%s", (_, overrides, expected) => {
    expect(decideModeration({ ...clean, ...overrides })).toBe(expected)
  })

  it("treats unknown likelihoods as safe", () => {
    expect(
      decideModeration({
        adult: "UNKNOWN",
        racy: "UNKNOWN",
        violence: "UNKNOWN",
        medical: "UNKNOWN",
        spoof: "UNKNOWN"
      })
    ).toBe("approve")
  })
})
