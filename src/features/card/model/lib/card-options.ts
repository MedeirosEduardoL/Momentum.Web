import type { FeatureSummary } from "@/features/feature";
import type { Project, ProjectMember } from "@/features/project";
import type { SelectOption } from "@/shared/ui/select-field";
import type {
  CardPriority,
  CardRelationKind,
  CardState,
  CardStateCategory,
  CardSummary,
  CardTaskKind,
  CardTaskState,
  CardType,
  IssueSeverity,
} from "../types/card.types";

export const NO_ASSIGNEE = "";
export const NO_FEATURE = "";
export const NO_CARD = "";

export const NO_ASSIGNEE_OPTION: SelectOption = { value: NO_ASSIGNEE, label: "Sem responsável" };
export const NO_FEATURE_OPTION: SelectOption = { value: NO_FEATURE, label: "Sem feature" };
export const NO_CARD_OPTION: SelectOption = { value: NO_CARD, label: "Escolha um card" };

export const CARD_TYPES = [
  "user_story",
  "spike",
  "issue",
  "tech_debt",
] as const satisfies readonly CardType[];

export const CARD_PRIORITIES = [
  "urgent",
  "high",
  "medium",
  "low",
] as const satisfies readonly CardPriority[];

export const ISSUE_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
] as const satisfies readonly IssueSeverity[];

export const CARD_TASK_KINDS = [
  "task",
  "bug",
  "impediment",
] as const satisfies readonly CardTaskKind[];

export const CARD_TASK_STATES = [
  "to_do",
  "in_progress",
  "done",
] as const satisfies readonly CardTaskState[];

export const CARD_STATE_CATEGORIES = [
  "to_do",
  "in_progress",
  "done",
  "cancelled",
] as const satisfies readonly CardStateCategory[];

export const CARD_RELATIONS = [
  "related",
  "blocks",
  "blocked_by",
  "duplicate_of",
  "duplicated_by",
] as const satisfies readonly CardRelationKind[];

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  user_story: "User story",
  spike: "Spike",
  issue: "Issue",
  tech_debt: "Dívida técnica",
};

export const CARD_PRIORITY_LABELS: Record<CardPriority, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export const ISSUE_SEVERITY_LABELS: Record<IssueSeverity, string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export const CARD_TASK_KIND_LABELS: Record<CardTaskKind, string> = {
  task: "Task",
  bug: "Bug",
  impediment: "Impedimento",
};

export const CARD_TASK_KIND_PLURAL_LABELS: Record<CardTaskKind, string> = {
  task: "Tasks",
  bug: "Bugs",
  impediment: "Impedimentos",
};

export const CARD_TASK_NEW_LABELS: Record<CardTaskKind, string> = {
  task: "Nova task",
  bug: "Novo bug",
  impediment: "Novo impedimento",
};

export const CARD_TASK_DESCRIPTION_LABELS: Record<CardTaskKind, string> = {
  task: "Descrição",
  bug: "Passos para reproduzir",
  impediment: "O que está travando",
};

export const CARD_TASK_STATE_LABELS: Record<CardTaskState, string> = {
  to_do: "A fazer",
  in_progress: "Em andamento",
  done: "Concluída",
};

export const CARD_STATE_CATEGORY_LABELS: Record<CardStateCategory, string> = {
  to_do: "A fazer",
  in_progress: "Em andamento",
  done: "Concluído",
  cancelled: "Cancelado",
};

export const CARD_RELATION_LABELS: Record<CardRelationKind, string> = {
  related: "Relacionado a",
  blocks: "Bloqueia",
  blocked_by: "Bloqueado por",
  duplicate_of: "Duplicado de",
  duplicated_by: "Duplicado por",
};

function toOptions<TValue extends string>(
  values: readonly TValue[],
  labels: Record<TValue, string>
): SelectOption<TValue>[] {
  return values.map(value => ({ value, label: labels[value] }));
}

export const CARD_TYPE_OPTIONS = toOptions(CARD_TYPES, CARD_TYPE_LABELS);
export const CARD_PRIORITY_OPTIONS = toOptions(CARD_PRIORITIES, CARD_PRIORITY_LABELS);
export const ISSUE_SEVERITY_OPTIONS = toOptions(ISSUE_SEVERITIES, ISSUE_SEVERITY_LABELS);
export const CARD_TASK_STATE_OPTIONS = toOptions(CARD_TASK_STATES, CARD_TASK_STATE_LABELS);
export const CARD_TASK_KIND_OPTIONS = toOptions(CARD_TASK_KINDS, CARD_TASK_KIND_LABELS);
export const CARD_RELATION_OPTIONS = toOptions(CARD_RELATIONS, CARD_RELATION_LABELS);
export const CARD_STATE_CATEGORY_OPTIONS = toOptions(
  CARD_STATE_CATEGORIES,
  CARD_STATE_CATEGORY_LABELS
);

export function toStateOptions(states: CardState[]): SelectOption[] {
  return states.map(state => ({ value: state.id, label: state.name }));
}

export function toAssigneeOptions(team: ProjectMember[]): SelectOption[] {
  return team.map(member => ({ value: member.userId, label: member.name }));
}

export function toFeatureOptions(features: FeatureSummary[]): SelectOption[] {
  return features.map(feature => ({ value: feature.id, label: feature.title }));
}

export function toProjectOptions(projects: Project[]): SelectOption[] {
  return projects.map(project => ({ value: project.id, label: project.name }));
}

export function toRelatedCardOptions(candidates: CardSummary[], cardId: string): SelectOption[] {
  return candidates
    .filter(candidate => candidate.id !== cardId)
    .map(candidate => ({
      value: candidate.id,
      label: `${candidate.identifier} · ${candidate.title}`,
    }));
}
