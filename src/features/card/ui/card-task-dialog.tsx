import { useState } from "react";
import { Modal } from "@/shared/ui/modal";
import type { SelectOption } from "@/shared/ui/select-field";
import { CARD_TASK_KIND_LABELS } from "../model/lib/card-options";
import type { CardSummary, CardTask, CardTaskState } from "../model/types/card.types";
import { CardTaskDetailsForm } from "./card-task-details-form";
import { CardTaskOverview } from "./card-task-overview";

type CardTaskDialogProps = {
  card: Pick<CardSummary, "identifier">;
  task: CardTask;
  assigneeOptions: SelectOption[];
  selected: { state: CardTaskState; assigneeId: string };
  isBusy: boolean;
  onStateChange: (task: CardTask, state: CardTaskState) => void;
  onAssigneeChange: (task: CardTask, userId: string) => void;
  onClose: () => void;
};

export function CardTaskDialog({ card, task, onClose, ...overview }: CardTaskDialogProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Modal
      open
      size="lg"
      onOpenChange={onClose}
      title={task.title}
      description={`${CARD_TASK_KIND_LABELS[task.kind]} de ${card.identifier}`}
    >
      {isEditing ? (
        <CardTaskDetailsForm task={task} onDone={() => setIsEditing(false)} />
      ) : (
        <CardTaskOverview task={task} onEdit={() => setIsEditing(true)} {...overview} />
      )}
    </Modal>
  );
}
