import type { ReactNode } from "react";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { Section } from "@/shared/ui/section";
import { describeEpic } from "../model/lib/group-description";
import type { EpicFeatures, EpicSummary, FeatureSummary } from "../model/types/feature.types";
import { FeatureList, type FeatureLinks } from "./feature-list";

type EpicGroupProps = FeatureLinks &
  EpicFeatures & {
    titleLink: ReactNode;
    newFeatureLink: ReactNode;
    onRemoveEpic: (epic: EpicSummary) => Promise<void>;
    onRemoveFeature: (feature: FeatureSummary) => Promise<void>;
  };

export function EpicGroup({
  epic,
  features,
  titleLink,
  newFeatureLink,
  onRemoveEpic,
  onRemoveFeature,
  ...featureLinks
}: EpicGroupProps) {
  return (
    <Section
      title={titleLink}
      description={describeEpic(epic)}
      action={
        <div className="flex shrink-0 items-center gap-1">
          {newFeatureLink}
          <ConfirmButton
            title={`Excluir o epic ${epic.title}?`}
            description="As features do epic não são excluídas: ficam sem epic."
            confirmLabel="Excluir epic"
            onConfirm={() => onRemoveEpic(epic)}
          >
            Excluir
          </ConfirmButton>
        </div>
      }
    >
      <FeatureList
        features={features}
        emptyText="Nenhuma feature neste epic."
        onRemove={onRemoveFeature}
        {...featureLinks}
      />
    </Section>
  );
}
