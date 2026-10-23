import { Plus } from "lucide-react";
import type { EpicSummary, FeatureSummary } from "@/features/feature";
import { ButtonLink } from "@/shared/ui/button-link";
import { TextLink } from "@/shared/ui/text-link";

export function renderNewEpicLink(projectId: string) {
  return (
    <ButtonLink to="/projetos/$projectId/epics/novo" params={{ projectId }} size="sm">
      <Plus aria-hidden />
      Novo epic
    </ButtonLink>
  );
}

export function renderNewFeatureLink(projectId: string) {
  return (
    <ButtonLink
      to="/projetos/$projectId/features/nova"
      params={{ projectId }}
      variant="ghost"
      size="sm"
    >
      <Plus aria-hidden />
      Nova feature
    </ButtonLink>
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
      to="/projetos/$projectId/boards"
      params={{ projectId: feature.projectId }}
      search={{ exibir: "lista", feature: feature.id }}
      aria-label={`Cards de ${feature.title}`}
    >
      Cards
    </TextLink>
  );
}
