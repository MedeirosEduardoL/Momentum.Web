import type { EpicSummary, FeatureSummary, Hierarchy } from "../types/feature.types";

export function listEpicFeatures(features: FeatureSummary[], epicId: string) {
  return features.filter(feature => feature.epicId === epicId);
}

export function toHierarchy(epics: EpicSummary[], features: FeatureSummary[]): Hierarchy {
  const listedEpicIds = new Set(epics.map(epic => epic.id));
  const isOutsideEveryEpic = ({ epicId }: FeatureSummary) =>
    epicId === null || !listedEpicIds.has(epicId);

  return {
    epics: epics.map(epic => ({ epic, features: listEpicFeatures(features, epic.id) })),
    featuresWithoutEpic: features.filter(isOutsideEveryEpic),
  };
}

export function isEmptyHierarchy({ epics, featuresWithoutEpic }: Hierarchy) {
  return epics.length === 0 && featuresWithoutEpic.length === 0;
}
