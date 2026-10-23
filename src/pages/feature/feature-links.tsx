import { TextLink } from "@/shared/ui/text-link";
import { ValueReporter } from "@/shared/ui/value-reporter";

export function renderHierarchyLink(projectId: string) {
  return (
    <TextLink
      to="/projetos/$projectId/boards"
      params={{ projectId }}
      search={{ nivel: "features" }}
    >
      Voltar para o board
    </TextLink>
  );
}

export function reportingHierarchyLink(onProjectChange: (projectId: string) => void) {
  return (projectId: string) => (
    <>
      <ValueReporter value={projectId} onReport={onProjectChange} />
      {renderHierarchyLink(projectId)}
    </>
  );
}

export function renderEpicBackLink(epicId: string) {
  return (
    <TextLink to="/epics/$epicId" params={{ epicId }}>
      Voltar para o epic
    </TextLink>
  );
}
