import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrganization } from "./first-access.service";

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
