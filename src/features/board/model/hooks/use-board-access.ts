import { useListProjectMembers, type ProjectMember } from "@/features/project";
import { toastApiError } from "@/shared/api/toast-api-error";
import {
  useAddBoardMemberMutation,
  useRemoveBoardMemberMutation,
  useSetBoardVisibilityMutation,
} from "../../api/board.mutations";
import { useListBoardMembers } from "../../api/board.queries";
import type { Board, BoardVisibility } from "../types/board.types";

function isAdministrator(member: ProjectMember) {
  return member.role === "administrator";
}

async function withErrorToast(action: Promise<unknown>) {
  try {
    await action;
  } catch (error) {
    toastApiError(error);
  }
}

export function useBoardAccess(board: Board) {
  const team = useListProjectMembers(board.projectId);
  const members = useListBoardMembers(board.id);
  const visibility = useSetBoardVisibilityMutation(board.id);
  const grant = useAddBoardMemberMutation();
  const revoke = useRemoveBoardMemberMutation();
  const teamMembers = team.data ?? [];
  const chosenIds = new Set((members.data ?? []).map(member => member.userId));

  return {
    team,
    members,
    administrators: teamMembers.filter(isAdministrator),
    candidates: teamMembers.filter(
      member => !isAdministrator(member) && !chosenIds.has(member.userId)
    ),
    isBusy: visibility.isPending || grant.isPending || revoke.isPending,
    changeVisibility: (next: BoardVisibility) => withErrorToast(visibility.mutateAsync(next)),
    grantAccess: (userId: string) =>
      withErrorToast(grant.mutateAsync({ boardId: board.id, userId })),
    revokeAccess: (userId: string) =>
      withErrorToast(revoke.mutateAsync({ boardId: board.id, userId })),
  };
}
