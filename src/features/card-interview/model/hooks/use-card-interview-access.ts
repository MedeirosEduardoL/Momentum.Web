import { useGetCurrentAccount } from "@/features/account";
import type { Card } from "@/features/card";
import { useGetCurrentOrganization } from "@/features/organization";
import { canAdministerProject, useListProjects } from "@/features/project";
import type { CardInterviewAccess } from "../types/card-interview.types";

export function useCardInterviewAccess(card: Card): CardInterviewAccess {
  const account = useGetCurrentAccount();
  const organization = useGetCurrentOrganization();
  const projects = useListProjects();
  const project = projects.data?.find(candidate => candidate.id === card.projectId);

  return {
    userId: account.data?.id ?? null,
    isAiEnabled: organization.data?.isAiEnabled ?? false,
    canAdministerProject: project ? canAdministerProject(project) : false,
  };
}
