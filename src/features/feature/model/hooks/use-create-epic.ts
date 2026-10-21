import { useCreateEpicMutation } from "../../api/feature.mutations";
import type { Epic } from "../types/feature.types";
import { useGroupForm } from "./use-group-form";

type CreateEpicOptions = {
  projectId: string;
  onCreated: (epic: Epic) => void;
};

export function useCreateEpic({ projectId, onCreated }: CreateEpicOptions) {
  const createEpic = useCreateEpicMutation();

  return useGroupForm({
    save: text => createEpic.mutateAsync({ projectId, ...text }),
    isSaving: createEpic.isPending,
    onSaved: onCreated,
  });
}
