import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  CARD_PRIORITY_OPTIONS,
  CARD_TYPE_OPTIONS,
  toAssigneeOptions,
  toFeatureOptions,
} from "@/features/card";
import { Button } from "@/shared/ui/button";
import { CheckboxGroupField } from "@/shared/ui/checkbox-group-field";
import { Notice } from "@/shared/ui/notice";
import { TextField } from "@/shared/ui/text-field";
import { toEpicOptions } from "../model/lib/board-options";
import { BOARD_LIMITS, type BoardFormValues } from "../model/schemas/board.schema";
import type { BoardFilterOptions } from "../model/types/board.types";

type BoardFormProps = {
  form: UseFormReturn<BoardFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isSaving: boolean;
  filterError?: string;
  options: BoardFilterOptions;
  notice?: string;
  submitLabel: string;
};

export function BoardForm({
  form,
  onSubmit,
  isSaving,
  filterError,
  options,
  notice,
  submitLabel,
}: BoardFormProps) {
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {notice && <Notice>{notice}</Notice>}
      {filterError && <Notice tone="danger">{filterError}</Notice>}
      <TextField
        label="Nome"
        autoComplete="off"
        maxLength={BOARD_LIMITS.name}
        error={errors.name?.message}
        {...form.register("name")}
      />
      <p className="text-sm text-ink-muted">
        O board mostra os cards que casam com todos os critérios preenchidos; dentro de um critério,
        basta casar com um dos valores marcados. Critério sem nada marcado não filtra.
      </p>
      <CheckboxGroupField
        label="Tipos de card"
        options={CARD_TYPE_OPTIONS}
        error={errors.cardTypes?.message}
        {...form.register("cardTypes")}
      />
      <CheckboxGroupField
        label="Prioridades"
        options={CARD_PRIORITY_OPTIONS}
        error={errors.priorities?.message}
        {...form.register("priorities")}
      />
      <CheckboxGroupField
        label="Responsáveis"
        options={toAssigneeOptions(options.team)}
        emptyText="O time ainda não tem ninguém."
        error={errors.assigneeIds?.message}
        {...form.register("assigneeIds")}
      />
      <CheckboxGroupField
        label="Features"
        options={toFeatureOptions(options.features)}
        emptyText="O projeto ainda não tem feature."
        error={errors.featureIds?.message}
        {...form.register("featureIds")}
      />
      <CheckboxGroupField
        label="Epics"
        options={toEpicOptions(options.epics)}
        emptyText="O projeto ainda não tem epic."
        error={errors.epicIds?.message}
        {...form.register("epicIds")}
      />
      <Button type="submit" isLoading={isSaving}>
        {submitLabel}
      </Button>
    </form>
  );
}
