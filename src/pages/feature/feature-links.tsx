import { Plus } from "lucide-react";
import type { EpicSummary, FeatureSummary } from "@/features/feature";
import { ButtonLink } from "@/shared/ui/button-link";
import { TextLink } from "@/shared/ui/text-link";
import { ValueReporter } from "@/shared/ui/value-reporter";

export function renderHierarchyLink(projectId: string) {
  return (
    <TextLink to="/projetos/$projectId/features" params={{ projectId }}>
      Voltar para features e epics
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

export function renderEpicLink(epic: EpicSummary) {
  return (
    <TextLink to="/epics/$epicId" params={{ epicId: epic.id }} className="font-semibold text-ink">
      {epic.title}
    </TextLink>
  );
}

export function renderNewEpicFeatureLink(epic: EpicSummary) {
  return (
    <ButtonLink
      to="/epics/$epicId/features/nova"
      params={{ epicId: epic.id }}
      variant="ghost"
      size="sm"
      aria-label={`Nova feature em ${epic.title}`}
    >
      <Plus aria-hidden />
      Nova feature
    </ButtonLink>
  );
}

export function renderFeatureLink(feature: FeatureSummary) {
  return (
    <TextLink to="/features/$featureId" params={{ featureId: feature.id }} className="text-ink">
      {feature.title}
    </TextLink>
  );
}

export function renderFeatureCardsLink(feature: FeatureSummary) {
  return (
    <TextLink
      to="/projetos/$projectId/cards"
      params={{ projectId: feature.projectId }}
      search={{ feature: feature.id }}
      aria-label={`Cards de ${feature.title}`}
    >
      Cards
    </TextLink>
  );
}
