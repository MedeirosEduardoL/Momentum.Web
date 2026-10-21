import { useForm } from "react-hook-form";
import { hasErrorCode } from "@/shared/api/api-error";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useVerifyEmailMutation } from "../../api/account.mutations";
import { useGetEmailVerificationPreview } from "../../api/account.queries";
import {
  emailVerificationSchema,
  type EmailVerificationFormValues,
} from "../schemas/email-verification.schema";

const LINK_INVALID = "AccountLinkInvalid";
const ALREADY_VERIFIED = "AccountEmailAlreadyVerified";

const resolver = zodResolver(emailVerificationSchema);

type EmailVerificationView = "loading" | "invalid" | "already-verified" | "unavailable" | "form";

type EmailVerificationOptions = {
  token: string | null;
  onVerified: () => void;
};

function isLinkRefusal(error: unknown) {
  return hasErrorCode(error, LINK_INVALID) || hasErrorCode(error, ALREADY_VERIFIED);
}

export function useEmailVerification({ token, onVerified }: EmailVerificationOptions) {
  const preview = useGetEmailVerificationPreview(token);
  const verifyEmail = useVerifyEmailMutation();
  const form = useForm<EmailVerificationFormValues>({
    resolver,
    defaultValues: { name: "", password: "" },
    values: preview.data && { name: preview.data.name, password: "" },
  });
  const failure = verifyEmail.error ?? preview.error;

  function resolveView(): EmailVerificationView {
    if (token === null || hasErrorCode(failure, LINK_INVALID)) {
      return "invalid";
    }

    if (hasErrorCode(failure, ALREADY_VERIFIED)) {
      return "already-verified";
    }

    if (preview.data) {
      return "form";
    }

    return preview.isPending ? "loading" : "unavailable";
  }

  const onSubmit = form.handleSubmit(async ({ name, password }) => {
    if (token === null) {
      return;
    }

    try {
      await verifyEmail.mutateAsync({ token, name, password });
      onVerified();
    } catch (error) {
      if (!isLinkRefusal(error)) {
        applyApiErrors(form, error);
      }
    }
  });

  return {
    form,
    onSubmit,
    view: resolveView(),
    failure,
    retryPreview: () => preview.refetch(),
    isSaving: verifyEmail.isPending,
  };
}
