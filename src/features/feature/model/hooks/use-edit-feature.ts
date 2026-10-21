import { useUpdateFeatureMutation } from "../../api/feature.mutations";
import type { Feature } from "../types/feature.types";
import { useGroupForm } from "./use-group-form";

type EditFeatureOptions = {
  feature: Feature;
  onSaved: () => void;
};

export function useEditFeature({ feature, onSaved }: EditFeatureOptions) {
  const updateFeature = useUpdateFeatureMutation();

  return useGroupForm({
    text: feature,
    save: text => updateFeature.mutateAsync({ featureId: feature.id, ...text }),
    isSaving: updateFeature.isPending,
    onSaved,
  });
}
