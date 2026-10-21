import type { ReactNode } from "react";
import { MarkdownSection } from "@/shared/ui/markdown-section";
import { QueryContent } from "@/shared/ui/query-content";
import { Screen } from "@/shared/ui/screen";
import { useGetFeature } from "../api/feature.queries";
import type { Feature, FeatureSummary } from "../model/types/feature.types";
import { FeatureProperties } from "./feature-properties";

type FeatureDetailLinks = {
  editLink: ReactNode;
  renderBackLink: (projectId: string) => ReactNode;
  renderCardsLink: (feature: FeatureSummary) => ReactNode;
};

type FeatureDetailProps = FeatureDetailLinks & {
  featureId: string;
};

type FeatureScreenProps = FeatureDetailLinks & {
  feature: Feature;
};

function FeatureScreen({ feature, editLink, renderBackLink, renderCardsLink }: FeatureScreenProps) {
  return (
    <Screen
      backLink={renderBackLink(feature.projectId)}
      eyebrow={<p className="text-sm text-ink-muted">Feature</p>}
      title={feature.title}
      action={editLink}
    >
      <FeatureProperties feature={feature} cardsLink={renderCardsLink(feature)} />
      <MarkdownSection title="Descrição" content={feature.description} emptyText="Sem descrição." />
    </Screen>
  );
}

export function FeatureDetail({ featureId, ...links }: FeatureDetailProps) {
  const feature = useGetFeature(featureId);

  return (
    <QueryContent
      query={feature}
      loadingLabel="Carregando a feature…"
      errorTitle="Não foi possível carregar a feature"
    >
      {loadedFeature => <FeatureScreen feature={loadedFeature} {...links} />}
    </QueryContent>
  );
}
