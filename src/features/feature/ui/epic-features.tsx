import { QueryContent } from "@/shared/ui/query-content";
import { useListFeatures } from "../api/feature.queries";
import { useHierarchyRemoval } from "../model/hooks/use-hierarchy-removal";
import { listEpicFeatures } from "../model/lib/hierarchy";
import type { EpicSummary } from "../model/types/feature.types";
import { FeatureList, type FeatureLinks } from "./feature-list";

type EpicFeaturesProps = FeatureLinks & {
  epic: EpicSummary;
};

export function EpicFeatures({ epic, ...featureLinks }: EpicFeaturesProps) {
  const features = useListFeatures(epic.projectId);
  const { removeFeature } = useHierarchyRemoval();

  return (
    <QueryContent
      query={features}
      loadingLabel="Carregando as features…"
      errorTitle="Não foi possível carregar as features"
    >
      {featureList => (
        <FeatureList
          features={listEpicFeatures(featureList, epic.id)}
          emptyText="Nenhuma feature neste epic."
          onRemove={removeFeature}
          {...featureLinks}
        />
      )}
    </QueryContent>
  );
}
