import StripeService from "business-layer/services/StripeService"
import {
  CHECKOUT_TYPE_KEY,
  CheckoutTypeValues
} from "business-layer/utils/StripeSessionMetadata"
import { UnreachableCase } from "business-layer/utils/UnreachableCase"
import UserDataService from "data-layer/services/UserDataService"
import { StatusCodes } from "http-status-codes"
import Stripe from "stripe"
import { Controller, Post, Request, Route, SuccessResponse } from "tsoa"

@Route("webhook")
export class StripeWebhook extends Controller {
  /**
   * Webhook endpoint for Stripe events.
   * This single endpoint is setup in the Stripe developer config to handle various events.
   * @param request - The raw request that's passed from Stripe.
   * @returns void.
   */
  @Post()
  @SuccessResponse(200, "Webhook post received")
  public async receiveWebhook(@Request() request: any): Promise<void> {
    const stripe = new Stripe(process.env.STRIPE_API_KEY)

    // Ensure security of the endpoint by constructing an event
    let event: Stripe.Event
    try {
      console.log(process.env.STRIPE_WEBHOOK_SECRET)
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        request.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error(err)
      return this.setStatus(StatusCodes.UNAUTHORIZED) // unauthorized request
    }

    // Create services
    const userService = new UserDataService()
    const stripeService = new StripeService()

    switch (event.type) {
      case "payment_intent.succeeded": {
        console.log("[WEBHOOK] received payment_intent.succeeded")
        // Stripe PaymentIntent
        const { id: payment_intent_id } = event.data.object
        console.log(
          `[WEBHOOK] received payment intent succeeded for payment intent '${payment_intent_id}'`
        )
        // Fetch the checkout session from the PaymentIntent ID
        const session =
          await stripeService.retrieveCheckoutSessionFromPaymentIntent(
            payment_intent_id
          )
        const uid = session.client_reference_id
        if (uid === undefined || !(await userService.getUserData(uid))) {
          console.log(
            `[WEBHOOK] internal error: failed to fetch uid from stripe session '${session.id}' (payment intent '${payment_intent_id}')`
          )
          return this.setStatus(StatusCodes.BAD_REQUEST)
        }

        const checkoutType = Object.values(CheckoutTypeValues).find(
          (c) => c === session.metadata[CHECKOUT_TYPE_KEY]
        )
        if (checkoutType === undefined) {
          console.log(
            `[WEBHOOK] internal error: session '${session.id}' had no checkout type metadata (payment intent '${payment_intent_id}')`
          )
          return this.setStatus(StatusCodes.BAD_REQUEST)
        }

        switch (checkoutType) {
          case CheckoutTypeValues.BOOKING: {
            try {
              await stripeService.handleBookingPaymentSession(uid, session)
            } catch (e) {
              console.error(
                `[WEBHOOK] Failed to handle booking payment session '${session.id}': ${e}`
              )
              return this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR)
            }
            return this.setStatus(StatusCodes.OK)
          }
          case CheckoutTypeValues.MEMBERSHIP: {
            try {
              await stripeService.handleMembershipPaymentSession(uid)
            } catch (e) {
              console.error(
                `[WEBHOOK] Failed to handle membership payment session '${session.id}': ${e}`
              )
              return this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR)
            }
            console.log(
              `[WEBHOOK] added membership to user '${uid}' from session '${session.id}'`
            )
            return this.setStatus(StatusCodes.OK)
          }
          default: {
            throw new UnreachableCase(checkoutType)
          }
        }
      }

      case "checkout.session.completed": {
        const session: Stripe.Checkout.Session & {
          /**
           * This is a hack, but the typescript types for Stripe are wrong and
           * don't include discounts on the session object, even though they are present in the actual API response.
           */
          discounts?: ReadonlyArray<Record<string, string>>
        } = event.data.object
        console.log(
          `[WEBHOOK] received checkout.session.completed for session '${session.id}'`
        )

        const checkoutType = Object.values(CheckoutTypeValues).find(
          (c) => c === session.metadata[CHECKOUT_TYPE_KEY]
        )
        if (checkoutType !== CheckoutTypeValues.BOOKING) {
          console.log(
            `[WEBHOOK] checkout.session.completed for session '${session.id}' is not a booking, skipping`
          )
          return this.setStatus(StatusCodes.OK)
        }

        const hasCoupon = session.discounts.some(
          (discount) => discount.coupon !== undefined
        )

        if (!hasCoupon || session.amount_total !== 0) {
          console.log(
            `[WEBHOOK] checkout.session.completed for session '${session.id}' skipped`
          )
          return this.setStatus(StatusCodes.OK)
        }

        const uid = session.client_reference_id
        if (uid === undefined || !(await userService.getUserData(uid))) {
          console.log(
            `[WEBHOOK] internal error: failed to fetch uid from stripe session '${session.id}'`
          )
          return this.setStatus(StatusCodes.BAD_REQUEST)
        }

        try {
          await stripeService.handleBookingPaymentSession(uid, session)
        } catch (e) {
          console.error(
            `[WEBHOOK] Failed to handle coupon booking session '${session.id}': ${e}`
          )
          return this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR)
        }

        console.log(
          `[WEBHOOK] handled fully discounted booking for user '${uid}' from session '${session.id}'`
        )
        return this.setStatus(StatusCodes.OK)
      }
    }

    return this.setStatus(StatusCodes.NOT_IMPLEMENTED)
  }
}
