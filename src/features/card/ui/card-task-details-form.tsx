import { Button } from "@/shared/ui/button";
import { TextAreaField } from "@/shared/ui/text-area-field";
import { TextField } from "@/shared/ui/text-field";
import { useEditCardTask } from "../model/hooks/use-edit-card-task";
import { CARD_TASK_DESCRIPTION_LABELS } from "../model/lib/card-options";
import { CARD_TASK_LIMITS } from "../model/schemas/card-task.schema";
import type { CardTask } from "../model/types/card.types";
import { ChangedMeanwhileNotice } from "./changed-meanwhile-notice";

type CardTaskDetailsFormProps = {
  task: CardTask;
  onDone: () => void;
};

export function CardTaskDetailsForm({ task, onDone }: CardTaskDetailsFormProps) {
  const { form, onSubmit, isSaving, hasChangedMeanwhile, loadCurrentVersion } = useEditCardTask({
    task,
    onSaved: onDone,
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {hasChangedMeanwhile && (
        <ChangedMeanwhileNotice subject="O subitem" onLoadCurrentVersion={loadCurrentVersion} />
      )}
      <TextField
        label="Título"
        autoComplete="off"
        maxLength={CARD_TASK_LIMITS.title}
        error={errors.title?.message}
        {...form.register("title")}
      />
      <TextAreaField
        label={CARD_TASK_DESCRIPTION_LABELS[task.kind]}
        hint="Aceita markdown."
        rows={10}
        error={errors.description?.message}
        {...form.register("description")}
      />
      <div className="flex gap-2">
        <Button type="submit" isLoading={isSaving}>
          Salvar
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
