import { Plus } from "lucide-react";
import { ProjectHierarchy, type GroupsView } from "@/features/feature";
import { ButtonLink } from "@/shared/ui/button-link";
import {
  renderEpicLink,
  renderFeatureCardsLink,
  renderFeatureLink,
  renderNewEpicFeatureLink,
} from "../feature-links";

type ProjectHierarchyPageProps = {
  projectId: string;
  view: GroupsView;
  onViewChange: (view: GroupsView) => void;
};

export function ProjectHierarchyPage({ projectId, view, onViewChange }: ProjectHierarchyPageProps) {
  return (
    <ProjectHierarchy
      projectId={projectId}
      view={view}
      onViewChange={onViewChange}
      newEpicLink={
        <ButtonLink to="/projetos/$projectId/epics/novo" params={{ projectId }} size="sm">
          <Plus aria-hidden />
          Novo epic
        </ButtonLink>
      }
      newFeatureWithoutEpicLink={
        <ButtonLink
          to="/projetos/$projectId/features/nova"
          params={{ projectId }}
          variant="ghost"
          size="sm"
        >
          <Plus aria-hidden />
          Nova feature
        </ButtonLink>
      }
      renderEpicLink={renderEpicLink}
      renderNewFeatureLink={renderNewEpicFeatureLink}
      renderFeatureLink={renderFeatureLink}
      renderCardsLink={renderFeatureCardsLink}
    />
  );
}
