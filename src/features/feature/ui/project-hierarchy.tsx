import type { ReactNode } from "react";
import { ProjectContent, type Project } from "@/features/project";
import { QueryContent } from "@/shared/ui/query-content";
import { Screen } from "@/shared/ui/screen";
import { useListEpics, useListFeatures } from "../api/feature.queries";
import { toHierarchy } from "../model/lib/hierarchy";
import type { EpicSummary } from "../model/types/feature.types";
import type { FeatureLinks } from "./feature-list";
import { HierarchyGroups } from "./hierarchy-groups";

type HierarchyLinks = FeatureLinks & {
  newEpicLink: ReactNode;
  newFeatureWithoutEpicLink: ReactNode;
  renderEpicLink: (epic: EpicSummary) => ReactNode;
  renderNewFeatureLink: (epic: EpicSummary) => ReactNode;
};

type ProjectHierarchyProps = HierarchyLinks & {
  projectId: string;
};

type HierarchyScreenProps = HierarchyLinks & {
  project: Project;
};

function HierarchyScreen({ project, newEpicLink, ...links }: HierarchyScreenProps) {
  const epics = useListEpics(project.id);
  const features = useListFeatures(project.id);

  return (
    <Screen isWide title={`Epics e features de ${project.name}`} action={newEpicLink}>
      <QueryContent
        query={epics}
        loadingLabel="Carregando os epics…"
        errorTitle="Não foi possível carregar os epics"
      >
        {epicList => (
          <QueryContent
            query={features}
            loadingLabel="Carregando as features…"
            errorTitle="Não foi possível carregar as features"
          >
            {featureList => (
              <HierarchyGroups hierarchy={toHierarchy(epicList, featureList)} {...links} />
            )}
          </QueryContent>
        )}
      </QueryContent>
    </Screen>
  );
}

export function ProjectHierarchy({ projectId, ...links }: ProjectHierarchyProps) {
  return (
    <ProjectContent projectId={projectId}>
      {project => <HierarchyScreen project={project} {...links} />}
    </ProjectContent>
  );
}
