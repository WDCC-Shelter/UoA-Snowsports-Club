import { firestoreTimestampToDate } from "data-layer/adapters/DateUtils"
import type { Timestamp } from "firebase-admin/firestore"
import BookingDataService from "../../data-layer/services/BookingDataService"
import BookingSlotService from "../../data-layer/services/BookingSlotsService"
import { LodgePricingTypeValues } from "./StripeProductMetadata"
import { LodgeCreditState } from "./CustomerMetadata"

// Need to validate the booking date through a startDate and endDate range.
/**
 * @deprecated do not use, exported for testing purposes
 */
export const _earliestDate = new Date(Date.now())
_earliestDate.setUTCHours(0, 0, 0, 0)

/**
 * @deprecated do not use, exported for testing purposes
 */
export const _latestDate = new Date(_earliestDate)
_latestDate.setFullYear(_earliestDate.getFullYear() + 1)

export const CHECK_IN_TIME = "11:00 am" as const
export const CHECK_OUT_TIME = "10:00 am" as const
const FRIDAY = 5 as const
const SATURDAY = 6 as const
const SUNDAY = 0 as const

const BookingUtils = {
  /**
   * Used to check if the dates are within the acceptable range
   *
   * This *acceptable* range is today to one year later max
   *
   * @param startDate firestore `Timestamp`
   * @param endDate firestore `Timestamp`
   * @returns true if the date range is invalid, false otherwise
   */
  hasInvalidStartAndEndDates: (
    startDate: Timestamp,
    endDate: Timestamp,
    earliestDate?: Date,
    latestDate?: Date
  ) => {
    if (!earliestDate) {
      earliestDate = _earliestDate
    }
    if (!latestDate) {
      latestDate = _latestDate
    }

    earliestDate.setUTCHours(0, 0, 0, 0)
    latestDate.setFullYear(earliestDate.getFullYear() + 1)

    return (
      endDate.seconds < startDate.seconds ||
      firestoreTimestampToDate(startDate) < earliestDate ||
      firestoreTimestampToDate(endDate) > latestDate
    )
  },
  /**
   * Used to find how many times a slot id occurs out of the active checkout sessions
   *
   * @param busySlotIds any 1d array of strings
   * @returns a map keyed by the slot id with the amount of occurences
   */
  getSlotOccurences: (busySlotIds: Array<string>) => {
    const slotOccurences = new Map<string, number>()
    busySlotIds.forEach((slotId) => {
      const currentSlots = slotOccurences.get(slotId)
      if (!currentSlots) {
        slotOccurences.set(slotId, 1)
      } else {
        slotOccurences.set(slotId, currentSlots + 1)
      }
    })
    return slotOccurences
  },
  /**
   * Checks if the dates should be priced differently
   * (the current condition is if a single Friday or Saturday is requested)
   *
   * @param datesInBooking an array of dates for checking
   * @returns a `LodgePricingTypeValue` based on if the date meets any special conditions
   */
  getRequiredPricing: (datesInBooking: Timestamp[]): LodgePricingTypeValues => {
    const totalDays = datesInBooking.length
    const SINGLE_DAYS: ReadonlyArray<number> = [FRIDAY, SATURDAY]
    // get requiredBookingType
    if (
      // Single day requested
      totalDays === 1 &&
      SINGLE_DAYS.includes(
        new Date(firestoreTimestampToDate(datesInBooking[0])).getUTCDay()
      )
    ) {
      return LodgePricingTypeValues.SingleFridayOrSaturday
    } else {
      return LodgePricingTypeValues.Normal
    }
  },

  /**
   * Produces a per-{@link LodgePricingTypeValues} breakdown of how many nights
   * in the booking should be charged at each rate. This is the single source
   * of truth for the night → price mapping (the client mirrors this logic).
   *
   * Pricing rules:
   * - A lone Friday or Saturday (single-night booking) →
   *   `{ [SingleFridayOrSaturday]: 1 }`.
   * - Otherwise, each Friday/Saturday night is charged at the
   *   {@link LodgePricingTypeValues.Weekend} rate, and every other night is
   *   charged at the {@link LodgePricingTypeValues.Normal} rate.
   *
   * @param datesInBooking an array of dates (nights) in the booking
   * @returns a partial record keyed by pricing type with the number of nights
   *   to charge at that rate (only non-zero entries are included)
   */
  getPricingBreakdown: (
    datesInBooking: Timestamp[]
  ): Partial<Record<LodgePricingTypeValues, number>> => {
    if (datesInBooking.length === 0) {
      return {}
    }

    // A lone Friday/Saturday keeps the existing single-night special rate.
    if (
      BookingUtils.getRequiredPricing(datesInBooking) ===
      LodgePricingTypeValues.SingleFridayOrSaturday
    ) {
      return { [LodgePricingTypeValues.SingleFridayOrSaturday]: 1 }
    }

    const WEEKEND_DAYS: ReadonlyArray<number> = [FRIDAY, SATURDAY]
    let weekendNights = 0
    let normalNights = 0
    for (const date of datesInBooking) {
      const day = new Date(firestoreTimestampToDate(date)).getUTCDay()
      if (WEEKEND_DAYS.includes(day)) {
        weekendNights++
      } else {
        normalNights++
      }
    }

    const breakdown: Partial<Record<LodgePricingTypeValues, number>> = {}
    if (normalNights > 0) {
      breakdown[LodgePricingTypeValues.Normal] = normalNights
    }
    if (weekendNights > 0) {
      breakdown[LodgePricingTypeValues.Weekend] = weekendNights
    }
    return breakdown
  },

  /**
   * Computes the total lodge-credit discount amount (in the smallest currency
   * unit, e.g. cents) for a booking that may mix normal and weekend rates.
   *
   * Each credit discounts the *actual* rate of the specific night it is
   * consumed against ("match consumed night type"):
   * - Weeknight-only credits are consumed against Mon–Fri nights first. A
   *   Friday consumed is discounted at the weekend rate; Mon–Thu at the normal
   *   rate.
   * - Any-night credits are consumed against the remaining nights (a Saturday
   *   is discounted at the weekend rate; other nights at their respective rate).
   *
   * The nights are sorted most-expensive-first within each credit pool so the
   * discount is applied consistently and to the member's benefit.
   *
   * @param datesInBooking the nights in the booking
   * @param creditsToApply the credits being consumed (from
   *   {@link BookingUtils.getDiscountableNights})
   * @param unitAmountByType a map from pricing type to that type's Stripe
   *   `unit_amount` (smallest currency unit)
   * @returns the total discount amount in the smallest currency unit
   */
  getLodgeCreditDiscountAmount: (
    datesInBooking: Timestamp[],
    creditsToApply: LodgeCreditState,
    unitAmountByType: Partial<Record<LodgePricingTypeValues, number>>
  ): number => {
    const normalAmount = unitAmountByType[LodgePricingTypeValues.Normal] ?? 0
    const weekendAmount = unitAmountByType[LodgePricingTypeValues.Weekend] ?? 0

    /**
     * The per-night rate used when a credit is consumed against `date`.
     * A lone Friday/Saturday is never discountable here in practice (multi-night
     * only), so we fall back to the single special rate if present, else normal.
     */
    const rateForDate = (date: Timestamp): number => {
      const day = new Date(firestoreTimestampToDate(date)).getUTCDay()
      if (day === FRIDAY || day === SATURDAY) {
        return weekendAmount
      }
      return normalAmount
    }

    // Weeknight credits apply to Mon–Fri nights (exclude Sat & Sun), matching
    // getDiscountableNights.
    const weekNightDates = datesInBooking.filter((date) => {
      const day = new Date(firestoreTimestampToDate(date)).getUTCDay()
      return day !== SUNDAY && day !== SATURDAY
    })

    // Sort most-expensive-first so credits discount the highest rates first.
    const sortByRateDesc = (a: Timestamp, b: Timestamp) =>
      rateForDate(b) - rateForDate(a)

    const weekNightsToDiscount = weekNightDates
      .slice()
      .sort(sortByRateDesc)
      .slice(0, creditsToApply.weekNightsOnly)

    const consumedSet = new Set(weekNightsToDiscount)

    // Any-night credits apply to the remaining (not-yet-discounted) nights.
    const remainingDates = datesInBooking.filter(
      (date) => !consumedSet.has(date)
    )
    const anyNightsToDiscount = remainingDates
      .slice()
      .sort(sortByRateDesc)
      .slice(0, creditsToApply.anyNight)

    return [...weekNightsToDiscount, ...anyNightsToDiscount].reduce(
      (total, date) => total + rateForDate(date),
      0
    )
  },

  /**
   * subtracts a {@link LodgeCreditState} representing the credits to be deducted from a starting {@link LodgeCreditState}.
   * @param startingLodgeCredits The initial lodge credit state before the booking is made.
   * @param lodgeCreditsToDeduct The lodge credit state representing the credits to be deducted for the booking.
   * @returns The new lodge credit state after the booking is made, applying deductions, a user may not have negative credits.
   */
  deductLodgeCreditBalance: (
    startingLodgeCredits: LodgeCreditState,
    lodgeCreditsToDeduct: LodgeCreditState
  ): LodgeCreditState => {
    return {
      weekNightsOnly: Math.max(
        0,
        startingLodgeCredits.weekNightsOnly -
          lodgeCreditsToDeduct.weekNightsOnly
      ),
      anyNight: Math.max(
        0,
        startingLodgeCredits.anyNight - lodgeCreditsToDeduct.anyNight
      )
    }
  },

  getDiscountableNights: (
    datesInBooking: Timestamp[],
    startingLodgeCredits: LodgeCreditState
  ): LodgeCreditState => {
    const discountedWeekNights = datesInBooking.filter((date) => {
      const dayOfWeek = new Date(firestoreTimestampToDate(date)).getUTCDay()
      return dayOfWeek !== SUNDAY && dayOfWeek !== SATURDAY // Exclude Sundays (0) and Saturdays (6)
    })
    const weekNightsToDiscount = Math.min(
      discountedWeekNights.length,
      startingLodgeCredits.weekNightsOnly
    )

    const remainingDates = datesInBooking.length - weekNightsToDiscount

    // Apply wildcard credits to the remaining dates
    const wildcardCreditsToApply = Math.min(
      remainingDates,
      startingLodgeCredits.anyNight
    )

    return {
      weekNightsOnly: weekNightsToDiscount,
      anyNight: wildcardCreditsToApply
    }
  },

  /**
   * Checks if the last spot is taken for a specific booking slot
   * @param bookingSlotId The ID of the booking slot
   * @returns true if the last spot is taken, false otherwise
   */
  isLastSpotTaken: async (bookingSlotId: string): Promise<boolean> => {
    const bookingDataService = new BookingDataService()
    const bookingSlotService = new BookingSlotService()

    const bookingSlot =
      await bookingSlotService.getBookingSlotById(bookingSlotId)

    const bookings = await bookingDataService.getBookingsBySlotId(bookingSlotId)
    const bookingCount = bookings.length

    const availableSlots = bookingSlot.max_bookings - bookingCount
    return availableSlots <= 0
  },
  /**
   * Adds one day to the given date string in the format dd/mm/yyyy.
   *
   * This function parses the input date string, adds one day to it, and then
   * formats it back to the dd/mm/yyyy string format. It correctly handles edge
   * cases such as the end of a month, end of a year, and leap years.
   *
   * @param {string} dateString - The date string in the format dd/mm/yyyy.
   * @returns {string} - The new date string, one day later, in the format dd/mm/yyyy.
   *
   * @throws {Error} - Throws an error if the input date string is not in the format dd/mm/yyyy.
   *
   * @example
   * ```typescript
   * addOneDay('31/07/2024'); // Returns '01/08/2024'
   * addOneDay('28/02/2024'); // Returns '29/02/2024'
   * addOneDay('31/12/2024'); // Returns '01/01/2025'
   * ```
   *
   * @remarks
   * This function uses the JavaScript `Date` object to handle date manipulation.
   * The `Date` object automatically adjusts for month and year boundaries, including
   * leap years. The function assumes the input date string is valid and in the correct
   * format. If the input date string is invalid or not in the format dd/mm/yyyy, the
   * function will throw an error.
   */
  addOneDay: (dateString: string): string => {
    // Parse the input date string
    const [day, month, year] = dateString.split("/").map(Number)
    const date = new Date(year, month - 1, day)

    // Add one day
    date.setDate(date.getDate() + 1)

    if (Number.isNaN(date.getTime()) || year < 2000) {
      throw new Error("Invalid date")
    }

    // Format the new date back to dd/mm/yyyy
    const newDay = String(date.getDate()).padStart(2, "0")
    const newMonth = String(date.getMonth() + 1).padStart(2, "0")
    const newYear = date.getFullYear()

    return `${newDay}/${newMonth}/${newYear}`
  }
} as const

export default BookingUtils
