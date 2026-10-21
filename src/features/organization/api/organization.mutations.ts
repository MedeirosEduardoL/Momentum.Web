import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  changeOrganizationMemberAiPermission,
  changeOrganizationMemberRole,
  removeOrganizationMember,
} from "./organization.service";

export function useChangeOrganizationMemberRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeOrganizationMemberRole,
    onSettled: () => queryClient.invalidateQueries(),
  });
}

export function useChangeOrganizationMemberAiPermissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeOrganizationMemberAiPermission,
    onSettled: () => queryClient.invalidateQueries(),
  });
}

export function useRemoveOrganizationMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeOrganizationMember,
    onSettled: () => queryClient.invalidateQueries(),
  });
}
