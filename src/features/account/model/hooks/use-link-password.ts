import type { UseMutationResult } from "@tanstack/react-query";
import { useForm, type Resolver } from "react-hook-form";
import { hasErrorCode } from "@/shared/api/api-error";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import type { LinkPasswordFormValues } from "../schemas/link-password.schema";
import type { LinkPassword } from "../types/account.types";

const LINK_INVALID = "AccountLinkInvalid";

type LinkPasswordOptions = {
  token: string | null;
  resolver: Resolver<LinkPasswordFormValues>;
  submission: UseMutationResult<void, Error, LinkPassword>;
  onDone: () => void;
};

export function useLinkPassword({ token, resolver, submission, onDone }: LinkPasswordOptions) {
  const form = useForm<LinkPasswordFormValues>({ resolver, defaultValues: { password: "" } });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    if (token === null) {
      return;
    }

    try {
      await submission.mutateAsync({ token, password });
      onDone();
    } catch (error) {
      if (!hasErrorCode(error, LINK_INVALID)) {
        applyApiErrors(form, error);
      }
    }
  });

  return {
    form,
    onSubmit,
    isSaving: submission.isPending,
    isLinkInvalid: token === null || hasErrorCode(submission.error, LINK_INVALID),
  };
}
