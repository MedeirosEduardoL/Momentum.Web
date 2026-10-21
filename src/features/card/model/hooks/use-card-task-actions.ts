import { toast } from "sonner";
import { useListProjectMembers } from "@/features/project";
import { toastApiError } from "@/shared/api/toast-api-error";
import {
  useDeleteCardTaskMutation,
  useSetCardTaskAssigneeMutation,
  useUpdateCardTaskMutation,
} from "../../api/card.mutations";
import { NO_ASSIGNEE } from "../lib/card-options";
import { isAssigneeOutsideProject } from "../lib/card-refusal";
import type { CardTask, CardTaskState } from "../types/card.types";

export function useCardTaskActions(projectId: string, onChanged?: () => void) {
  const team = useListProjectMembers(projectId);
  const update = useUpdateCardTaskMutation();
  const assignment = useSetCardTaskAssigneeMutation();
  const removal = useDeleteCardTaskMutation();
  const pendingChange = update.isPending ? update.variables : null;
  const pendingAssignment = assignment.isPending ? assignment.variables : null;

  function refuse(error: unknown) {
    toastApiError(error);

    if (isAssigneeOutsideProject(error)) {
      void team.refetch();
    }
  }

  function selectedOf(task: CardTask) {
    const state = pendingChange?.cardTaskId === task.id ? pendingChange.state : null;
    const assigneeId =
      pendingAssignment?.cardTaskId === task.id ? pendingAssignment.userId : task.assignee?.userId;

    return { state: state ?? task.state, assigneeId: assigneeId ?? NO_ASSIGNEE };
  }

  async function remove(task: CardTask) {
    try {
      await removal.mutateAsync(task.id);
      toast.success("Subitem excluído.");
      onChanged?.();
    } catch (error) {
      toastApiError(error);
    }
  }

  return {
    changeState: (task: CardTask, state: CardTaskState) =>
      update.mutate({ cardTaskId: task.id, state }, { onSuccess: onChanged, onError: refuse }),
    changeAssignee: (task: CardTask, userId: string) =>
      assignment.mutate(
        { cardTaskId: task.id, userId: userId || null },
        { onSuccess: onChanged, onError: refuse }
      ),
    remove,
    selectedOf,
    isBusy: update.isPending || assignment.isPending,
  };
}
