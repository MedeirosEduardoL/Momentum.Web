import type { ReactNode } from "react";
import { useListEpics, type EpicSummary, type FeatureSummary } from "@/features/feature";
import { QueryContent } from "@/shared/ui/query-content";
import { Section } from "@/shared/ui/section";
import { SelectField } from "@/shared/ui/select-field";
import { useCardFeature } from "../model/hooks/use-card-feature";
import { findCardFeaturePlace } from "../model/lib/card-feature-place";
import { NO_FEATURE_OPTION, toFeatureOptions } from "../model/lib/card-options";
import type { Card } from "../model/types/card.types";

type CardFeatureLinks = {
  renderFeatureLink: (feature: FeatureSummary) => ReactNode;
  renderEpicLink: (epic: EpicSummary) => ReactNode;
};

type CardFeatureProps = CardFeatureLinks & {
  card: Card;
};

type CardFeaturePlaceLineProps = CardFeatureLinks & {
  features: FeatureSummary[];
  epics: EpicSummary[];
  featureId: string;
};

function CardFeaturePlaceLine({
  features,
  epics,
  featureId,
  renderFeatureLink,
  renderEpicLink,
}: CardFeaturePlaceLineProps) {
  const place = findCardFeaturePlace(features, epics, featureId);

  if (!place) {
    return null;
  }

  return (
    <p className="flex flex-wrap items-center gap-x-3 text-sm text-ink-muted">
      {renderFeatureLink(place.feature)}
      {place.epic ? <span>Epic: {renderEpicLink(place.epic)}</span> : <span>Sem epic</span>}
    </p>
  );
}

export function CardFeature({ card, ...links }: CardFeatureProps) {
  const { features, changeFeature, isBusy, selectedFeatureId } = useCardFeature(card);
  const epics = useListEpics(card.projectId);

  return (
    <Section title="Feature" description="A entrega de que este card faz parte.">
      <QueryContent
        query={features}
        loadingLabel="Carregando as features…"
        errorTitle="Não foi possível carregar as features"
      >
        {featureList => (
          <QueryContent
            query={epics}
            loadingLabel="Carregando os epics…"
            errorTitle="Não foi possível carregar os epics"
          >
            {epicList => (
              <div className="flex flex-col gap-2">
                <SelectField
                  isLabelHidden
                  label="Feature do card"
                  className="max-w-sm"
                  options={[NO_FEATURE_OPTION, ...toFeatureOptions(featureList)]}
                  value={selectedFeatureId}
                  disabled={isBusy}
                  onValueChange={changeFeature}
                />
                {featureList.length === 0 && (
                  <p className="text-sm text-ink-subtle">O projeto ainda não tem feature.</p>
                )}
                <CardFeaturePlaceLine
                  features={featureList}
                  epics={epicList}
                  featureId={selectedFeatureId}
                  {...links}
                />
              </div>
            )}
          </QueryContent>
        )}
      </QueryContent>
    </Section>
  );
}
