import type { ReactNode } from "react";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { describeFeature } from "../model/lib/group-description";
import type { FeatureSummary } from "../model/types/feature.types";

export type FeatureLinks = {
  renderFeatureLink: (feature: FeatureSummary) => ReactNode;
  renderCardsLink: (feature: FeatureSummary) => ReactNode;
};

type FeatureListProps = FeatureLinks & {
  features: FeatureSummary[];
  emptyText: string;
  onRemove: (feature: FeatureSummary) => Promise<void>;
};

export function FeatureList({
  features,
  emptyText,
  onRemove,
  renderFeatureLink,
  renderCardsLink,
}: FeatureListProps) {
  if (features.length === 0) {
    return <p className="text-ink-subtle">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-line panel">
      {features.map(feature => (
        <li key={feature.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{renderFeatureLink(feature)}</span>
            <span className="truncate text-sm text-ink-muted">{describeFeature(feature)}</span>
          </div>
          <span className="text-sm">{renderCardsLink(feature)}</span>
          <ConfirmButton
            title={`Excluir a feature ${feature.title}?`}
            description="Os cards da feature não são excluídos: ficam sem feature."
            confirmLabel="Excluir feature"
            onConfirm={() => onRemove(feature)}
          >
            Excluir
          </ConfirmButton>
        </li>
      ))}
    </ul>
  );
}
