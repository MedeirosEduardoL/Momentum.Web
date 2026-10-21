import { ProjectMemberList } from "@/features/project";
import { TextLink } from "@/shared/ui/text-link";

type ProjectTeamPageProps = {
  projectId: string;
};

export function ProjectTeamPage({ projectId }: ProjectTeamPageProps) {
  return (
    <ProjectMemberList
      projectId={projectId}
      backLink={
        <TextLink to="/organizacao/projetos" className="text-sm">
          Voltar para os projetos
        </TextLink>
      }
    />
  );
}
