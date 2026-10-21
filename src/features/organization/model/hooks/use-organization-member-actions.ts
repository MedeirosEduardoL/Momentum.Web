import { toast } from "sonner";
import { toastApiError } from "@/shared/api/toast-api-error";
import {
  useChangeOrganizationMemberAiPermissionMutation,
  useChangeOrganizationMemberRoleMutation,
  useRemoveOrganizationMemberMutation,
} from "../../api/organization.mutations";
import type {
  OrganizationMember,
  OrganizationMemberAiPermissionChange,
  OrganizationMemberRoleChange,
} from "../types/organization.types";

export function useOrganizationMemberActions() {
  const roleChange = useChangeOrganizationMemberRoleMutation();
  const aiPermissionChange = useChangeOrganizationMemberAiPermissionMutation();
  const removal = useRemoveOrganizationMemberMutation();

  const changeRole = (change: OrganizationMemberRoleChange) =>
    roleChange.mutate(change, { onError: toastApiError });

  const changeAiPermission = (change: OrganizationMemberAiPermissionChange) =>
    aiPermissionChange.mutate(change, { onError: toastApiError });

  async function remove(member: OrganizationMember) {
    try {
      await removal.mutateAsync(member.userId);
      toast.success(`${member.name} não participa mais da organização.`);
    } catch (error) {
      toastApiError(error);
    }
  }

  return {
    changeRole,
    changeAiPermission,
    remove,
    pendingRoleChange: roleChange.isPending ? roleChange.variables : null,
    pendingAiPermissionChange: aiPermissionChange.isPending ? aiPermissionChange.variables : null,
    isChanging: roleChange.isPending || aiPermissionChange.isPending,
  };
}
