import type { UseMutationResult } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { emailRequestSchema, type EmailRequestFormValues } from "../schemas/email-request.schema";

type EmailRequestMutation = UseMutationResult<void, Error, string>;

export function useEmailRequest(request: EmailRequestMutation) {
  const form = useForm<EmailRequestFormValues>({
    resolver: zodResolver(emailRequestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    try {
      await request.mutateAsync(email);
    } catch (error) {
      applyApiErrors(form, error);
    }
  });

  return {
    form,
    onSubmit,
    isSaving: request.isPending,
    sentTo: request.isSuccess ? request.variables : null,
  };
}
