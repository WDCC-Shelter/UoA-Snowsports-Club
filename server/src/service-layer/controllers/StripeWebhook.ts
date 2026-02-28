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
   * Constructs and verifies a Stripe event from the raw request.
   */
  private constructStripeEvent(
    stripe: Stripe,
    request: any
  ): Stripe.Event | null {
    try {
      console.log(process.env.STRIPE_WEBHOOK_SECRET)
      return stripe.webhooks.constructEvent(
        request.rawBody,
        request.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error(err)
      return null
    }
  }

  /**
   * Validates that the session has a valid user ID and that the user exists.
   * Returns the uid if valid, or null otherwise.
   */
  private async validateSessionUser(
    session: Stripe.Checkout.Session,
    userService: UserDataService,
    context: string
  ): Promise<string | null> {
    const uid = session.client_reference_id
    if (uid === undefined || !(await userService.getUserData(uid))) {
      console.log(
        `[WEBHOOK] internal error: failed to fetch uid from stripe session '${session.id}' (${context})`
      )
      return null
    }
    return uid
  }

  /**
   * Extracts and validates the checkout type from session metadata.
   * Returns the checkout type if found, or undefined otherwise.
   */
  private getCheckoutType(
    session: Stripe.Checkout.Session
  ): CheckoutTypeValues | undefined {
    return Object.values(CheckoutTypeValues).find(
      (c) => c === session.metadata[CHECKOUT_TYPE_KEY]
    )
  }

  /**
   * Handles booking payment processing with standard error handling.
   * Returns the appropriate status code.
   */
  private async processBookingPayment(
    stripeService: StripeService,
    uid: string,
    session: Stripe.Checkout.Session,
    label: string
  ): Promise<StatusCodes> {
    try {
      await stripeService.handleBookingPaymentSession(uid, session)
    } catch (e) {
      console.error(
        `[WEBHOOK] Failed to handle ${label} session '${session.id}': ${e}`
      )
      return StatusCodes.INTERNAL_SERVER_ERROR
    }
    return StatusCodes.OK
  }

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

    const event = this.constructStripeEvent(stripe, request)
    if (!event) {
      return this.setStatus(StatusCodes.UNAUTHORIZED)
    }

    const userService = new UserDataService()
    const stripeService = new StripeService()

    switch (event.type) {
      case "payment_intent.succeeded": {
        console.log("[WEBHOOK] received payment_intent.succeeded")
        const { id: payment_intent_id } = event.data.object
        console.log(
          `[WEBHOOK] received payment intent succeeded for payment intent '${payment_intent_id}'`
        )

        const session =
          await stripeService.retrieveCheckoutSessionFromPaymentIntent(
            payment_intent_id
          )

        const uid = await this.validateSessionUser(
          session,
          userService,
          `payment intent '${payment_intent_id}'`
        )
        if (!uid) {
          return this.setStatus(StatusCodes.BAD_REQUEST)
        }

        const checkoutType = this.getCheckoutType(session)
        if (checkoutType === undefined) {
          console.log(
            `[WEBHOOK] internal error: session '${session.id}' had no checkout type metadata (payment intent '${payment_intent_id}')`
          )
          return this.setStatus(StatusCodes.BAD_REQUEST)
        }

        switch (checkoutType) {
          case CheckoutTypeValues.BOOKING: {
            const status = await this.processBookingPayment(
              stripeService,
              uid,
              session,
              "booking payment"
            )
            return this.setStatus(status)
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
          discounts?: ReadonlyArray<Record<string, string>>
        } = event.data.object
        console.log(
          `[WEBHOOK] received checkout.session.completed for session '${session.id}'`
        )

        const checkoutType = this.getCheckoutType(session)
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

        const uid = await this.validateSessionUser(
          session,
          userService,
          `checkout.session.completed`
        )
        if (!uid) {
          return this.setStatus(StatusCodes.BAD_REQUEST)
        }

        const status = await this.processBookingPayment(
          stripeService,
          uid,
          session,
          "coupon booking"
        )
        if (status === StatusCodes.OK) {
          console.log(
            `[WEBHOOK] handled fully discounted booking for user '${uid}' from session '${session.id}'`
          )
        }
        return this.setStatus(status)
      }
    }

    return this.setStatus(StatusCodes.NOT_IMPLEMENTED)
  }
}
