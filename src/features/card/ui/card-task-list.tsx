import { useState } from "react";
import type { ProjectMember } from "@/features/project";
import { Notice } from "@/shared/ui/notice";
import { useCardTaskActions } from "../model/hooks/use-card-task-actions";
import { NO_ASSIGNEE_OPTION, toAssigneeOptions } from "../model/lib/card-options";
import { CARD_TASK_LIMITS } from "../model/schemas/card-task.schema";
import type { Card, CardTask } from "../model/types/card.types";
import { CardTaskDialog } from "./card-task-dialog";
import { CardTaskForm } from "./card-task-form";
import { CardTaskRow } from "./card-task-row";

type CardTaskListProps = {
  card: Card;
  tasks: CardTask[];
  team: ProjectMember[];
};

function hasReachedTaskLimit(tasks: CardTask[]) {
  return tasks.length >= CARD_TASK_LIMITS.tasksPerCard;
}

export function CardTaskList({ card, tasks, team }: CardTaskListProps) {
  const actions = useCardTaskActions(card.projectId);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const openTask = tasks.find(task => task.id === openTaskId);
  const assigneeOptions = [NO_ASSIGNEE_OPTION, ...toAssigneeOptions(team)];

  return (
    <>
      {tasks.length === 0 ? (
        <p className="text-ink-subtle">Nenhum subitem.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line panel">
          {tasks.map(task => (
            <CardTaskRow
              key={task.id}
              task={task}
              assigneeOptions={assigneeOptions}
              selected={actions.selectedOf(task)}
              isBusy={actions.isBusy}
              onOpen={({ id }) => setOpenTaskId(id)}
              onStateChange={actions.changeState}
              onAssigneeChange={actions.changeAssignee}
              onRemove={actions.remove}
            />
          ))}
        </ul>
      )}
      {hasReachedTaskLimit(tasks) ? (
        <Notice>Este card já tem o máximo de 100 subitens.</Notice>
      ) : (
        <CardTaskForm card={card} assigneeOptions={assigneeOptions} />
      )}
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
    </>
  );
}
