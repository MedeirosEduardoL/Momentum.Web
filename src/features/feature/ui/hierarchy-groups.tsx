import type { ReactNode } from "react";
import { Notice } from "@/shared/ui/notice";
import { Section } from "@/shared/ui/section";
import { useHierarchyRemoval } from "../model/hooks/use-hierarchy-removal";
import { isEmptyHierarchy } from "../model/lib/hierarchy";
import type { EpicSummary, Hierarchy } from "../model/types/feature.types";
import { EpicGroup } from "./epic-group";
import { FeatureList, type FeatureLinks } from "./feature-list";

type HierarchyGroupsProps = FeatureLinks & {
  hierarchy: Hierarchy;
  renderEpicLink: (epic: EpicSummary) => ReactNode;
  renderNewFeatureLink: (epic: EpicSummary) => ReactNode;
  newFeatureWithoutEpicLink: ReactNode;
};

export function HierarchyGroups({
  hierarchy,
  renderEpicLink,
  renderNewFeatureLink,
  newFeatureWithoutEpicLink,
  ...featureLinks
}: HierarchyGroupsProps) {
  const { removeEpic, removeFeature } = useHierarchyRemoval();

  return (
    <>
      {isEmptyHierarchy(hierarchy) && (
        <Notice>
          Este board ainda não mostra epic nem feature. Crie uma feature para agrupar os cards de
          uma entrega, e um epic para agrupar features.
        </Notice>
      )}
      {hierarchy.epics.map(({ epic, features }) => (
        <EpicGroup
          key={epic.id}
          epic={epic}
          features={features}
          titleLink={renderEpicLink(epic)}
          newFeatureLink={renderNewFeatureLink(epic)}
          onRemoveEpic={removeEpic}
          onRemoveFeature={removeFeature}
          {...featureLinks}
        />
      ))}
      <Section title="Features sem epic" action={newFeatureWithoutEpicLink}>
        <FeatureList
          features={hierarchy.featuresWithoutEpic}
          emptyText="Nenhuma feature sem epic."
          onRemove={removeFeature}
          {...featureLinks}
        />
      </Section>
    </>
  );
}
