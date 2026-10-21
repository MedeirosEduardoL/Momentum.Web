import { formatCount } from "@/shared/lib/format-count";
import type { EpicSummary, FeatureState, FeatureSummary } from "../types/feature.types";

const SEPARATOR = " · ";

export const FEATURE_STATE_LABELS: Record<FeatureState, string> = {
  to_do: "A fazer",
  in_progress: "Em andamento",
  done: "Concluída",
};

export const EPIC_STATE_LABELS: Record<FeatureState, string> = {
  to_do: "A fazer",
  in_progress: "Em andamento",
  done: "Concluído",
};

export function describeFeature({ state, progress, cardCount }: FeatureSummary) {
  return [
    FEATURE_STATE_LABELS[state],
    `Progresso de ${progress}%`,
    formatCount(cardCount, "card"),
  ].join(SEPARATOR);
}

export function describeEpic({ state, progress, featureCount, cardCount }: EpicSummary) {
  return [
    EPIC_STATE_LABELS[state],
    `Progresso de ${progress}%`,
    formatCount(featureCount, "feature"),
    formatCount(cardCount, "card"),
  ].join(SEPARATOR);
}
