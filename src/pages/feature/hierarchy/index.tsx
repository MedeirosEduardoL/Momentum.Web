import { Plus } from "lucide-react";
import { ProjectHierarchy } from "@/features/feature";
import { ButtonLink } from "@/shared/ui/button-link";
import {
  renderEpicLink,
  renderFeatureCardsLink,
  renderFeatureLink,
  renderNewEpicFeatureLink,
} from "../feature-links";

type ProjectHierarchyPageProps = {
  projectId: string;
};

export function ProjectHierarchyPage({ projectId }: ProjectHierarchyPageProps) {
  return (
    <ProjectHierarchy
      projectId={projectId}
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
