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

const MS_IN_DAY = 86400000 as const

/**
 * Normalises a booking date to the UTC-midnight epoch milliseconds of the night
 * it represents, so nights can be compared/adjacency-checked reliably.
 */
const toUtcMidnightMs = (date: Timestamp): number => {
  const normalised = new Date(firestoreTimestampToDate(date))
  normalised.setUTCHours(0, 0, 0, 0)
  return normalised.getTime()
}

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
   * Checks if a *single-night* booking is a lone Friday or Saturday.
   *
   * @deprecated this only inspects single-night bookings and is **not** the
   *   pricing source of truth. Use {@link BookingUtils.getNightPricingTypes} or
   *   {@link BookingUtils.getPricingBreakdown} to determine what each night in
   *   a booking is charged at.
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
   * Determines the {@link LodgePricingTypeValues} that each individual night in
   * the booking should be charged at. This is the single source of truth for
   * the night → rate mapping (the client mirrors this logic).
   *
   * Pricing rules:
   * - The discounted {@link LodgePricingTypeValues.Weekend} rate is **only**
   *   given to a Friday/Saturday night when the *whole weekend* is booked, i.e.
   *   the Friday and the immediately following Saturday are **both** in the
   *   booking.
   * - Any Friday or Saturday booked without its weekend partner (e.g. a lone
   *   Friday, Thursday + Friday, or Saturday + Sunday) is charged at the more
   *   expensive {@link LodgePricingTypeValues.SingleFridayOrSaturday} rate.
   * - Every other night is charged at the
   *   {@link LodgePricingTypeValues.Normal} rate.
   *
   * @param datesInBooking an array of dates (nights) in the booking
   * @returns the pricing type for each night, in the same order as
   *   `datesInBooking`
   */
  getNightPricingTypes: (
    datesInBooking: Timestamp[]
  ): LodgePricingTypeValues[] => {
    const nightsInMs = datesInBooking.map(toUtcMidnightMs)
    const bookedNights = new Set(nightsInMs)

    return nightsInMs.map((nightMs) => {
      const day = new Date(nightMs).getUTCDay()

      /**
       * A Friday only gets the weekend rate if the Saturday right after it is
       * also booked, and a Saturday only if the Friday right before it is.
       */
      if (day === FRIDAY) {
        return bookedNights.has(nightMs + MS_IN_DAY)
          ? LodgePricingTypeValues.Weekend
          : LodgePricingTypeValues.SingleFridayOrSaturday
      }
      if (day === SATURDAY) {
        return bookedNights.has(nightMs - MS_IN_DAY)
          ? LodgePricingTypeValues.Weekend
          : LodgePricingTypeValues.SingleFridayOrSaturday
      }
      return LodgePricingTypeValues.Normal
    })
  },

  /**
   * Produces a per-{@link LodgePricingTypeValues} breakdown of how many nights
   * in the booking should be charged at each rate, based on
   * {@link BookingUtils.getNightPricingTypes}.
   *
   * @param datesInBooking an array of dates (nights) in the booking
   * @returns a partial record keyed by pricing type with the number of nights
   *   to charge at that rate (only non-zero entries are included)
   */
  getPricingBreakdown: (
    datesInBooking: Timestamp[]
  ): Partial<Record<LodgePricingTypeValues, number>> => {
    const breakdown: Partial<Record<LodgePricingTypeValues, number>> = {}

    for (const pricingType of BookingUtils.getNightPricingTypes(
      datesInBooking
    )) {
      breakdown[pricingType] = (breakdown[pricingType] ?? 0) + 1
    }

    return breakdown
  },

  /**
   * Computes the total lodge-credit discount amount (in the smallest currency
   * unit, e.g. cents) for a booking that may mix normal and weekend rates.
   *
   * Each credit discounts the *actual* rate of the specific night it is
   * consumed against ("match consumed night type"), as determined by
   * {@link BookingUtils.getNightPricingTypes}. This means a Friday booked
   * without its Saturday is discounted at the more expensive
   * {@link LodgePricingTypeValues.SingleFridayOrSaturday} rate, while a Friday
   * booked together with its Saturday is discounted at the weekend rate:
   * - Weeknight-only credits are consumed against Mon–Fri nights first.
   * - Any-night credits are consumed against the remaining nights.
   *
   * The nights are sorted most-expensive-first within each credit pool so the
   * discount is applied consistently and to the member's benefit.
   *
   * @param datesInBooking the nights in the booking
   * @param creditsToApply the credits being consumed (from
   *   {@link BookingUtils.getDiscountableNights})
   * @param unitAmountByType a map from pricing type to that type's Stripe
   *   `unit_amount` (smallest currency unit). Must contain an entry for every
   *   pricing type present in the booking's breakdown
   * @returns the total discount amount in the smallest currency unit
   */
  getLodgeCreditDiscountAmount: (
    datesInBooking: Timestamp[],
    creditsToApply: LodgeCreditState,
    unitAmountByType: Partial<Record<LodgePricingTypeValues, number>>
  ): number => {
    const nightPricingTypes = BookingUtils.getNightPricingTypes(datesInBooking)

    /**
     * Each night paired with the rate it is actually charged at, so a credit
     * always discounts exactly what that night costs.
     */
    const nights = datesInBooking.map((date, index) => ({
      index,
      day: new Date(firestoreTimestampToDate(date)).getUTCDay(),
      rate: unitAmountByType[nightPricingTypes[index]] ?? 0
    }))

    // Sort most-expensive-first so credits discount the highest rates first.
    const sortByRateDesc = (a: { rate: number }, b: { rate: number }) =>
      b.rate - a.rate

    // Weeknight credits apply to Mon–Fri nights (exclude Sat & Sun), matching
    // getDiscountableNights.
    const weekNightsToDiscount = nights
      .filter((night) => night.day !== SUNDAY && night.day !== SATURDAY)
      .sort(sortByRateDesc)
      .slice(0, creditsToApply.weekNightsOnly)

    const consumedIndexes = new Set(
      weekNightsToDiscount.map((night) => night.index)
    )

    // Any-night credits apply to the remaining (not-yet-discounted) nights.
    const anyNightsToDiscount = nights
      .filter((night) => !consumedIndexes.has(night.index))
      .sort(sortByRateDesc)
      .slice(0, creditsToApply.anyNight)

    return [...weekNightsToDiscount, ...anyNightsToDiscount].reduce(
      (total, night) => total + night.rate,
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
