import type { ReactNode } from "react";
import { EmptyState } from "@/shared/ui/empty-state";
import { QueryContent } from "@/shared/ui/query-content";
import { useListProjects } from "../api/project.queries";
import type { Project } from "../model/types/project.types";

type ProjectContentProps = {
  projectId: string;
  children: (project: Project) => ReactNode;
};

export function ProjectContent({ projectId, children }: ProjectContentProps) {
  const projects = useListProjects();

  return (
    <QueryContent
      query={projects}
      loadingLabel="Carregando o projeto…"
      errorTitle="Não foi possível carregar o projeto"
    >
      {list => {
        const project = list.find(candidate => candidate.id === projectId);

        return project ? (
          children(project)
        ) : (
          <EmptyState
            title="Projeto não encontrado"
            description="O projeto não existe ou você não está no time dele."
          />
        );
      }}
    </QueryContent>
  );
}
