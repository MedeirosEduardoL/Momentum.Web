import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";
import { useCreateCardTask } from "../model/hooks/use-create-card-task";
import { CARD_TASK_NEW_LABELS } from "../model/lib/card-options";
import { CARD_TASK_LIMITS } from "../model/schemas/card-task.schema";
import type { CardSummary, CardTaskKind } from "../model/types/card.types";

type CardTileSubitemFormProps = {
  card: CardSummary;
  kind: CardTaskKind;
  onCreated: () => void;
};

export function CardTileSubitemForm({ card, kind, onCreated }: CardTileSubitemFormProps) {
  const { form, onSubmit, isSaving } = useCreateCardTask(card, { kind, onCreated });

  return (
    <form onSubmit={onSubmit} noValidate className="flex items-start gap-1">
      <TextField
        isLabelHidden
        label={`${CARD_TASK_NEW_LABELS[kind]} em ${card.identifier}`}
        placeholder={CARD_TASK_NEW_LABELS[kind]}
        autoComplete="off"
        maxLength={CARD_TASK_LIMITS.title}
        className="min-w-0 flex-1"
        inputClassName="h-8 text-sm"
        error={form.formState.errors.title?.message}
        {...form.register("title")}
      />
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        isLoading={isSaving}
        aria-label={`Adicionar: ${CARD_TASK_NEW_LABELS[kind].toLowerCase()} em ${card.identifier}`}
        className="h-8"
      >
        {!isSaving && <Plus aria-hidden className="size-4" />}
      </Button>
    </form>
  );
}
