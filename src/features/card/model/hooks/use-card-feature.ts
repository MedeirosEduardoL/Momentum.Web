import { useListFeatures } from "@/features/feature";
import { toastApiError } from "@/shared/api/toast-api-error";
import { useSetCardFeatureMutation } from "../../api/card.mutations";
import { NO_FEATURE } from "../lib/card-options";
import { isFeatureOutsideProject } from "../lib/card-refusal";
import type { Card } from "../types/card.types";

export function useCardFeature(card: Card) {
  const features = useListFeatures(card.projectId);
  const assignment = useSetCardFeatureMutation();
  const featureId = assignment.isPending ? assignment.variables.featureId : card.featureId;

  function refuse(error: unknown) {
    toastApiError(error);

    if (isFeatureOutsideProject(error)) {
      void features.refetch();
    }
  }

  return {
    features,
    changeFeature: (chosenFeatureId: string) =>
      assignment.mutate(
        { cardId: card.id, featureId: chosenFeatureId || null },
        { onError: refuse }
      ),
    isBusy: assignment.isPending,
    selectedFeatureId: featureId ?? NO_FEATURE,
  };
}
