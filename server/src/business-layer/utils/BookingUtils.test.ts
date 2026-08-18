import { Timestamp } from "firebase-admin/firestore"
import BookingUtils, { _earliestDate, _latestDate } from "./BookingUtils"
import { LodgePricingTypeValues } from "./StripeProductMetadata"
import BookingDataService from "../../data-layer/services/BookingDataService"
import { cleanFirestore } from "../../test-config/TestUtils"
import type { BookingSlot } from "../../data-layer/models/firebase"
import BookingSlotsService from "../../data-layer/services/BookingSlotsService"
import { LodgeCreditState } from "./CustomerMetadata"

describe("BookingUtils", () => {
  describe("hasInvalidStartAndEndDates", () => {
    it("should return true when endDate is earlier than startDate", () => {
      const startDate = Timestamp.now()
      const endDate = Timestamp.fromDate(
        new Date(startDate.toDate().getTime() - 1000)
      )
      expect(BookingUtils.hasInvalidStartAndEndDates(startDate, endDate)).toBe(
        true
      )
    })

    it("should return true when startDate is earlier than earliestDate", () => {
      const startDate = Timestamp.fromDate(
        new Date(_earliestDate.getTime() - 1000)
      )
      const endDate = Timestamp.now()
      expect(BookingUtils.hasInvalidStartAndEndDates(startDate, endDate)).toBe(
        true
      )
    })

    it("should return true when endDate is later than latestDate", () => {
      const startDate = Timestamp.now()
      const endDate = Timestamp.fromDate(new Date(_latestDate.getTime() + 1000))
      expect(BookingUtils.hasInvalidStartAndEndDates(startDate, endDate)).toBe(
        true
      )
    })

    it("should return false when dates are within the acceptable range", () => {
      const startDate = Timestamp.now()
      const endDate = Timestamp.fromDate(
        new Date(startDate.toDate().getTime() + 1000)
      )
      expect(BookingUtils.hasInvalidStartAndEndDates(startDate, endDate)).toBe(
        false
      )
    })
  })

  describe("getSlotOccurences", () => {
    it("should return the correct slot occurrences", () => {
      const busySlotIds = ["A", "B", "A", "C", "B", "A"]

      const result = BookingUtils.getSlotOccurences(busySlotIds)

      expect(result.get("A")).toBe(3)
      expect(result.get("B")).toBe(2)
      expect(result.get("C")).toBe(1)
    })

    it("should handle an empty input array", () => {
      const result = BookingUtils.getSlotOccurences([])
      expect(result.size).toBe(0)
    })

    // Add more test cases as needed
  })
  describe("BookingUtils.getRequiredPricing", () => {
    it("should return SingleFridayOrSaturday for a single Friday or Saturday", () => {
      const _friday = new Date("2024-06-14")
      const _saturday = new Date("2024-06-15")

      const friday = Timestamp.fromDate(_friday)
      const saturday = Timestamp.fromDate(_saturday)

      expect(BookingUtils.getRequiredPricing([friday])).toBe(
        LodgePricingTypeValues.SingleFridayOrSaturday
      )
      expect(BookingUtils.getRequiredPricing([saturday])).toBe(
        LodgePricingTypeValues.SingleFridayOrSaturday
      )
    })

    it("should return Normal for other cases", () => {
      const _otherDay = new Date("2024-06-16")
      const _friday = new Date("2024-06-14")

      const otherDay = Timestamp.fromDate(_otherDay)
      const friday = Timestamp.fromDate(_friday)

      expect(BookingUtils.getRequiredPricing([otherDay])).toBe(
        LodgePricingTypeValues.Normal
      )
      expect(BookingUtils.getRequiredPricing([])).toBe(
        LodgePricingTypeValues.Normal
      )
      expect(BookingUtils.getRequiredPricing([friday, otherDay])).toBe(
        LodgePricingTypeValues.Normal
      )
    })
  })

  describe("isLastSpotTaken", () => {
    afterEach(async () => {
      await cleanFirestore()
    })

    it("should return true if the last spot is taken", async () => {
      // Create a booking slot with a maximum of 2 bookings
      const timestamp = Timestamp.fromDate(new Date(2024, 4, 23))
      const bookingSlotData: BookingSlot = {
        date: timestamp,
        description: "booking_slot_description",
        max_bookings: 2
      }
      const { id: slotId } = await new BookingSlotsService().createBookingSlot(
        bookingSlotData
      )

      // Create two bookings for the same slot
      await new BookingDataService().createBooking({
        user_id: "ronaldo",
        booking_slot_id: slotId,
        stripe_payment_id: "stripeID3"
      })

      await new BookingDataService().createBooking({
        user_id: "sui",
        booking_slot_id: slotId,
        stripe_payment_id: "stripeID1"
      })

      const result = await BookingUtils.isLastSpotTaken(slotId)

      expect(result).toBe(true)
    })

    it("should return false if spots are still available", async () => {
      // Create a booking slot with a maximum of 7 bookings
      const timestamp = Timestamp.fromDate(new Date(2024, 4, 23))
      const bookingSlotData: BookingSlot = {
        date: timestamp,
        description: "booking_slot_description",
        max_bookings: 7
      }
      const { id: slotId } = await new BookingSlotsService().createBookingSlot(
        bookingSlotData
      )

      // Create 1 booking for the slot
      await new BookingDataService().createBooking({
        user_id: "sdf",
        booking_slot_id: slotId,
        stripe_payment_id: "stripeID3"
      })

      const result = await BookingUtils.isLastSpotTaken(slotId)

      expect(result).toBe(false)
    })
  })
  describe("BookingUtils.addOneDay", () => {
    it("should add one day to a regular date", () => {
      expect(BookingUtils.addOneDay("01/08/2024")).toBe("02/08/2024")
    })

    it("should handle end of month", () => {
      expect(BookingUtils.addOneDay("31/07/2024")).toBe("01/08/2024")
    })

    it("should handle end of year", () => {
      expect(BookingUtils.addOneDay("31/12/2024")).toBe("01/01/2025")
    })

    it("should handle leap year", () => {
      expect(BookingUtils.addOneDay("28/02/2024")).toBe("29/02/2024")
      expect(BookingUtils.addOneDay("29/02/2024")).toBe("01/03/2024")
    })

    it("should handle non-leap year", () => {
      expect(BookingUtils.addOneDay("28/02/2023")).toBe("01/03/2023")
    })

    it("should handle single digit day and month", () => {
      expect(BookingUtils.addOneDay("01/01/2024")).toBe("02/01/2024")
      expect(BookingUtils.addOneDay("09/09/2024")).toBe("10/09/2024")
    })

    it("should handle invalid date format", () => {
      expect(() => BookingUtils.addOneDay("2024/01/01")).toThrow()
      expect(() => BookingUtils.addOneDay("01-01-2024")).toThrow()
      expect(() => BookingUtils.addOneDay("invalid-date")).toThrow()
    })
  })
  describe("BookingUtils.getDiscountableNights", () => {
    it("should return correct discount credits for week nights and any night", () => {
      const remainingDates = [
        Timestamp.fromDate(new Date("2024-06-17")), // Monday
        Timestamp.fromDate(new Date("2024-06-18")), // Tuesday
        Timestamp.fromDate(new Date("2024-06-19")), // Wednesday
        Timestamp.fromDate(new Date("2024-06-20")), // Thursday
        Timestamp.fromDate(new Date("2024-06-22")) // Saturday
      ]

      const startingLodgeCredits: LodgeCreditState = {
        weekNightsOnly: 4,
        anyNight: 2
      }

      const result = BookingUtils.getDiscountableNights(
        remainingDates,
        startingLodgeCredits
      )

      expect(result.weekNightsOnly).toEqual(4)
      expect(result.anyNight).toEqual(1)
    })

    it("should not apply week night credits to weekend nights", () => {
      const remainingDates = [
        Timestamp.fromDate(new Date("2024-06-22")), // Saturday
        Timestamp.fromDate(new Date("2024-06-23")) // Sunday
      ]

      const startingLodgeCredits: LodgeCreditState = {
        weekNightsOnly: 5,
        anyNight: 1
      }

      const result = BookingUtils.getDiscountableNights(
        remainingDates,
        startingLodgeCredits
      )

      expect(result.weekNightsOnly).toEqual(0)
      expect(result.anyNight).toEqual(1)
    })

    it("should spend week night credits first", () => {
      const remainingDates = [
        Timestamp.fromDate(new Date("2024-06-17")), // Monday
        Timestamp.fromDate(new Date("2024-06-18")), // Tuesday
        Timestamp.fromDate(new Date("2024-06-19")), // Wednesday
        Timestamp.fromDate(new Date("2024-06-20")) // Thursday
      ]

      const startingLodgeCredits: LodgeCreditState = {
        weekNightsOnly: 2,
        anyNight: 5
      }

      const result = BookingUtils.getDiscountableNights(
        remainingDates,
        startingLodgeCredits
      )

      expect(result.weekNightsOnly).toEqual(2)
      expect(result.anyNight).toEqual(2)
    })

    it("should spend any night credits regardless of date", () => {
      const remainingDates = [
        Timestamp.fromDate(new Date("2024-06-21")), // Friday
        Timestamp.fromDate(new Date("2024-06-22")), // Saturday
        Timestamp.fromDate(new Date("2024-06-23")) // Sunday
      ]

      const startingLodgeCredits: LodgeCreditState = {
        weekNightsOnly: 0,
        anyNight: 2
      }

      const result = BookingUtils.getDiscountableNights(
        remainingDates,
        startingLodgeCredits
      )

      expect(result.weekNightsOnly).toEqual(0)
      expect(result.anyNight).toEqual(2)
    })
    it("should only use weeknight credits if they are sufficient to cover all weeknights", () => {
      const remainingDates = [
        Timestamp.fromDate(new Date("2024-06-17")), // Monday
        Timestamp.fromDate(new Date("2024-06-18")), // Tuesday
        Timestamp.fromDate(new Date("2024-06-19")), // Wednesday
        Timestamp.fromDate(new Date("2024-06-20")) // Thursday
      ]

      const startingLodgeCredits: LodgeCreditState = {
        weekNightsOnly: 5,
        anyNight: 3
      }

      const result = BookingUtils.getDiscountableNights(
        remainingDates,
        startingLodgeCredits
      )

      expect(result.weekNightsOnly).toEqual(4)
      expect(result.anyNight).toEqual(0)
    })
  })
  describe("BookingUtils.deductLodgeCreditBalance", () => {
    it("should correctly deduct credits without going negative", () => {
      const startingLodgeCredits: LodgeCreditState = {
        weekNightsOnly: 3,
        anyNight: 2
      }

      const lodgeCreditsToDeduct: LodgeCreditState = {
        weekNightsOnly: 4,
        anyNight: 3
      }

      const result = BookingUtils.deductLodgeCreditBalance(
        startingLodgeCredits,
        lodgeCreditsToDeduct
      )

      expect(result.weekNightsOnly).toEqual(0)
      expect(result.anyNight).toEqual(0)
    })

    it("should correctly deduct credits when sufficient balance is available", () => {
      const startingLodgeCredits: LodgeCreditState = {
        weekNightsOnly: 5,
        anyNight: 4
      }

      const lodgeCreditsToDeduct: LodgeCreditState = {
        weekNightsOnly: 2,
        anyNight: 1
      }

      const result = BookingUtils.deductLodgeCreditBalance(
        startingLodgeCredits,
        lodgeCreditsToDeduct
      )

      expect(result.weekNightsOnly).toEqual(3)
      expect(result.anyNight).toEqual(3)
    })
  })

  describe("BookingUtils.getPricingBreakdown", () => {
    it("should return the single special rate for a lone Friday", () => {
      const dates = [Timestamp.fromDate(new Date("2024-06-21"))] // Friday
      expect(BookingUtils.getPricingBreakdown(dates)).toEqual({
        [LodgePricingTypeValues.SingleFridayOrSaturday]: 1
      })
    })

    it("should return the single special rate for a lone Saturday", () => {
      const dates = [Timestamp.fromDate(new Date("2024-06-22"))] // Saturday
      expect(BookingUtils.getPricingBreakdown(dates)).toEqual({
        [LodgePricingTypeValues.SingleFridayOrSaturday]: 1
      })
    })

    it("should charge the more expensive rate for a Friday booked without its Saturday (Thu + Fri)", () => {
      const dates = [
        Timestamp.fromDate(new Date("2024-06-20")), // Thursday
        Timestamp.fromDate(new Date("2024-06-21")) // Friday
      ]
      expect(BookingUtils.getPricingBreakdown(dates)).toEqual({
        [LodgePricingTypeValues.Normal]: 1,
        [LodgePricingTypeValues.SingleFridayOrSaturday]: 1
      })
    })

    it("should charge the more expensive rate for a Saturday booked without its Friday (Sat + Sun)", () => {
      const dates = [
        Timestamp.fromDate(new Date("2024-06-22")), // Saturday
        Timestamp.fromDate(new Date("2024-06-23")) // Sunday
      ]
      expect(BookingUtils.getPricingBreakdown(dates)).toEqual({
        [LodgePricingTypeValues.Normal]: 1,
        [LodgePricingTypeValues.SingleFridayOrSaturday]: 1
      })
    })

    it("should give the weekend rate to a Fri + Sat pair within a longer stay (Thu -> Sun)", () => {
      const dates = [
        Timestamp.fromDate(new Date("2024-06-20")), // Thursday
        Timestamp.fromDate(new Date("2024-06-21")), // Friday
        Timestamp.fromDate(new Date("2024-06-22")), // Saturday
        Timestamp.fromDate(new Date("2024-06-23")) // Sunday
      ]
      expect(BookingUtils.getPricingBreakdown(dates)).toEqual({
        [LodgePricingTypeValues.Normal]: 2, // Thu, Sun
        [LodgePricingTypeValues.Weekend]: 2 // Fri, Sat
      })
    })

    it("should charge both nights at the weekend rate for Fri + Sat", () => {
      const dates = [
        Timestamp.fromDate(new Date("2024-06-21")), // Friday
        Timestamp.fromDate(new Date("2024-06-22")) // Saturday
      ]
      expect(BookingUtils.getPricingBreakdown(dates)).toEqual({
        [LodgePricingTypeValues.Weekend]: 2
      })
    })

    it("should charge all nights at the normal rate for a weekday-only booking (Mon + Tue)", () => {
      const dates = [
        Timestamp.fromDate(new Date("2024-06-17")), // Monday
        Timestamp.fromDate(new Date("2024-06-18")) // Tuesday
      ]
      expect(BookingUtils.getPricingBreakdown(dates)).toEqual({
        [LodgePricingTypeValues.Normal]: 2
      })
    })

    it("should correctly count nights for a booking spanning two weekends", () => {
      // Fri 21 Jun -> Fri 28 Jun inclusive (8 nights)
      const dates = [
        Timestamp.fromDate(new Date("2024-06-21")), // Friday
        Timestamp.fromDate(new Date("2024-06-22")), // Saturday
        Timestamp.fromDate(new Date("2024-06-23")), // Sunday
        Timestamp.fromDate(new Date("2024-06-24")), // Monday
        Timestamp.fromDate(new Date("2024-06-25")), // Tuesday
        Timestamp.fromDate(new Date("2024-06-26")), // Wednesday
        Timestamp.fromDate(new Date("2024-06-27")), // Thursday
        Timestamp.fromDate(new Date("2024-06-28")) // Friday
      ]
      expect(BookingUtils.getPricingBreakdown(dates)).toEqual({
        [LodgePricingTypeValues.Weekend]: 2, // Fri 21 + Sat 22 (full weekend)
        [LodgePricingTypeValues.SingleFridayOrSaturday]: 1, // Fri 28 has no Sat
        [LodgePricingTypeValues.Normal]: 5 // Sun, Mon, Tue, Wed, Thu
      })
    })

    it("should return an empty breakdown for no dates", () => {
      expect(BookingUtils.getPricingBreakdown([])).toEqual({})
    })
  })

  describe("BookingUtils.getLodgeCreditDiscountAmount", () => {
    const unitAmountByType = {
      [LodgePricingTypeValues.Normal]: 4000, // $40
      [LodgePricingTypeValues.Weekend]: 5000, // $50
      [LodgePricingTypeValues.SingleFridayOrSaturday]: 6000 // $60
    }

    it("should discount weeknight credits against the actual consumed night rate (Friday without its Saturday)", () => {
      // Thu (normal) + Fri (no Saturday, so the more expensive rate).
      const dates = [
        Timestamp.fromDate(new Date("2024-06-20")), // Thursday - normal
        Timestamp.fromDate(new Date("2024-06-21")) // Friday - single fri/sat
      ]
      // Weeknight credit consumes the most expensive weeknight first (Fri @ $60)
      const result = BookingUtils.getLodgeCreditDiscountAmount(
        dates,
        { weekNightsOnly: 1, anyNight: 0 },
        unitAmountByType
      )
      expect(result).toEqual(6000)
    })

    it("should discount any-night credits against a Saturday at the weekend rate", () => {
      const dates = [
        Timestamp.fromDate(new Date("2024-06-21")), // Friday - weekend
        Timestamp.fromDate(new Date("2024-06-22")) // Saturday - weekend
      ]
      // Weeknight credit can consume Fri (weekend rate); any-night consumes Sat.
      const result = BookingUtils.getLodgeCreditDiscountAmount(
        dates,
        { weekNightsOnly: 1, anyNight: 1 },
        unitAmountByType
      )
      expect(result).toEqual(10000) // $50 (Fri) + $50 (Sat)
    })

    it("should sum consumed-night rates for a mixed booking", () => {
      // Thu (normal), Fri (weekend), Sat (weekend)
      const dates = [
        Timestamp.fromDate(new Date("2024-06-20")), // Thursday - normal
        Timestamp.fromDate(new Date("2024-06-21")), // Friday - weekend
        Timestamp.fromDate(new Date("2024-06-22")) // Saturday - weekend
      ]
      // 1 weeknight credit (consumes Fri @ $50), 1 any-night credit (consumes Sat @ $50)
      const result = BookingUtils.getLodgeCreditDiscountAmount(
        dates,
        { weekNightsOnly: 1, anyNight: 1 },
        unitAmountByType
      )
      expect(result).toEqual(10000)
    })

    it("should return 0 when no credits are applied", () => {
      const dates = [Timestamp.fromDate(new Date("2024-06-20"))]
      const result = BookingUtils.getLodgeCreditDiscountAmount(
        dates,
        { weekNightsOnly: 0, anyNight: 0 },
        unitAmountByType
      )
      expect(result).toEqual(0)
    })

    /**
     * `PaymentController.getBookingPayment` only looks up a Stripe product for
     * the pricing types that actually appear in the booking's breakdown, so
     * `unitAmountByType` is **sparse**: a lone Friday/Saturday booking only ever
     * has a `SingleFridayOrSaturday` entry, with no `Weekend` entry at all.
     *
     * These tests mirror that sparseness. A regression that looks up the wrong
     * (absent) pricing type silently falls back to a 0 rate, which produced a
     * `amount_off: 0` coupon and a `StripeInvalidRequestError` that failed the
     * entire booking.
     */
    const unitAmountsAsControllerWouldBuild = (
      dates: Timestamp[]
    ): Partial<Record<LodgePricingTypeValues, number>> => {
      const sparse: Partial<Record<LodgePricingTypeValues, number>> = {}
      for (const pricingType of Object.keys(
        BookingUtils.getPricingBreakdown(dates)
      ) as LodgePricingTypeValues[]) {
        sparse[pricingType] = unitAmountByType[pricingType]
      }
      return sparse
    }

    it.each([
      ["Friday", "2024-06-21"],
      ["Saturday", "2024-06-22"]
    ])(
      "should discount a single-night lone %s booking at the single Fri/Sat rate",
      (_day, isoDate) => {
        const dates = [Timestamp.fromDate(new Date(isoDate))]
        const sparseUnitAmounts = unitAmountsAsControllerWouldBuild(dates)

        // Sanity check: the weekend rate genuinely is not available here.
        expect(sparseUnitAmounts).toEqual({
          [LodgePricingTypeValues.SingleFridayOrSaturday]: 6000
        })

        const creditsToApply = BookingUtils.getDiscountableNights(dates, {
          weekNightsOnly: 2,
          anyNight: 2
        })

        const result = BookingUtils.getLodgeCreditDiscountAmount(
          dates,
          creditsToApply,
          sparseUnitAmounts
        )

        expect(result).toEqual(6000)
      }
    )

    it("should never return a 0 discount when credits are actually consumed", () => {
      /**
       * Stripe rejects a coupon with `amount_off` below 1, so any booking that
       * consumes at least one credit must produce a positive discount.
       */
      const bookingStartDates = [
        "2024-06-17", // Mon
        "2024-06-18", // Tue
        "2024-06-19", // Wed
        "2024-06-20", // Thu
        "2024-06-21", // Fri
        "2024-06-22", // Sat
        "2024-06-23" // Sun
      ]

      for (const startDate of bookingStartDates) {
        for (let nights = 1; nights <= 4; nights++) {
          const dates = Array.from({ length: nights }, (_, offset) =>
            Timestamp.fromDate(
              new Date(
                new Date(startDate).getTime() + offset * 24 * 60 * 60 * 1000
              )
            )
          )
          const creditsToApply = BookingUtils.getDiscountableNights(dates, {
            weekNightsOnly: 1,
            anyNight: 1
          })
          const totalCreditsApplied =
            creditsToApply.weekNightsOnly + creditsToApply.anyNight

          if (totalCreditsApplied === 0) {
            continue
          }

          const result = BookingUtils.getLodgeCreditDiscountAmount(
            dates,
            creditsToApply,
            unitAmountsAsControllerWouldBuild(dates)
          )

          // Compared as an object so a failure names the offending booking.
          expect({
            startDate,
            nights,
            isValidStripeAmountOff: result >= 1
          }).toEqual({ startDate, nights, isValidStripeAmountOff: true })
        }
      }
    })
  })
})
