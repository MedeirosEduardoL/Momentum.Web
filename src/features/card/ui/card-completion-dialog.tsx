import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import type { CompletionConfirmation } from "../model/hooks/use-completion-confirmation";
import { describeTasksClosedBy } from "../model/lib/card-completion";

type CardCompletionDialogProps = {
  completion: CompletionConfirmation;
};

export function CardCompletionDialog({ completion }: CardCompletionDialogProps) {
  const { pending } = completion;

  if (!pending) {
    return null;
  }

  return (
    <ConfirmDialog
      open
      title={`Concluir ${pending.card.identifier}?`}
      description={describeTasksClosedBy(pending.openTaskCount)}
      confirmLabel="Concluir"
      onConfirm={completion.confirm}
      onCancel={completion.cancel}
    />
  );
}
