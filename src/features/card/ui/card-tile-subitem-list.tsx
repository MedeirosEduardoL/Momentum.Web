import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import type { SelectOption } from "@/shared/ui/select-field";
import { useListCardTasks } from "../api/card.queries";
import { useCardTaskActions } from "../model/hooks/use-card-task-actions";
import { CARD_TASK_KIND_PLURAL_LABELS } from "../model/lib/card-options";
import type { CardSummary, CardTask, CardTaskKind } from "../model/types/card.types";
import { CardTaskDialog } from "./card-task-dialog";
import { CardTileSubitemForm } from "./card-tile-subitem-form";

type CardTileSubitemListProps = {
  card: CardSummary;
  kind: CardTaskKind;
  assigneeOptions: SelectOption[];
  shouldFocusForm?: boolean;
  onChanged: () => void;
};

export function CardTileSubitemList({
  card,
  kind,
  assigneeOptions,
  shouldFocusForm = false,
  onChanged,
}: CardTileSubitemListProps) {
  const tasks = useListCardTasks(card.id);
  const actions = useCardTaskActions(card.projectId, onChanged);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const subitems = (tasks.data ?? []).filter(task => task.kind === kind);
  const openTask = tasks.data?.find(task => task.id === openTaskId);

  function isDone(task: CardTask) {
    return actions.selectedOf(task).state === "done";
  }

  return (
    <div
      aria-label={`${CARD_TASK_KIND_PLURAL_LABELS[kind]} de ${card.identifier}`}
      role="group"
      className="flex flex-col gap-2 border-t border-line pt-2"
    >
      {tasks.isPending && <p className="text-xs text-ink-subtle">Carregando os subitens…</p>}
      {tasks.isError && (
        <p className="flex items-center gap-2 text-xs text-ink-subtle">
          Não foi possível carregar os subitens.
          <Button variant="ghost" size="sm" onClick={() => tasks.refetch()}>
            Tentar de novo
          </Button>
        </p>
      )}
      {subitems.length > 0 && (
        <ul className="flex flex-col gap-1">
          {subitems.map(task => (
            <li key={task.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                aria-label={`Concluir ${task.title}`}
                checked={isDone(task)}
                disabled={actions.isBusy}
                onChange={event =>
                  actions.changeState(task, event.target.checked ? "done" : "to_do")
                }
                className="mt-0.5 size-4 shrink-0 accent-accent disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setOpenTaskId(task.id)}
                className={cn(
                  "min-w-0 rounded-sm text-left break-words underline-offset-2 transition-colors duration-150 ease-out hover:text-accent-text hover:underline",
                  isDone(task) && "text-ink-subtle line-through"
                )}
              >
                {task.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      <CardTileSubitemForm
        card={card}
        kind={kind}
        shouldFocus={shouldFocusForm}
        onCreated={onChanged}
      />
      {openTask && (
        <CardTaskDialog
          key={openTask.id}
          card={card}
          task={openTask}
          assigneeOptions={assigneeOptions}
          selected={actions.selectedOf(openTask)}
          isBusy={actions.isBusy}
          onStateChange={actions.changeState}
          onAssigneeChange={actions.changeAssignee}
          onClose={() => setOpenTaskId(null)}
        />
      )}
    </div>
  );
}
