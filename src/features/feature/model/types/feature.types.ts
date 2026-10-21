import type { components } from "@/shared/api/generated/openapi";

export type FeatureState = components["schemas"]["FeatureState"];

export type FeatureSummary = {
  id: string;
  projectId: string;
  epicId: string | null;
  title: string;
  progress: number;
  state: FeatureState;
  cardCount: number;
};

export type Feature = FeatureSummary & {
  description: string;
};

export type EpicSummary = {
  id: string;
  projectId: string;
  title: string;
  progress: number;
  state: FeatureState;
  featureCount: number;
  cardCount: number;
};

export type Epic = EpicSummary & {
  description: string;
};

export type GroupText = {
  title: string;
  description: string;
};

export type NewFeature = GroupText & {
  projectId: string;
  epicId: string | null;
};

export type FeatureUpdate = GroupText & {
  featureId: string;
};

export type FeatureEpicAssignment = {
  featureId: string;
  epicId: string | null;
};

export type NewEpic = GroupText & {
  projectId: string;
};

export type EpicUpdate = GroupText & {
  epicId: string;
};

export type EpicFeatures = {
  epic: EpicSummary;
  features: FeatureSummary[];
};

export type Hierarchy = {
  epics: EpicFeatures[];
  featuresWithoutEpic: FeatureSummary[];
};
