import { ListTree, SquareKanban } from "lucide-react";
import type { ReactNode } from "react";
import { ProjectContent, type Project } from "@/features/project";
import { QueryContent } from "@/shared/ui/query-content";
import { Screen } from "@/shared/ui/screen";
import { Tabs } from "@/shared/ui/tabs";
import { useListEpics, useListFeatures } from "../api/feature.queries";
import { toHierarchy } from "../model/lib/hierarchy";
import type { EpicSummary } from "../model/types/feature.types";
import type { FeatureLinks } from "./feature-list";
import { EpicBoard } from "./epic-board";
import { FeatureBoard } from "./feature-board";
import { HierarchyGroups } from "./hierarchy-groups";

export type GroupsView = "features" | "epics" | "hierarquia";

type HierarchyLinks = FeatureLinks & {
  newEpicLink: ReactNode;
  newFeatureWithoutEpicLink: ReactNode;
  renderEpicLink: (epic: EpicSummary) => ReactNode;
  renderNewFeatureLink: (epic: EpicSummary) => ReactNode;
};

type GroupsViewProps = {
  view: GroupsView;
  onViewChange: (view: GroupsView) => void;
};

type ProjectHierarchyProps = HierarchyLinks &
  GroupsViewProps & {
    projectId: string;
  };

type HierarchyScreenProps = HierarchyLinks &
  GroupsViewProps & {
    project: Project;
  };

function HierarchyScreen({
  project,
  view,
  onViewChange,
  newEpicLink,
  ...links
}: HierarchyScreenProps) {
  const epics = useListEpics(project.id);
  const features = useListFeatures(project.id);

  return (
    <Screen
      isWide
      title={`Features e epics de ${project.name}`}
      action={
        <div className="flex items-center gap-2">
          {links.newFeatureWithoutEpicLink}
          {newEpicLink}
        </div>
      }
    >
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
              <Tabs
                label="Visões de features e epics"
                value={view}
                onValueChange={onViewChange}
                tabs={[
                  {
                    value: "features",
                    label: "Board de features",
                    icon: <SquareKanban aria-hidden />,
                    content: (
                      <FeatureBoard
                        features={featureList}
                        epics={epicList}
                        renderFeatureLink={links.renderFeatureLink}
                      />
                    ),
                  },
                  {
                    value: "epics",
                    label: "Board de epics",
                    icon: <SquareKanban aria-hidden />,
                    content: <EpicBoard epics={epicList} renderEpicLink={links.renderEpicLink} />,
                  },
                  {
                    value: "hierarquia",
                    label: "Hierarquia",
                    icon: <ListTree aria-hidden />,
                    content: (
                      <HierarchyGroups hierarchy={toHierarchy(epicList, featureList)} {...links} />
                    ),
                  },
                ]}
              />
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
