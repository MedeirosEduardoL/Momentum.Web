import type { UseMutationResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";
import { TextField } from "@/shared/ui/text-field";
import { useEmailRequest } from "../model/hooks/use-email-request";

type EmailRequestFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  sentDescription: string;
  request: UseMutationResult<void, Error, string>;
  footer?: ReactNode;
};

export function EmailRequestForm({
  title,
  description,
  submitLabel,
  sentDescription,
  request,
  footer,
}: EmailRequestFormProps) {
  const { form, onSubmit, isSaving, sentTo } = useEmailRequest(request);

  if (sentTo) {
    return <Panel title="Confira o seu e-mail" description={sentDescription} footer={footer} />;
  }

  return (
    <Panel title={title} description={description} footer={footer}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="E-mail"
          type="email"
          autoComplete="username"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <Button type="submit" isLoading={isSaving}>
          {submitLabel}
        </Button>
      </form>
    </Panel>
  );
}
