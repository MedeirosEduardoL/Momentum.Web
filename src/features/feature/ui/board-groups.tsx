import type { ReactNode } from "react";
import { QueryContent } from "@/shared/ui/query-content";
import { useListBoardEpics, useListBoardFeatures } from "../api/feature.queries";
import { toHierarchy } from "../model/lib/hierarchy";
import type { EpicSummary, FeatureSummary } from "../model/types/feature.types";
import type { FeatureLinks } from "./feature-list";
import { EpicBoard } from "./epic-board";
import { FeatureBoard } from "./feature-board";
import { HierarchyGroups } from "./hierarchy-groups";

export type GroupLevel = "features" | "epics";

type GroupLinks = FeatureLinks & {
  newEpicLink: ReactNode;
  newFeatureWithoutEpicLink: ReactNode;
  renderEpicLink: (epic: EpicSummary) => ReactNode;
  renderNewFeatureLink: (epic: EpicSummary) => ReactNode;
};

type BoardGroupsProps = GroupLinks & {
  boardId: string;
  level: GroupLevel;
  isList: boolean;
};

type GroupsContentProps = Omit<GroupLinks, "newEpicLink"> & {
  level: GroupLevel;
  isList: boolean;
  epics: EpicSummary[];
  features: FeatureSummary[];
};

function GroupsContent({ level, isList, epics, features, ...links }: GroupsContentProps) {
  if (isList) {
    return <HierarchyGroups hierarchy={toHierarchy(epics, features)} {...links} />;
  }

  return level === "features" ? (
    <FeatureBoard features={features} epics={epics} renderFeatureLink={links.renderFeatureLink} />
  ) : (
    <EpicBoard epics={epics} renderEpicLink={links.renderEpicLink} />
  );
}

export function BoardGroups({ boardId, level, isList, newEpicLink, ...links }: BoardGroupsProps) {
  const epics = useListBoardEpics(boardId);
  const features = useListBoardFeatures(boardId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        {links.newFeatureWithoutEpicLink}
        {newEpicLink}
      </div>
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
              <GroupsContent
                level={level}
                isList={isList}
                epics={epicList}
                features={featureList}
                {...links}
              />
            )}
          </QueryContent>
        )}
      </QueryContent>
    </div>
  );
}
