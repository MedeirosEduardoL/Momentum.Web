import { useCreateFeatureMutation } from "../../api/feature.mutations";
import type { Feature } from "../types/feature.types";
import { useGroupForm } from "./use-group-form";

type CreateFeatureOptions = {
  projectId: string;
  epicId: string | null;
  onCreated: (feature: Feature) => void;
};

export function useCreateFeature({ projectId, epicId, onCreated }: CreateFeatureOptions) {
  const createFeature = useCreateFeatureMutation();

  return useGroupForm({
    save: text => createFeature.mutateAsync({ projectId, epicId, ...text }),
    isSaving: createFeature.isPending,
    onSaved: onCreated,
  });
}
