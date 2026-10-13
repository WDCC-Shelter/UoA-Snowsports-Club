import type { UserAdditionalInfo } from "data-layer/models/firebase"

export interface UserSignupBody {
  email: string
  /**
   * The password to create the account with
   */
  password: string
  user: Omit<UserAdditionalInfo, "stripe_id">
}
