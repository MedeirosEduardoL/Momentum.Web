import type { ReactNode } from "react";
import { getApiErrorMessage } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { LoadingState } from "@/shared/ui/loading-state";
import { Screen } from "@/shared/ui/screen";
import { useListProjects } from "../api/project.queries";
import type { Project } from "../model/types/project.types";
import { EmptyProjectList } from "./empty-project-list";
import { ProjectTile } from "./project-tile";

type ProjectListProps = {
  renderNameLink: (project: Project) => ReactNode;
  renderAction: (project: Project) => ReactNode;
};

export function ProjectList({ renderNameLink, renderAction }: ProjectListProps) {
  const projects = useListProjects();

  if (projects.data?.length === 0) {
    return <EmptyProjectList />;
  }

  if (projects.data) {
    return (
      <Screen title="Projetos" isWide>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.data.map(project => (
            <ProjectTile
              key={project.id}
              project={project}
              nameLink={renderNameLink(project)}
              action={renderAction(project)}
            />
          ))}
        </ul>
      </Screen>
    );
  }

  if (projects.isPending) {
    return <LoadingState label="Carregando os projetos…" />;
  }

  return (
    <EmptyState
      title="Não foi possível carregar os projetos"
      description={getApiErrorMessage(projects.error)}
      action={
        <Button variant="secondary" onClick={() => projects.refetch()}>
          Tentar de novo
        </Button>
      }
    />
  );
}
