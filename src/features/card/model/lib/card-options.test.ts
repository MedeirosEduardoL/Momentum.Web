import { describe, expect, it } from "vitest";
import type { FeatureSummary } from "@/features/feature";
import type { Project, ProjectMember } from "@/features/project";
import type { CardState, CardSummary } from "../types/card.types";
import {
  CARD_PRIORITIES,
  CARD_PRIORITY_LABELS,
  CARD_PRIORITY_OPTIONS,
  CARD_RELATION_LABELS,
  CARD_RELATION_OPTIONS,
  CARD_RELATIONS,
  CARD_TASK_STATE_LABELS,
  CARD_TASK_STATE_OPTIONS,
  CARD_TASK_STATES,
  CARD_TYPE_LABELS,
  CARD_TYPE_OPTIONS,
  CARD_TYPES,
  ISSUE_SEVERITIES,
  ISSUE_SEVERITY_LABELS,
  ISSUE_SEVERITY_OPTIONS,
  NO_ASSIGNEE_OPTION,
  NO_CARD_OPTION,
  NO_FEATURE_OPTION,
  toAssigneeOptions,
  toFeatureOptions,
  toProjectOptions,
  toRelatedCardOptions,
  toStateOptions,
} from "./card-options";

function cardSummary(id: string, identifier: string, title: string): CardSummary {
  return {
    id,
    projectId: "project-1",
    identifier,
    type: "issue",
    title,
    state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
    priority: "medium",
    assignee: null,
    featureId: null,
    progress: 0,
    taskCount: 0,
    doneTaskCount: 0,
    subitemCounts: {
      task: { total: 0, done: 0 },
      bug: { total: 0, done: 0 },
      impediment: { total: 0, done: 0 },
    },
    isArchived: false,
    updatedAt: "2026-10-13T12:00:00Z",
  };
}

describe("CARD_TASK_STATE_OPTIONS", () => {
  it("oferece os três estados fixos da task, na ordem do fluxo", () => {
    expect(CARD_TASK_STATE_OPTIONS).toEqual([
      { value: "to_do", label: "A fazer" },
      { value: "in_progress", label: "Em andamento" },
      { value: "done", label: "Concluída" },
    ]);
  });

  it("cobre todo estado de task que tem rótulo", () => {
    expect([...CARD_TASK_STATES].sort()).toEqual(Object.keys(CARD_TASK_STATE_LABELS).sort());
  });
});

describe("CARD_RELATION_OPTIONS", () => {
  it("oferece as relações com o nome lido a partir do card consultado", () => {
    expect(CARD_RELATION_OPTIONS).toEqual([
      { value: "related", label: "Relacionado a" },
      { value: "blocks", label: "Bloqueia" },
      { value: "blocked_by", label: "Bloqueado por" },
      { value: "duplicate_of", label: "Duplicado de" },
      { value: "duplicated_by", label: "Duplicado por" },
    ]);
  });

  it("cobre toda relação que tem rótulo", () => {
    expect([...CARD_RELATIONS].sort()).toEqual(Object.keys(CARD_RELATION_LABELS).sort());
  });
});

describe("toFeatureOptions", () => {
  it("oferece cada feature do projeto pelo título, na ordem recebida", () => {
    const feature: FeatureSummary = {
      id: "feature-1",
      projectId: "project-1",
      epicId: null,
      title: "Filtros da lista",
      progress: 0,
      state: "to_do",
      cardCount: 0,
    };

    expect(toFeatureOptions([feature, { ...feature, id: "feature-2", title: "Board" }])).toEqual([
      { value: "feature-1", label: "Filtros da lista" },
      { value: "feature-2", label: "Board" },
    ]);
  });
});

describe("toProjectOptions", () => {
  it("oferece cada projeto que a pessoa enxerga pelo nome", () => {
    const projects: Project[] = [
      { id: "project-1", name: "Momentum", key: "MOM", role: "administrator" },
      { id: "project-2", name: "Suporte", key: "SUP", role: "member" },
    ];

    expect(toProjectOptions(projects)).toEqual([
      { value: "project-1", label: "Momentum" },
      { value: "project-2", label: "Suporte" },
    ]);
  });
});

describe("toRelatedCardOptions", () => {
  const candidates = [
    cardSummary("card-1", "MOM-1", "Filtrar por tipo"),
    cardSummary("card-2", "MOM-2", "Lista vazia"),
  ];

  it("oferece cada card pelo identificador e pelo título", () => {
    expect(toRelatedCardOptions(candidates, "card-9")).toEqual([
      { value: "card-1", label: "MOM-1 · Filtrar por tipo" },
      { value: "card-2", label: "MOM-2 · Lista vazia" },
    ]);
  });

  it("não oferece o próprio card, que não se relaciona com ele mesmo", () => {
    expect(toRelatedCardOptions(candidates, "card-1")).toEqual([
      { value: "card-2", label: "MOM-2 · Lista vazia" },
    ]);
  });
});

describe("NO_FEATURE_OPTION e NO_CARD_OPTION", () => {
  it("são opções de valor vazio", () => {
    expect(NO_FEATURE_OPTION).toEqual({ value: "", label: "Sem feature" });
    expect(NO_CARD_OPTION).toEqual({ value: "", label: "Escolha um card" });
  });
});

describe("CARD_TYPE_OPTIONS", () => {
  it("oferece os quatro tipos de card com o rótulo do glossário", () => {
    expect(CARD_TYPE_OPTIONS).toEqual([
      { value: "user_story", label: "User story" },
      { value: "spike", label: "Spike" },
      { value: "issue", label: "Issue" },
      { value: "tech_debt", label: "Dívida técnica" },
    ]);
  });

  it("cobre todo tipo que tem rótulo", () => {
    expect([...CARD_TYPES].sort()).toEqual(Object.keys(CARD_TYPE_LABELS).sort());
  });
});

describe("CARD_PRIORITY_OPTIONS", () => {
  it("oferece as prioridades da mais alta para a mais baixa", () => {
    expect(CARD_PRIORITY_OPTIONS).toEqual([
      { value: "urgent", label: "Urgente" },
      { value: "high", label: "Alta" },
      { value: "medium", label: "Média" },
      { value: "low", label: "Baixa" },
    ]);
  });

  it("cobre toda prioridade que tem rótulo", () => {
    expect([...CARD_PRIORITIES].sort()).toEqual(Object.keys(CARD_PRIORITY_LABELS).sort());
  });
});

describe("ISSUE_SEVERITY_OPTIONS", () => {
  it("oferece as severidades da mais grave para a mais leve", () => {
    expect(ISSUE_SEVERITY_OPTIONS).toEqual([
      { value: "critical", label: "Crítica" },
      { value: "high", label: "Alta" },
      { value: "medium", label: "Média" },
      { value: "low", label: "Baixa" },
    ]);
  });

  it("cobre toda severidade que tem rótulo", () => {
    expect([...ISSUE_SEVERITIES].sort()).toEqual(Object.keys(ISSUE_SEVERITY_LABELS).sort());
  });
});

describe("toStateOptions", () => {
  it("usa o id do estado como valor e o nome como rótulo, na ordem recebida", () => {
    const states: CardState[] = [
      { id: "state-1", name: "Novo", category: "to_do", position: 1 },
      { id: "state-2", name: "Em revisão", category: "in_progress", position: 2 },
    ];

    expect(toStateOptions(states)).toEqual([
      { value: "state-1", label: "Novo" },
      { value: "state-2", label: "Em revisão" },
    ]);
  });
});

describe("toAssigneeOptions", () => {
  it("oferece cada pessoa do time pelo nome", () => {
    const team: ProjectMember[] = [
      { userId: "user-1", name: "Ana Souza", email: "ana@exemplo.test", role: "administrator" },
      { userId: "user-2", name: "Bia Lima", email: "bia@exemplo.test", role: "member" },
    ];

    expect(toAssigneeOptions(team)).toEqual([
      { value: "user-1", label: "Ana Souza" },
      { value: "user-2", label: "Bia Lima" },
    ]);
  });
});

describe("NO_ASSIGNEE_OPTION", () => {
  it("é a opção de valor vazio, com o termo do glossário", () => {
    expect(NO_ASSIGNEE_OPTION).toEqual({ value: "", label: "Sem responsável" });
  });
});
