import type { EpicSummary, FeatureSummary } from "@/features/feature";

export type CardFeaturePlace = {
  feature: FeatureSummary;
  epic: EpicSummary | null;
};

export function findCardFeaturePlace(
  features: FeatureSummary[],
  epics: EpicSummary[],
  featureId: string
): CardFeaturePlace | null {
  const feature = features.find(candidate => candidate.id === featureId);

  if (!feature) {
    return null;
  }

  return { feature, epic: epics.find(candidate => candidate.id === feature.epicId) ?? null };
}
