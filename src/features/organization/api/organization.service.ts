import { hasErrorCode } from "@/shared/api/api-error";
import { api } from "@/shared/api/client";
import { fillPath } from "@/shared/api/fill-path";
import type { components, paths } from "@/shared/api/generated/openapi";
import type {
  Organization,
  OrganizationMember,
  OrganizationMemberAiPermissionChange,
  OrganizationMemberRoleChange,
} from "../model/types/organization.types";

type Schemas = components["schemas"];
type OrganizationDto = Schemas["OrganizationResponseDto"];
type OrganizationMemberDto = Schemas["OrganizationMemberResponseDto"];

const CURRENT_ORGANIZATION_PATH = "/api/v1/organizations/me" satisfies keyof paths;
const MEMBERS_PATH = "/api/v1/organizations/me/members" satisfies keyof paths;
const MEMBERSHIP_NOT_FOUND = "OrganizationMembershipNotFound";

function memberPath(userId: string) {
  return fillPath("/api/v1/organizations/me/members/{userId}", { userId });
}

function toOrganization(dto: OrganizationDto): Organization {
  return {
    id: dto.organization_id,
    name: dto.name,
    role: dto.role,
    isAiEnabled: dto.ai_enabled,
  };
}

function toOrganizationMember(dto: OrganizationMemberDto): OrganizationMember {
  return {
    userId: dto.user_id,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    isAiEnabled: dto.ai_enabled,
  };
}

export async function getCurrentOrganization(): Promise<Organization | null> {
  try {
    const response = await api.get<OrganizationDto>(CURRENT_ORGANIZATION_PATH);
    return toOrganization(response.data);
  } catch (error) {
    if (hasErrorCode(error, MEMBERSHIP_NOT_FOUND)) {
      return null;
    }

    throw error;
  }
}

export async function listOrganizationMembers(): Promise<OrganizationMember[]> {
  const response = await api.get<OrganizationMemberDto[]>(MEMBERS_PATH);
  return response.data.map(toOrganizationMember);
}

export async function changeOrganizationMemberRole({
  userId,
  role,
}: OrganizationMemberRoleChange): Promise<void> {
  const payload: Schemas["UpdateOrganizationMemberRequestDto"] = { role };

  await api.patch(memberPath(userId), payload);
}

export async function changeOrganizationMemberAiPermission({
  userId,
  isAiEnabled,
}: OrganizationMemberAiPermissionChange): Promise<void> {
  const payload: Schemas["UpdateOrganizationMemberRequestDto"] = {
    ai_enabled: isAiEnabled,
  };

  await api.patch(memberPath(userId), payload);
}

export async function removeOrganizationMember(userId: string): Promise<void> {
  await api.delete(memberPath(userId));
}
