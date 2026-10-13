import { useMutation } from "@tanstack/react-query"
import UserService from "./UserService"
import { sendEmailVerification, signInWithCustomToken } from "firebase/auth"
import { auth } from "@/firebase"
import queryClient from "@/services/QueryClient"
import { SELF_DATA_QUERY_KEY } from "./UserQueries"

const SIGN_UP_USER_MUTATION_KEY = "signUpUser" as const

export function useSignUpUserMutation() {
  return useMutation({
    mutationKey: [SIGN_UP_USER_MUTATION_KEY],
    mutationFn: UserService.signUpUser,
    onSuccess: async (data) => {
      if (data?.jwtToken) {
        const { user } = await signInWithCustomToken(auth, data.jwtToken)
        // It must be non-blocking
        sendEmailVerification(user).catch((e) =>
          console.error("Failed to send verification email", e)
        )
      }
    },
    retry: 0
  })
}

export function useEditSelfMutation() {
  return useMutation({
    mutationKey: ["editSelf"],
    mutationFn: UserService.editSelf,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [SELF_DATA_QUERY_KEY]
      })
  })
}
