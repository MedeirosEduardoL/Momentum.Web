import { toast } from "sonner";
import { useListProjectMembers } from "@/features/project";
import { toastApiError } from "@/shared/api/toast-api-error";
import { useSetCardAssigneeMutation, useUpdateCardMutation } from "../../api/card.mutations";
import { NO_ASSIGNEE } from "../lib/card-options";
import { isAssigneeOutsideProject, wasCardChangedMeanwhile } from "../lib/card-refusal";
import type { Card, CardChanges, CardPriority } from "../types/card.types";

const CHANGED_MEANWHILE_MESSAGE =
  "O card foi alterado por outra pessoa. A tela mostra a versão atual: confira e refaça a alteração.";

export function useCardActions(card: Card) {
  const team = useListProjectMembers(card.projectId);
  const update = useUpdateCardMutation();
  const assignment = useSetCardAssigneeMutation();
  const pendingChanges = update.isPending ? update.variables : null;
  const pendingAssignment = assignment.isPending ? assignment.variables : null;
  const assigneeId = pendingAssignment ? pendingAssignment.userId : card.assignee?.userId;

  function refuse(error: unknown) {
    if (wasCardChangedMeanwhile(error)) {
      toast.error(CHANGED_MEANWHILE_MESSAGE);
      return;
    }

    toastApiError(error);

    if (isAssigneeOutsideProject(error)) {
      void team.refetch();
    }
  }

  const change = (changes: CardChanges) =>
    update.mutate({ cardId: card.id, ...changes }, { onError: refuse });

  return {
    changeState: (cardStateId: string) => change({ cardStateId }),
    changePriority: (priority: CardPriority) => change({ priority }),
    changeAssignee: (userId: string) =>
      assignment.mutate({ cardId: card.id, userId: userId || null }, { onError: refuse }),
    archive: () => change({ isArchived: true }),
    unarchive: () => change({ isArchived: false }),
    isBusy: update.isPending || assignment.isPending,
    selected: {
      cardStateId: pendingChanges?.cardStateId ?? card.state.id,
      priority: pendingChanges?.priority ?? card.priority,
      assigneeId: assigneeId ?? NO_ASSIGNEE,
    },
  };
}
