import { MS_IN_SECOND } from "@/utils/Constants"
import { DateUtils } from "./DateUtils"

describe("DateUtils", () => {
  describe("datesToDateRange", () => {
    it("should return an array of dates between start and end date", () => {
      const startDate = new Date("2024-01-01")
      const endDate = new Date("2024-01-03")
      const result = DateUtils.datesToDateRange(startDate, endDate)
      expect(result).toEqual([
        new Date("2024-01-01"),
        new Date("2024-01-02"),
        new Date("2024-01-03")
      ])
    })
  })

  describe("isSingleFridayOrSaturday", () => {
    it("should return true if the date range is a single Friday or Saturday", () => {
      const friday = new Date("2024-01-05")
      const saturday = new Date("2024-01-06")
      expect(DateUtils.isSingleFridayOrSaturday(friday, friday)).toBe(true)
      expect(DateUtils.isSingleFridayOrSaturday(saturday, saturday)).toBe(true)
    })

    it("should return false if the date range is not a single Friday or Saturday", () => {
      const thursday = new Date("2024-01-04")
      const sunday = new Date("2024-01-07")
      expect(DateUtils.isSingleFridayOrSaturday(thursday, thursday)).toBe(false)
      expect(DateUtils.isSingleFridayOrSaturday(sunday, sunday)).toBe(false)
    })
  })

  describe("getNightPricingBreakdown", () => {
    it("should charge a lone Friday/Saturday at the single special rate", () => {
      const friday = new Date("2024-01-05")
      const saturday = new Date("2024-01-06")
      expect(DateUtils.getNightPricingBreakdown(friday, friday)).toEqual({
        normal: 0,
        weekend: 0,
        singleFridayOrSaturday: 1
      })
      expect(DateUtils.getNightPricingBreakdown(saturday, saturday)).toEqual({
        normal: 0,
        weekend: 0,
        singleFridayOrSaturday: 1
      })
    })

    it("should charge a Friday booked without its Saturday at the more expensive rate (Thu + Fri)", () => {
      const thursday = new Date("2024-01-04")
      const friday = new Date("2024-01-05")
      expect(DateUtils.getNightPricingBreakdown(thursday, friday)).toEqual({
        normal: 1,
        weekend: 0,
        singleFridayOrSaturday: 1
      })
    })

    it("should charge a Saturday booked without its Friday at the more expensive rate (Sat + Sun)", () => {
      const saturday = new Date("2024-01-06")
      const sunday = new Date("2024-01-07")
      expect(DateUtils.getNightPricingBreakdown(saturday, sunday)).toEqual({
        normal: 1,
        weekend: 0,
        singleFridayOrSaturday: 1
      })
    })

    it("should charge both nights at the weekend rate for Fri + Sat", () => {
      const friday = new Date("2024-01-05")
      const saturday = new Date("2024-01-06")
      expect(DateUtils.getNightPricingBreakdown(friday, saturday)).toEqual({
        normal: 0,
        weekend: 2,
        singleFridayOrSaturday: 0
      })
    })

    it("should give the weekend rate to a Fri + Sat pair within a longer stay (Thu -> Sun)", () => {
      const thursday = new Date("2024-01-04")
      const sunday = new Date("2024-01-07")
      expect(DateUtils.getNightPricingBreakdown(thursday, sunday)).toEqual({
        normal: 2, // Thu, Sun
        weekend: 2, // Fri, Sat
        singleFridayOrSaturday: 0
      })
    })

    it("should only give the weekend rate to the complete weekend when a stay spans two weekends", () => {
      // Fri 5 Jan -> Fri 12 Jan inclusive (8 nights)
      const firstFriday = new Date("2024-01-05")
      const secondFriday = new Date("2024-01-12")
      expect(
        DateUtils.getNightPricingBreakdown(firstFriday, secondFriday)
      ).toEqual({
        normal: 5, // Sun, Mon, Tue, Wed, Thu
        weekend: 2, // Fri 5 + Sat 6
        singleFridayOrSaturday: 1 // Fri 12 has no Saturday
      })
    })

    it("should charge all nights at the normal rate for a weekday-only booking (Mon + Tue)", () => {
      const monday = new Date("2024-01-08")
      const tuesday = new Date("2024-01-09")
      expect(DateUtils.getNightPricingBreakdown(monday, tuesday)).toEqual({
        normal: 2,
        weekend: 0,
        singleFridayOrSaturday: 0
      })
    })
  })

  describe("dateEqualToTimestamp", () => {
    it("should return true if date and timestamp are equal", () => {
      const date = new Date("2024-01-01")
      const timestamp = { seconds: date.getTime() / MS_IN_SECOND }
      expect(DateUtils.dateEqualToTimestamp(date, timestamp)).toBe(true)
    })

    it("should return false if date and timestamp are not equal", () => {
      const date = new Date("2024-01-01")
      const timestamp = { seconds: date.getTime() / MS_IN_SECOND + 1 }
      expect(DateUtils.dateEqualToTimestamp(date, timestamp)).toBe(false)
    })
  })

  describe("timestampToDate", () => {
    it("should convert timestamp to date", () => {
      const timestamp = { seconds: 1704067200, nanoseconds: 0 } // 2024-01-01T00:00:00.000Z
      const date = new Date("2024-01-01")
      expect(DateUtils.timestampToDate(timestamp)).toEqual(date)
    })
  })

  describe("timestampMilliseconds", () => {
    it("should return seconds from timestamp", () => {
      const timestamp = { seconds: 1609459200 }
      expect(DateUtils.timestampMilliseconds(timestamp)).toBe(1609459200000)
    })

    it("should return _seconds from timestamp", () => {
      const timestamp = { _seconds: 1609459200 }
      expect(DateUtils.timestampMilliseconds(timestamp)).toBe(1609459200000)
    })
  })

  describe("convertLocalDateToUTCDate", () => {
    it("should convert local date to UTC date", () => {
      const localDate = new Date("2024-01-01T00:00:00")
      const utcDate = new Date(Date.UTC(2024, 0, 1))
      expect(DateUtils.convertLocalDateToUTCDate(localDate)).toEqual(utcDate)
    })
  })

  describe("nzDateStringToMillis", () => {
    it("should get the correct time", () => {
      const date = new Date(69696969)
      const nzDateString = DateUtils.formattedNzDate(date)
      expect(
        new Date(DateUtils.nzDateStringToMillis(nzDateString)).toDateString()
      ).toEqual(date.toDateString())
    })
  })
})
