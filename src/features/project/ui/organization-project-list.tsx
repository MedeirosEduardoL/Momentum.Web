import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { isOrganizationAdministrator, useGetCurrentOrganization } from "@/features/organization";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { QueryContent } from "@/shared/ui/query-content";
import { Section } from "@/shared/ui/section";
import { useListProjects } from "../api/project.queries";
import type { Project } from "../model/types/project.types";
import { CreateProjectForm } from "./create-project-form";
import { EmptyProjectList } from "./empty-project-list";
import { ProjectListItem } from "./project-list-item";

type OrganizationProjectListProps = {
  renderNameLink: (project: Project) => ReactNode;
  renderActions: (project: Project) => ReactNode;
  renderNextStep: (project: Project, finish: () => void) => ReactNode;
};

const DESCRIPTIONS = {
  administrator: "Todos os projetos da organização. Abra o time de um projeto para cuidar dele.",
  member: "Os projetos em que você está no time.",
};

export function OrganizationProjectList({
  renderNameLink,
  renderActions,
  renderNextStep,
}: OrganizationProjectListProps) {
  const projects = useListProjects();
  const organization = useGetCurrentOrganization();
  const [isCreating, setIsCreating] = useState(false);
  const [createdProject, setCreatedProject] = useState<Project | null>(null);
  const canCreate = isOrganizationAdministrator(organization.data);

  function showNextStep(project: Project) {
    setIsCreating(false);
    setCreatedProject(project);
  }

  return (
    <Section
      title="Projetos"
      description={canCreate ? DESCRIPTIONS.administrator : DESCRIPTIONS.member}
      action={
        canCreate && (
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus aria-hidden />
            Novo projeto
          </Button>
        )
      }
    >
      <QueryContent
        query={projects}
        loadingLabel="Carregando os projetos…"
        errorTitle="Não foi possível carregar os projetos"
      >
        {list =>
          list.length === 0 ? (
            <EmptyProjectList />
          ) : (
            <ul className="flex flex-col divide-y divide-line panel">
              {list.map(project => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  nameLink={renderNameLink(project)}
                  action={renderActions(project)}
                />
              ))}
            </ul>
          )
        }
      </QueryContent>
      <Modal
        open={isCreating}
        onOpenChange={setIsCreating}
        title="Novo projeto"
        description="Você entra no time como administrador do projeto. A chave do projeto não muda depois de criada."
      >
        <CreateProjectForm onCreated={showNextStep} />
      </Modal>
      {createdProject && renderNextStep(createdProject, () => setCreatedProject(null))}
    </Section>
  );
}
