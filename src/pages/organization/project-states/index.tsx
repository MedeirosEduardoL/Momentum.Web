import { CardStateSettings } from "@/features/card";
import { canAdministerProject, ProjectContent } from "@/features/project";
import { TextLink } from "@/shared/ui/text-link";

type ProjectStatesPageProps = {
  projectId: string;
};

export function ProjectStatesPage({ projectId }: ProjectStatesPageProps) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <TextLink to="/organizacao/projetos" className="text-sm">
          Voltar para os projetos
        </TextLink>
      </div>
      <ProjectContent projectId={projectId}>
        {project => (
          <CardStateSettings
            projectId={project.id}
            projectName={project.name}
            canAdminister={canAdministerProject(project)}
          />
        )}
      </ProjectContent>
    </div>
  );
}
