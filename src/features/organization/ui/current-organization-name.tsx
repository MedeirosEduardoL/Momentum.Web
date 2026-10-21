import { useGetCurrentOrganization } from "../api/organization.queries";

export function CurrentOrganizationName() {
  const organization = useGetCurrentOrganization();

  if (!organization.data) {
    return null;
  }

  return <span className="truncate text-sm text-ink-muted">{organization.data.name}</span>;
}
