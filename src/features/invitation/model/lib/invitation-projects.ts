import { PROJECT_ROLE_LABELS, type Project } from "@/features/project";
import { NOT_IN_TEAM, type InvitationFormValues } from "../schemas/invitation.schema";
import type { InvitationProject } from "../types/invitation.types";

const NO_PROJECT = "Sem projeto";

export function toDefaultProjectRoles(projects: Project[]): InvitationFormValues["projectRoles"] {
  return Object.fromEntries(projects.map(project => [project.id, NOT_IN_TEAM]));
}

export function toInvitationProjects(
  projectRoles: InvitationFormValues["projectRoles"]
): InvitationProject[] {
  return Object.entries(projectRoles).flatMap(([projectId, choice]) =>
    choice === NOT_IN_TEAM ? [] : [{ projectId, role: choice }]
  );
}

export function describeInvitationProjects(invited: InvitationProject[], projects: Project[]) {
  const namesById = new Map(projects.map(project => [project.id, project.name]));
  const descriptions = invited.flatMap(({ projectId, role }) => {
    const name = namesById.get(projectId);

    return name ? [`${name} (${PROJECT_ROLE_LABELS[role]})`] : [];
  });

  return descriptions.join(", ") || NO_PROJECT;
}
