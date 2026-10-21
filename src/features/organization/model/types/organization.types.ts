import type { components } from "@/shared/api/generated/openapi";

export type OrganizationRole = components["schemas"]["OrganizationRole"];

export type Organization = {
  id: string;
  name: string;
  role: OrganizationRole;
  isAiEnabled: boolean;
};

export type OrganizationMember = {
  userId: string;
  name: string;
  email: string;
  role: OrganizationRole;
  isAiEnabled: boolean;
};

export type OrganizationMemberRoleChange = {
  userId: string;
  role: OrganizationRole;
};

export type OrganizationMemberAiPermissionChange = {
  userId: string;
  isAiEnabled: boolean;
};
