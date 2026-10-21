import type { OrganizationRole } from "@/features/organization";
import type { ProjectRole } from "@/features/project";

export type InvitationPreview = {
  organizationName: string;
  email: string;
  accountExists: boolean;
};

export type InvitationAcceptance = {
  token: string;
  name: string | null;
  password: string;
};

export type InvitationProject = {
  projectId: string;
  role: ProjectRole;
};

export type NewInvitation = {
  email: string;
  role: OrganizationRole;
  projects: InvitationProject[];
};

export type PendingInvitation = NewInvitation & {
  id: string;
  expiresAt: string;
};
