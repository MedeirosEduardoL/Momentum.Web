import { Badge } from "@/shared/ui/badge";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { SelectField, type SelectOption } from "@/shared/ui/select-field";
import { CARD_TASK_KIND_LABELS, CARD_TASK_STATE_OPTIONS } from "../model/lib/card-options";
import { CARD_TASK_KIND_TONES } from "../model/lib/card-tones";
import type { CardTask, CardTaskState } from "../model/types/card.types";

type CardTaskRowProps = {
  task: CardTask;
  assigneeOptions: SelectOption[];
  selected: { state: CardTaskState; assigneeId: string };
  isBusy: boolean;
  onOpen: (task: CardTask) => void;
  onStateChange: (task: CardTask, state: CardTaskState) => void;
  onAssigneeChange: (task: CardTask, userId: string) => void;
  onRemove: (task: CardTask) => Promise<void>;
};

export function CardTaskRow({
  task,
  assigneeOptions,
  selected,
  isBusy,
  onOpen,
  onStateChange,
  onAssigneeChange,
  onRemove,
}: CardTaskRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="flex min-w-40 flex-1 items-center gap-2">
        <Badge tone={CARD_TASK_KIND_TONES[task.kind]}>{CARD_TASK_KIND_LABELS[task.kind]}</Badge>
        <button
          type="button"
          onClick={() => onOpen(task)}
          className="rounded-sm text-left font-medium break-words underline-offset-2 transition-colors duration-150 ease-out hover:text-accent-text hover:underline"
        >
          {task.title}
        </button>
      </span>
      <SelectField
        isLabelHidden
        label={`Estado do subitem ${task.title}`}
        options={CARD_TASK_STATE_OPTIONS}
        value={selected.state}
        disabled={isBusy}
        onValueChange={state => onStateChange(task, state)}
      />
      <SelectField
        isLabelHidden
        label={`Responsável pelo subitem ${task.title}`}
        options={assigneeOptions}
        value={selected.assigneeId}
        disabled={isBusy}
        onValueChange={userId => onAssigneeChange(task, userId)}
      />
      <ConfirmButton
        title="Excluir o subitem?"
        description={`O subitem “${task.title}” sai do card, e o progresso do card é recalculado.`}
        confirmLabel="Excluir subitem"
        onConfirm={() => onRemove(task)}
      >
        Excluir
      </ConfirmButton>
    </li>
  );
}
