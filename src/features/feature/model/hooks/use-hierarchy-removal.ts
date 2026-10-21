import { toast } from "sonner";
import { toastApiError } from "@/shared/api/toast-api-error";
import { useDeleteEpicMutation, useDeleteFeatureMutation } from "../../api/feature.mutations";
import type { EpicSummary, FeatureSummary } from "../types/feature.types";

async function announce(removal: Promise<unknown>, successMessage: string) {
  try {
    await removal;
    toast.success(successMessage);
  } catch (error) {
    toastApiError(error);
  }
}

export function useHierarchyRemoval() {
  const featureRemoval = useDeleteFeatureMutation();
  const epicRemoval = useDeleteEpicMutation();

  return {
    removeFeature: (feature: FeatureSummary) =>
      announce(featureRemoval.mutateAsync(feature.id), `A feature ${feature.title} foi excluída.`),
    removeEpic: (epic: EpicSummary) =>
      announce(epicRemoval.mutateAsync(epic.id), `O epic ${epic.title} foi excluído.`),
  };
}
