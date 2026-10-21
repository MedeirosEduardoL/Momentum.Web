import { useForm } from "react-hook-form";
import { getApiErrorMessage, getRetryAfterSeconds, hasErrorCode } from "@/shared/api/api-error";
import { formatWaitTime } from "@/shared/lib/format-wait-time";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useSignInMutation } from "../../api/account.mutations";
import { signInSchema, type SignInFormValues } from "../schemas/sign-in.schema";

const SIGN_IN_BLOCKED = "SignInTemporarilyBlocked";

function describeRefusal(error: unknown) {
  const waitInSeconds = getRetryAfterSeconds(error);

  if (hasErrorCode(error, SIGN_IN_BLOCKED) && waitInSeconds !== null) {
    return `Muitas tentativas de entrada com este e-mail. Tente de novo em ${formatWaitTime(waitInSeconds)}.`;
  }

  return getApiErrorMessage(error);
}

export function useSignIn() {
  const signIn = useSignInMutation();
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async values => {
    try {
      await signIn.mutateAsync(values);
    } catch (error) {
      form.setError("root", { type: "server", message: describeRefusal(error) });
    }
  });

  return {
    form,
    onSubmit,
    isSaving: signIn.isPending,
    refusal: form.formState.errors.root?.message,
  };
}
