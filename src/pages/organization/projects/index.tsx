import { FirstBoardDialog } from "@/features/board";
import { canAdministerProject, OrganizationProjectList } from "@/features/project";
import { TextLink } from "@/shared/ui/text-link";

export function OrganizationProjectsPage() {
  return (
    <OrganizationProjectList
      renderNameLink={project => (
        <TextLink
          to="/projetos/$projectId/boards"
          params={{ projectId: project.id }}
          className="text-ink"
        >
          {project.name}
        </TextLink>
      )}
      renderActions={project => (
        <span className="flex items-center gap-3">
          <TextLink
            to="/organizacao/projetos/$projectId/time"
            params={{ projectId: project.id }}
            className="text-sm"
            aria-label={`Time de ${project.name}`}
          >
            Time
          </TextLink>
          {canAdministerProject(project) && (
            <TextLink
              to="/organizacao/projetos/$projectId/estados"
              params={{ projectId: project.id }}
              className="text-sm"
              aria-label={`Estados de ${project.name}`}
            >
              Estados
            </TextLink>
          )}
        </span>
      )}
      renderNextStep={(project, finish) => (
        <FirstBoardDialog project={project} onFinished={finish} />
      )}
    />
  );
}
