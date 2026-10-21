import { useMutation } from "@tanstack/react-query";
import { session } from "@/shared/api/client";
import {
  registerAccount,
  requestEmailVerification,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from "./account.service";

export function useSignInMutation() {
  return useMutation({ mutationFn: session.open });
}

export function useSignOutMutation() {
  return useMutation({ mutationFn: session.close });
}

export function useRegisterAccountMutation() {
  return useMutation({ mutationFn: registerAccount });
}

export function useVerifyEmailMutation() {
  return useMutation({ mutationFn: verifyEmail });
}

export function useRequestEmailVerificationMutation() {
  return useMutation({ mutationFn: requestEmailVerification });
}

export function useRequestPasswordResetMutation() {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function useResetPasswordMutation() {
  return useMutation({ mutationFn: resetPassword });
}
