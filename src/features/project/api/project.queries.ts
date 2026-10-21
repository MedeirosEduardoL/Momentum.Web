import { useQuery } from "@tanstack/react-query";
import { projectKeys } from "./project-api-keys";
import { listProjectMembers, listProjects } from "./project.service";

type ListProjectsOptions = {
  enabled?: boolean;
};

export function useListProjects({ enabled = true }: ListProjectsOptions = {}) {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: listProjects,
    enabled,
  });
}

export function useListProjectMembers(projectId: string) {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: () => listProjectMembers(projectId),
  });
}
