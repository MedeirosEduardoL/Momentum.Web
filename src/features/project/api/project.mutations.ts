import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "./project-api-keys";
import { createProject, removeProjectMember, setProjectMember } from "./project.service";

function useRefreshProjects() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: projectKeys.all });
}

export function useCreateProjectMutation() {
  const refreshProjects = useRefreshProjects();

  return useMutation({ mutationFn: createProject, onSuccess: refreshProjects });
}

export function useSetProjectMemberMutation() {
  const refreshProjects = useRefreshProjects();

  return useMutation({ mutationFn: setProjectMember, onSettled: refreshProjects });
}

export function useRemoveProjectMemberMutation() {
  const refreshProjects = useRefreshProjects();

  return useMutation({ mutationFn: removeProjectMember, onSettled: refreshProjects });
}
