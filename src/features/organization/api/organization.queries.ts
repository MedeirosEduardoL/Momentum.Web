import { useQuery } from "@tanstack/react-query";
import { organizationKeys } from "./organization-api-keys";
import { getCurrentOrganization, listOrganizationMembers } from "./organization.service";

type CurrentOrganizationOptions = {
  enabled?: boolean;
};

export function useGetCurrentOrganization({ enabled = true }: CurrentOrganizationOptions = {}) {
  return useQuery({
    queryKey: organizationKeys.current(),
    queryFn: getCurrentOrganization,
    enabled,
  });
}

export function useListOrganizationMembers() {
  return useQuery({
    queryKey: organizationKeys.members(),
    queryFn: listOrganizationMembers,
  });
}
