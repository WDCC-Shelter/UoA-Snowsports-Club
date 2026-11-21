import type {
  SafeSearchLikelihood,
  SafeSearchResult
} from "data-layer/models/MapPin"

/**
 * What to do with a pin after its photo has been checked
 */
export type ModerationDecision = "approve" | "flag" | "remove"

const LIKELIHOOD_RANK: Record<SafeSearchLikelihood, number> = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  VERY_LIKELY: 5
}

type Thresholds = Partial<Record<keyof SafeSearchResult, SafeSearchLikelihood>>

/**
 * Photos at or above these are deleted automatically. Kept strict because
 * deleting is permanent.
 */
export const REMOVE_THRESHOLDS: Thresholds = {
  adult: "VERY_LIKELY",
  violence: "VERY_LIKELY"
}

/**
 * Photos at or above these are hidden until an admin reviews them. `racy` only
 * flags at `VERY_LIKELY` since hot tub and swimwear photos are often `LIKELY`.
 * `medical` and `spoof` are ignored.
 */
export const FLAG_THRESHOLDS: Thresholds = {
  adult: "LIKELY",
  violence: "LIKELY",
  racy: "VERY_LIKELY"
}

const meets = (result: SafeSearchResult, thresholds: Thresholds) =>
  (
    Object.entries(thresholds) as [
      keyof SafeSearchResult,
      SafeSearchLikelihood
    ][]
  ).some(
    ([category, threshold]) =>
      LIKELIHOOD_RANK[result[category] ?? "UNKNOWN"] >=
      LIKELIHOOD_RANK[threshold]
  )

/**
 * Decides what to do with a pin based on the SafeSearch result for its photo
 */
export const decideModeration = (
  result: SafeSearchResult
): ModerationDecision => {
  if (meets(result, REMOVE_THRESHOLDS)) return "remove"
  if (meets(result, FLAG_THRESHOLDS)) return "flag"
  return "approve"
}
