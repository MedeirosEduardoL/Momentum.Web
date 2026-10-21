import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { Notice } from "@/shared/ui/notice";
import { TextAreaField } from "@/shared/ui/text-area-field";
import { TextField } from "@/shared/ui/text-field";
import { GROUP_LIMITS, type GroupFormValues } from "../model/schemas/group.schema";

type GroupFormProps = {
  form: UseFormReturn<GroupFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isSaving: boolean;
  epicError?: string;
  submitLabel: string;
};

export function GroupForm({ form, onSubmit, isSaving, epicError, submitLabel }: GroupFormProps) {
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {epicError && <Notice tone="danger">{epicError}</Notice>}
      <TextField
        label="Título"
        autoComplete="off"
        maxLength={GROUP_LIMITS.title}
        error={errors.title?.message}
        {...form.register("title")}
      />
      <TextAreaField
        label="Descrição"
        hint="Aceita markdown."
        rows={8}
        maxLength={GROUP_LIMITS.description}
        error={errors.description?.message}
        {...form.register("description")}
      />
      <div>
        <Button type="submit" isLoading={isSaving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
