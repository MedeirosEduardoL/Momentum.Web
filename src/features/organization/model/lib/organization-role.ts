import type { SelectOption } from "@/shared/ui/select-field";
import type { Organization, OrganizationRole } from "../types/organization.types";

export const ORGANIZATION_ROLE_LABELS: Record<OrganizationRole, string> = {
  administrator: "Administrador da organização",
  member: "Membro",
};

export const ORGANIZATION_ROLE_OPTIONS: SelectOption<OrganizationRole>[] = [
  { value: "member", label: ORGANIZATION_ROLE_LABELS.member },
  { value: "administrator", label: ORGANIZATION_ROLE_LABELS.administrator },
];

export function isOrganizationAdministrator(organization: Organization | null | undefined) {
  return organization?.role === "administrator";
}
