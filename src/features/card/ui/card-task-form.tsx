import { Button } from "@/shared/ui/button";
import { SelectField, type SelectOption } from "@/shared/ui/select-field";
import { TextField } from "@/shared/ui/text-field";
import { useCreateCardTask } from "../model/hooks/use-create-card-task";
import {
  CARD_TASK_KIND_LABELS,
  CARD_TASK_KIND_OPTIONS,
  CARD_TASK_NEW_LABELS,
} from "../model/lib/card-options";
import { CARD_TASK_LIMITS } from "../model/schemas/card-task.schema";
import type { Card } from "../model/types/card.types";

type CardTaskFormProps = {
  card: Card;
  assigneeOptions: SelectOption[];
};

export function CardTaskForm({ card, assigneeOptions }: CardTaskFormProps) {
  const { form, onSubmit, isSaving } = useCreateCardTask(card);
  const { errors } = form.formState;
  const kind = form.watch("kind");

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-end gap-3">
      <SelectField
        label="Tipo"
        options={CARD_TASK_KIND_OPTIONS}
        error={errors.kind?.message}
        {...form.register("kind")}
      />
      <TextField
        label={CARD_TASK_NEW_LABELS[kind]}
        className="min-w-48 flex-1"
        autoComplete="off"
        maxLength={CARD_TASK_LIMITS.title}
        error={errors.title?.message}
        {...form.register("title")}
      />
      <SelectField
        label="Responsável"
        options={assigneeOptions}
        error={errors.assigneeId?.message}
        {...form.register("assigneeId")}
      />
      <Button type="submit" isLoading={isSaving}>
        Adicionar {CARD_TASK_KIND_LABELS[kind].toLowerCase()}
      </Button>
    </form>
  );
}
