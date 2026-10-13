import type { UserAdditionalInfo } from "data-layer/models/firebase"

export interface UserSignupBody {
  email: string
  /**
   * The password to create the account with. Optional so that admins can
   * create accounts on behalf of members, who then set a password via a
   * password reset email.
   */
  password?: string
  user: Omit<UserAdditionalInfo, "stripe_id">
}
