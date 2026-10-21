import { Pencil } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { MarkdownSection } from "@/shared/ui/markdown-section";
import { SelectField, type SelectOption } from "@/shared/ui/select-field";
import { CARD_TASK_DESCRIPTION_LABELS, CARD_TASK_STATE_OPTIONS } from "../model/lib/card-options";
import type { CardTask, CardTaskState } from "../model/types/card.types";

type CardTaskOverviewProps = {
  task: CardTask;
  assigneeOptions: SelectOption[];
  selected: { state: CardTaskState; assigneeId: string };
  isBusy: boolean;
  onStateChange: (task: CardTask, state: CardTaskState) => void;
  onAssigneeChange: (task: CardTask, userId: string) => void;
  onEdit: () => void;
};

export function CardTaskOverview({
  task,
  assigneeOptions,
  selected,
  isBusy,
  onStateChange,
  onAssigneeChange,
  onEdit,
}: CardTaskOverviewProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Estado"
          options={CARD_TASK_STATE_OPTIONS}
          value={selected.state}
          disabled={isBusy}
          onValueChange={state => onStateChange(task, state)}
        />
        <SelectField
          label="Responsável"
          options={assigneeOptions}
          value={selected.assigneeId}
          disabled={isBusy}
          onValueChange={userId => onAssigneeChange(task, userId)}
        />
      </div>
      <MarkdownSection
        title={CARD_TASK_DESCRIPTION_LABELS[task.kind]}
        content={task.description}
        emptyText="Sem descrição."
      />
      <div>
        <Button variant="secondary" onClick={onEdit}>
          <Pencil aria-hidden className="size-4" />
          Editar
        </Button>
      </div>
    </div>
  );
}
