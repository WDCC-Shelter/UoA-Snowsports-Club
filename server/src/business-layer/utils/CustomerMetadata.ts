export const LODGE_CREDIT_ANY_NIGHT_KEY = "lodge-credits-any-night" as const
export const LODGE_CREDIT_WEEK_NIGHTS_ONLY_KEY =
  "lodge-credits-week-nights-only" as const

/**
 * Used to describe what lodge credits a user has, and how many of those credits are for weekdays only
 */
export interface LodgeCreditState {
  /**
   * Credits that can be used for any booking, including those that start on a Friday or Saturday.
   */
  anyNight: number
  /**
   * Credits that can only be used for bookings that start on a weekday (Monday to Friday)
   */
  weekNightsOnly: number
}
