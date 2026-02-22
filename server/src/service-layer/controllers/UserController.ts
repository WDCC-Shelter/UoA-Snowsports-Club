import AuthService from "business-layer/services/AuthService"
import { AuthServiceClaims } from "business-layer/utils/AuthServiceClaims"
import UserDataService from "data-layer/services/UserDataService"
import { getReasonPhrase, StatusCodes } from "http-status-codes"
import type {
  DeleteUserRequestBody,
  EditSelfRequestBody,
  EditSelfRequestModel,
  SelfRequestModel
} from "service-layer/request-models/UserRequests"
import type { CommonResponse } from "service-layer/response-models/CommonResponse"
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Request,
  Route,
  Security,
  SuccessResponse
} from "tsoa"
import StripeService from "../../business-layer/services/StripeService"

@Route("users")
export class UsersController extends Controller {
  /**
   * Fetches users additional info based on their uid.
   * @param request - Takes a UserRecord and uses the UID to fetch the user's additional info.
   * @returns The additionalInfo of the user.
   */
  @SuccessResponse("200", "Fetched self data")
  @Security("jwt")
  @Get("self")
  public async getSelf(@Request() request: SelfRequestModel) {
    const data = await new UserDataService().getUserData(request.user.uid)

    // Don't want users editing this
    delete data.stripe_id

    if (data !== undefined) {
      this.setStatus(StatusCodes.OK)
    } else {
      this.setStatus(StatusCodes.NOT_FOUND)
    }

    return data
  }

  /**
   * Fetches how many lodge the user has based on uid
   *
   * @param request - Takes a UserRecord and uses the UID to fetch the user's additional info.
   * @returns The quantity of lodge credits the user has.
   */
  @SuccessResponse("200", "Fetched lodge credits for user data")
  @Security("jwt")
  @Get("self/lodge-credits")
  public async getCurrentLodgeCredits(@Request() request: SelfRequestModel) {
    const { uid } = request.user
    const userDataService = new UserDataService()
    const userData = await userDataService.getUserData(uid)
    const stripeService = new StripeService()

    let stripeId: string
    if (!userData.stripe_id) {
      const { stripeCustomerId } = await stripeService.createCustomerIfNotExist(
        request.user,
        userData,
        userDataService
      )
      stripeId = stripeCustomerId
      return 0
    } else {
      stripeId = userData.stripe_id
    }

    return await stripeService.getLodgeCreditsForUser(stripeId)
  }

  /**
   * Edits the user's additional info based on their uid.
   * @param request - Takes a UserRecord and uses the UID to edit the user's additional info.
   * @param requestBody - The updated user additional info, note that the stripe_id is omitted.
   * @returns void.
   */
  @SuccessResponse("200", "Successful edit")
  @Security("jwt")
  @Patch("edit-self")
  public async editSelf(
    @Request() request: EditSelfRequestModel,
    @Body() requestBody: EditSelfRequestBody
  ): Promise<void> {
    try {
      await new UserDataService().editUserData(
        request.user.uid,
        requestBody.updatedInformation
      )
      this.setStatus(StatusCodes.OK)
    } catch (error) {
      console.error(error)
      this.setStatus(StatusCodes.UNAUTHORIZED)
    }
  }

  /**
   * Deletes a user based on their uid. This requires an admin JWT token.
   * @param requestBody - The uid of the user to be deleted.
   * @returns void.
   */
  @SuccessResponse("200", "Deleted user")
  @Security("jwt", ["admin"])
  @Delete("delete-user")
  public async deleteUser(
    @Body() requestBody: DeleteUserRequestBody
  ): Promise<CommonResponse | void> {
    try {
      const userUid = requestBody.uid
      if (userUid) {
        const authService = new AuthService()
        const userDataService = new UserDataService()

        let userClaims: Record<string, unknown>
        try {
          userClaims = await authService.getCustomerUserClaim(userUid)
        } catch (e) {
          console.info(`Couldn't fetch user claims for ${userUid}. ${e}`)
        }
        if (userClaims?.[AuthServiceClaims.ADMIN]) {
          this.setStatus(StatusCodes.FORBIDDEN)
          return {
            error: getReasonPhrase(StatusCodes.FORBIDDEN),
            message: "Cannot delete another admin."
          }
        }

        this.setStatus(StatusCodes.OK)
        try {
          await authService.deleteUser(userUid)
        } catch (e) {
          console.info(`Couldn't delete ${userUid} in auth. ${e}`)
        }

        try {
          await userDataService.deleteUserData(userUid)
        } catch (e) {
          console.info(`Couldn't delete ${userUid} in firestore. ${e}`)
        }
      }
    } catch (err) {
      this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR)
      console.error(err)
      return {
        error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        message:
          "An unexpected error occurred while processing the request. Please try again later."
      }
    }
  }
}
