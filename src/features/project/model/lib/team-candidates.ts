import type { OrganizationMember } from "@/features/organization";
import type { ProjectMember } from "../types/project.types";

export function listTeamCandidates(
  organizationMembers: OrganizationMember[],
  team: ProjectMember[]
) {
  const teamUserIds = new Set(team.map(member => member.userId));

  return organizationMembers.filter(member => !teamUserIds.has(member.userId));
}
