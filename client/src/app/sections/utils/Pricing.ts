import type { MembershipPricing } from "@/components/utils/types"

/**
 * An object containing messages for the pricing banner.
 */
export const lodgeBookingPricingBannerMessages = {
  /**
   * The headline message for the pricing banner.
   */
  headline: "Great nightly rates" as const,

  /**
   * A function that returns a formatted price information string.
   *
   * @param {number} normalPrice - The normal price per night.
   * @returns {string} The formatted price information string.
   */
  priceInformation: (normalPrice: number) =>
    `$${normalPrice} per night*` as const,

  /**
   * A function that returns a formatted disclaimer message.
   *
   * @param {number} weekendPrice - The per-night price for Friday/Saturday nights, only when both are booked together.
   * @param {number} singleFridayOrSaturdayPrice - The price for a Friday or Saturday night booked without the other.
   * @returns {string} The formatted disclaimer message.
   */
  disclaimer: (weekendPrice: number, singleFridayOrSaturdayPrice: number) =>
    `*$${weekendPrice} per night when Friday and Saturday are booked together, otherwise $${singleFridayOrSaturdayPrice} per Friday or Saturday night` as const
} as const

export const MembershipPricings: MembershipPricing[] = [
  {
    title: "UoA Student",
    discountedPrice: "$45",
    originalPrice: "$65",
    extraInfo: "Save $20"
  },
  {
    title: "UoA Student",
    discountedPrice: "$45",
    originalPrice: "$65",
    extraInfo: "Save $20"
  },
  {
    title: "UoA Student",
    discountedPrice: "$45",
    originalPrice: "$65",
    extraInfo: "Save $20"
  },
  {
    title: "UoA Student",
    discountedPrice: "$45",
    originalPrice: "$65",
    extraInfo: "Save $20"
  }
]
