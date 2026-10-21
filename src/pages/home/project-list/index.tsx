import { lazy, Suspense } from "react";
import { ProjectList, type Project } from "@/features/project";
import { TextLink } from "@/shared/ui/text-link";

const FirstBoardDialog = lazy(() =>
  import("@/features/board").then(module => ({ default: module.FirstBoardDialog }))
);

type ProjectListPageProps = {
  firstBoardProject: Project | null;
  onFirstBoardFinished: () => void;
};

export function ProjectListPage({ firstBoardProject, onFirstBoardFinished }: ProjectListPageProps) {
  return (
    <>
      <ProjectList
        renderNameLink={project => (
          <TextLink
            to="/projetos/$projectId/boards"
            params={{ projectId: project.id }}
            className="text-ink"
          >
            {project.name}
          </TextLink>
        )}
        renderAction={project => (
          <>
            <TextLink
              to="/projetos/$projectId/boards"
              params={{ projectId: project.id }}
              className="text-sm"
              aria-label={`Boards de ${project.name}`}
            >
              Boards
            </TextLink>
            <TextLink
              to="/projetos/$projectId/features"
              params={{ projectId: project.id }}
              className="text-sm"
              aria-label={`Epics e features de ${project.name}`}
            >
              Epics e features
            </TextLink>
            <TextLink
              to="/projetos/$projectId/cards"
              params={{ projectId: project.id }}
              className="text-sm"
              aria-label={`Cards de ${project.name}`}
            >
              Cards
            </TextLink>
          </>
        )}
      />
      {firstBoardProject && (
        <Suspense>
          <FirstBoardDialog project={firstBoardProject} onFinished={onFirstBoardFinished} />
        </Suspense>
      )}
    </>
  );
}
