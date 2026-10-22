import type { ReactNode } from "react";
import { formatCount } from "@/shared/lib/format-count";
import { FEATURE_STATE_LABELS } from "../model/lib/group-description";
import type { EpicSummary, FeatureSummary } from "../model/types/feature.types";
import { GroupBoard } from "./group-board";
import { GroupTile } from "./group-tile";

type FeatureBoardProps = {
  features: FeatureSummary[];
  epics: EpicSummary[];
  renderFeatureLink: (feature: FeatureSummary) => ReactNode;
};

export function FeatureBoard({ features, epics, renderFeatureLink }: FeatureBoardProps) {
  const epicTitles = new Map(epics.map(epic => [epic.id, epic.title]));

  function epicOf(feature: FeatureSummary) {
    return feature.epicId ? (epicTitles.get(feature.epicId) ?? "Epic") : "Sem epic";
  }

  return (
    <GroupBoard
      label="Board de features"
      groups={features}
      stateLabels={FEATURE_STATE_LABELS}
      emptyText="Nenhuma feature aqui."
      renderTile={feature => (
        <GroupTile
          key={feature.id}
          kindLabel="Feature"
          titleLink={renderFeatureLink(feature)}
          progressLabel={`Progresso de ${feature.title}`}
          progress={feature.progress}
          details={[epicOf(feature), formatCount(feature.cardCount, "card")]}
        />
      )}
    />
  );
}
