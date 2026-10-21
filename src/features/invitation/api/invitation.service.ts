import { api } from "@/shared/api/client";
import { fillPath } from "@/shared/api/fill-path";
import type { components, paths } from "@/shared/api/generated/openapi";
import type {
  InvitationAcceptance,
  InvitationPreview,
  InvitationProject,
  NewInvitation,
  PendingInvitation,
} from "../model/types/invitation.types";

type Schemas = components["schemas"];

const INVITATIONS_PATH = "/api/v1/invitations" satisfies keyof paths;
const INVITATION_PREVIEWS_PATH = "/api/v1/invitation-previews" satisfies keyof paths;
const INVITATION_ACCEPTANCES_PATH = "/api/v1/invitation-acceptances" satisfies keyof paths;

function toInvitationPreview(dto: Schemas["InvitationPreviewResponseDto"]): InvitationPreview {
  return {
    organizationName: dto.organization_name,
    email: dto.email,
    accountExists: dto.account_exists,
  };
}

function toInvitationProject(dto: Schemas["InvitationProjectResponseDto"]): InvitationProject {
  return { projectId: dto.project_id, role: dto.role };
}

function toPendingInvitation(dto: Schemas["InvitationResponseDto"]): PendingInvitation {
  return {
    id: dto.invitation_id,
    email: dto.email,
    role: dto.role,
    expiresAt: dto.expires_at,
    projects: dto.projects.map(toInvitationProject),
  };
}

function toProjectPayload(project: InvitationProject): Schemas["InvitationProjectRequestDto"] {
  return { project_id: project.projectId, role: project.role };
}

export async function previewInvitation(token: string): Promise<InvitationPreview> {
  const payload: Schemas["InvitationTokenRequestDto"] = { token };
  const response = await api.post<Schemas["InvitationPreviewResponseDto"]>(
    INVITATION_PREVIEWS_PATH,
    payload
  );

  return toInvitationPreview(response.data);
}

export async function acceptInvitation(acceptance: InvitationAcceptance): Promise<void> {
  const payload: Schemas["AcceptInvitationRequestDto"] = acceptance;

  await api.post(INVITATION_ACCEPTANCES_PATH, payload);
}

export async function listPendingInvitations(): Promise<PendingInvitation[]> {
  const response = await api.get<Schemas["InvitationResponseDto"][]>(INVITATIONS_PATH);
  return response.data.map(toPendingInvitation);
}

export async function createInvitation(invitation: NewInvitation): Promise<void> {
  const payload: Schemas["CreateInvitationRequestDto"] = {
    email: invitation.email,
    role: invitation.role,
    projects: invitation.projects.map(toProjectPayload),
  };

  await api.post(INVITATIONS_PATH, payload);
}

export async function resendInvitation(invitationId: string): Promise<void> {
  await api.post(fillPath("/api/v1/invitations/{invitationId}/deliveries", { invitationId }));
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  await api.delete(fillPath("/api/v1/invitations/{invitationId}", { invitationId }));
}
