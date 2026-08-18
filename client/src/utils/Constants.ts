export const MS_IN_SECOND = 1000 as const
export const DEFAULT_BOOKING_AVAILABILITY = 32 as const
export const MEMBER_TABLE_MAX_DATA = 100

export const DEFAULT_NORMAL_PRICE = 40 as const
/**
 * Display-only fallback for the rate charged when a Friday or Saturday is
 * booked without the other.
 *
 * Used purely to render a number at SSG time when the Stripe price can't be
 * fetched; it never charges anyone (the server always charges from Stripe).
 */
export const DEFAULT_SINGLE_FRI_SAT_PRICE = 60 as const
/**
 * Display-only fallback for the weekend-night rate (Fri/Sat nights when both
 * the Friday and Saturday are booked).
 *
 * Used purely to render a number at SSG time when the Stripe price can't be
 * fetched; it never charges anyone (the server always charges from Stripe).
 */
export const DEFAULT_WEEKEND_PRICE = 50 as const

/**
 * Need to remove time data from this
 */
let TODAY = new Date()
TODAY = new Date(TODAY.toDateString())

/**
 * Need to remove time data from this
 */
let NEXT_YEAR_FROM_TODAY = new Date(
  new Date().setFullYear(new Date().getFullYear() + 1)
)
NEXT_YEAR_FROM_TODAY = new Date(NEXT_YEAR_FROM_TODAY.toDateString())

const CHECK_OUT_TIME = "10:00am" as const
const CHECK_IN_TIME = "11:00am" as const

export { TODAY, NEXT_YEAR_FROM_TODAY, CHECK_IN_TIME, CHECK_OUT_TIME }
