import { toastApiError } from "@/shared/api/toast-api-error";
import { useSetFeatureEpicMutation } from "../../api/feature.mutations";
import { NO_EPIC } from "../lib/epic-options";
import type { FeatureSummary } from "../types/feature.types";

export function useFeatureEpic(feature: FeatureSummary) {
  const assignment = useSetFeatureEpicMutation();
  const epicId = assignment.isPending ? assignment.variables.epicId : feature.epicId;

  return {
    changeEpic: (chosenEpicId: string) =>
      assignment.mutate(
        { featureId: feature.id, epicId: chosenEpicId || null },
        { onError: toastApiError }
      ),
    isBusy: assignment.isPending,
    selectedEpicId: epicId ?? NO_EPIC,
  };
}
