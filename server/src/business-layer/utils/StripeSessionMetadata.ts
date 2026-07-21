/**
 * To be used when creating checkout sessions. The value will be the enum
 * `CheckoutTypeValues`
 *
 * @example [CHECKOUT_TYPE_KEY]: CheckoutTypeValues.BOOKING
 */
export const CHECKOUT_TYPE_KEY = "checkout_type"
export enum CheckoutTypeValues {
  MEMBERSHIP = "membership",
  BOOKING = "booking"
}

/**
 * For booking checkouts, stored in a Stripe session.
 *
 * The value at this metadata key will be a JSON serialized array, storing booking slot document IDs.
 *
 * @example '["ef40TsK5emACG5K08j2n", "Zx0hVyCax6YhTl9PRcTq"]'
 */
export const BOOKING_SLOTS_KEY = "booking_slot" as const

/**
 * Metadata used for better UX when user has an existing session
 * Should retrieve this from the session metadata
 *
 * **Start Date** the last date (inclusive) for the booking
 */
export const START_DATE = "start_date" as const

/**
 * Metadata used for better UX when user has an existing session
 * Should retrieve this from the session metadata
 *
 * **End Date** the last date (inclusive) for the booking
 */
export const END_DATE = "end date" as const

/**
 * For booking checkouts, stored in a Stripe session.
 *
 * The value at this metadata key will be a JSON serialized object mapping each
 * {@link LodgePricingTypeValues} used in the booking to the number of nights
 * charged at that rate.
 *
 * @example '{"normal":1,"weekend":1}'
 */
export const LODGE_PRICING_BREAKDOWN_KEY = "lodge_pricing_breakdown" as const
