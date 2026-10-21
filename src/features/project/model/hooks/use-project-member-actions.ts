import { toast } from "sonner";
import { toastApiError } from "@/shared/api/toast-api-error";
import {
  useRemoveProjectMemberMutation,
  useSetProjectMemberMutation,
} from "../../api/project.mutations";
import type { ProjectMember, ProjectRole } from "../types/project.types";

export function useProjectMemberActions(projectId: string) {
  const roleChange = useSetProjectMemberMutation();
  const removal = useRemoveProjectMemberMutation();

  const changeRole = (userId: string, role: ProjectRole) =>
    roleChange.mutate({ projectId, userId, role }, { onError: toastApiError });

  async function remove(member: ProjectMember) {
    try {
      await removal.mutateAsync({ projectId, userId: member.userId });
      toast.success(`${member.name} saiu do time.`);
    } catch (error) {
      toastApiError(error);
    }
  }

  return {
    changeRole,
    remove,
    pendingRoleChange: roleChange.isPending ? roleChange.variables : null,
  };
}
