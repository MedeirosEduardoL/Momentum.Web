import { describe, expect, it } from "vitest";
import type { CardFormValues } from "../schemas/card.schema";
import type { Card, CardState, CardTypeFields, SavedCardFilter } from "../types/card.types";
import {
  toCardChanges,
  toCardFormValues,
  toCardTypeFields,
  toNewCard,
  toNewCardValues,
  toQuickCardDefaults,
  toQuickNewCard,
} from "./card-form-values";

const states: CardState[] = [
  { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  { id: "state-2", name: "Em andamento", category: "in_progress", position: 2 },
];

const emptyValues: CardFormValues = {
  cardType: "user_story",
  title: "",
  description: "",
  cardStateId: "state-1",
  priority: "medium",
  assigneeId: "",
  featureId: "",
  userStory: { acceptanceCriteria: [] },
  spike: { question: "", deadline: "", conclusion: "" },
  issue: {
    stepsToReproduce: "",
    expectedBehavior: "",
    observedBehavior: "",
    severity: "",
    location: "",
  },
  techDebt: { impact: "" },
};

const filledValues: CardFormValues = {
  cardType: "issue",
  title: "Lista vazia",
  description: "A lista não mostra os cards.",
  cardStateId: "state-2",
  priority: "urgent",
  assigneeId: "user-1",
  featureId: "feature-1",
  userStory: { acceptanceCriteria: [{ text: "Primeiro" }, { text: "" }, { text: "Segundo" }] },
  spike: { question: "Vale usar SSE?", deadline: "2026-10-20", conclusion: "Vale." },
  issue: {
    stepsToReproduce: "Abrir a lista",
    expectedBehavior: "Mostrar os cards",
    observedBehavior: "Lista vazia",
    severity: "critical",
    location: "Lista de cards",
  },
  techDebt: { impact: "Build lento" },
};

function cardWith(fields: CardTypeFields): Card {
  return {
    id: "card-1",
    projectId: "project-1",
    identifier: "MOM-12",
    type: fields.type,
    title: "Lista vazia",
    state: states[1],
    priority: "urgent",
    assignee: { userId: "user-1", name: "Ana Souza" },
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
    description: "A lista não mostra os cards.",
    fields,
    createdAt: "2026-10-12T09:00:00Z",
  };
}

describe("toNewCardValues", () => {
  it("começa como user story, de prioridade média, sem responsável e no primeiro estado do fluxo", () => {
    expect(toNewCardValues(states)).toEqual(emptyValues);
  });

  it("fica sem estado escolhido quando os estados não vieram", () => {
    expect(toNewCardValues([]).cardStateId).toBe("");
  });
});

describe("toCardFormValues", () => {
  it("leva os campos comuns e os critérios de aceite da user story para o formulário", () => {
    expect(
      toCardFormValues(cardWith({ type: "user_story", acceptanceCriteria: ["Primeiro"] }))
    ).toEqual({
      ...emptyValues,
      title: "Lista vazia",
      description: "A lista não mostra os cards.",
      cardStateId: "state-2",
      priority: "urgent",
      assigneeId: "user-1",
      userStory: { acceptanceCriteria: [{ text: "Primeiro" }] },
    });
  });

  it("leva o spike sem prazo como data vazia", () => {
    const values = toCardFormValues(
      cardWith({ type: "spike", question: "Vale usar SSE?", deadline: null, conclusion: "" })
    );

    expect(values.cardType).toBe("spike");
    expect(values.spike).toEqual({ question: "Vale usar SSE?", deadline: "", conclusion: "" });
  });

  it("leva a issue sem severidade como severidade não informada", () => {
    const values = toCardFormValues(
      cardWith({
        type: "issue",
        stepsToReproduce: "Abrir a lista",
        expectedBehavior: "",
        observedBehavior: "",
        severity: null,
        location: "",
      })
    );

    expect(values.issue).toEqual({
      stepsToReproduce: "Abrir a lista",
      expectedBehavior: "",
      observedBehavior: "",
      severity: "",
      location: "",
    });
  });

  it("leva o impacto da dívida técnica e deixa os grupos dos outros tipos vazios", () => {
    const values = toCardFormValues(cardWith({ type: "tech_debt", impact: "Build lento" }));

    expect(values.techDebt).toEqual({ impact: "Build lento" });
    expect(values.userStory).toEqual(emptyValues.userStory);
    expect(values.spike).toEqual(emptyValues.spike);
    expect(values.issue).toEqual(emptyValues.issue);
  });

  it("leva a feature do card, que o formulário de edição não manda", () => {
    const card = { ...cardWith({ type: "tech_debt", impact: "" }), featureId: "feature-1" };

    expect(toCardFormValues(card).featureId).toBe("feature-1");
    expect(toCardChanges(toCardFormValues(card))).not.toHaveProperty("featureId");
  });

  it("deixa o card sem responsável com o responsável vazio", () => {
    const card = { ...cardWith({ type: "tech_debt", impact: "" }), assignee: null };

    expect(toCardFormValues(card).assigneeId).toBe("");
  });
});

describe("toCardTypeFields", () => {
  it("monta os critérios de aceite sem os que ficaram em branco", () => {
    expect(toCardTypeFields({ ...filledValues, cardType: "user_story" })).toEqual({
      type: "user_story",
      acceptanceCriteria: ["Primeiro", "Segundo"],
    });
  });

  it("monta o grupo inteiro do spike", () => {
    expect(toCardTypeFields({ ...filledValues, cardType: "spike" })).toEqual({
      type: "spike",
      question: "Vale usar SSE?",
      deadline: "2026-10-20",
      conclusion: "Vale.",
    });
  });

  it("manda o prazo nulo quando a data do spike foi apagada", () => {
    const values: CardFormValues = {
      ...filledValues,
      cardType: "spike",
      spike: { ...filledValues.spike, deadline: "" },
    };

    expect(toCardTypeFields(values)).toMatchObject({ deadline: null });
  });

  it("monta o grupo inteiro da issue", () => {
    expect(toCardTypeFields(filledValues)).toEqual({
      type: "issue",
      stepsToReproduce: "Abrir a lista",
      expectedBehavior: "Mostrar os cards",
      observedBehavior: "Lista vazia",
      severity: "critical",
      location: "Lista de cards",
    });
  });

  it("manda a severidade nula quando ela não foi informada", () => {
    const values: CardFormValues = {
      ...filledValues,
      issue: { ...filledValues.issue, severity: "" },
    };

    expect(toCardTypeFields(values)).toMatchObject({ severity: null });
  });

  it("monta o grupo da dívida técnica", () => {
    expect(toCardTypeFields({ ...filledValues, cardType: "tech_debt" })).toEqual({
      type: "tech_debt",
      impact: "Build lento",
    });
  });
});

describe("toNewCard", () => {
  it("monta o card novo só com o grupo do tipo escolhido", () => {
    expect(toNewCard("project-1", filledValues)).toEqual({
      projectId: "project-1",
      title: "Lista vazia",
      description: "A lista não mostra os cards.",
      cardStateId: "state-2",
      priority: "urgent",
      assigneeId: "user-1",
      featureId: "feature-1",
      fields: toCardTypeFields(filledValues),
    });
  });

  it("deixa o estado, o responsável e a feature nulos quando nada foi escolhido", () => {
    const card = toNewCard("project-1", {
      ...filledValues,
      cardStateId: "",
      assigneeId: "",
      featureId: "",
    });

    expect(card.cardStateId).toBeNull();
    expect(card.assigneeId).toBeNull();
    expect(card.featureId).toBeNull();
  });
});

describe("toCardChanges", () => {
  it("leva o título, a descrição e o grupo do tipo, sem estado, prioridade nem responsável", () => {
    expect(toCardChanges(filledValues)).toEqual({
      title: "Lista vazia",
      description: "A lista não mostra os cards.",
      fields: toCardTypeFields(filledValues),
    });
  });
});

const NOTHING_SAVED: SavedCardFilter = {
  cardTypes: [],
  priorities: [],
  assigneeIds: [],
  featureIds: [],
};

describe("toQuickCardDefaults", () => {
  it("sem filtro, nasce user story, de prioridade média, sem responsável e sem feature", () => {
    expect(toQuickCardDefaults("state-1", {}, NOTHING_SAVED)).toEqual({
      cardType: "user_story",
      cardStateId: "state-1",
      priority: "medium",
      assigneeId: "",
      featureId: "",
    });
  });

  it("usa o tipo, a prioridade, o responsável e a feature que o filtro salvo escolhe sozinhos", () => {
    const saved: SavedCardFilter = {
      cardTypes: ["issue"],
      priorities: ["urgent"],
      assigneeIds: ["user-1"],
      featureIds: ["feature-1"],
    };

    expect(toQuickCardDefaults("state-1", {}, saved)).toEqual({
      cardType: "issue",
      cardStateId: "state-1",
      priority: "urgent",
      assigneeId: "user-1",
      featureId: "feature-1",
    });
  });

  it("ignora o critério salvo que escolhe mais de um valor", () => {
    const saved: SavedCardFilter = {
      cardTypes: ["issue", "spike"],
      priorities: ["urgent", "high"],
      assigneeIds: ["user-1", "user-2"],
      featureIds: ["feature-1", "feature-2"],
    };

    expect(toQuickCardDefaults("state-1", {}, saved)).toEqual(
      toQuickCardDefaults("state-1", {}, NOTHING_SAVED)
    );
  });

  it("deixa a pessoa escolhida no seletor da tela valer sobre o responsável salvo", () => {
    const saved = { ...NOTHING_SAVED, assigneeIds: ["user-1"] };

    expect(toQuickCardDefaults("state-1", { assigneeId: "user-2" }, saved).assigneeId).toBe(
      "user-2"
    );
  });

  it("nasce sem responsável quando o seletor da tela está em sem responsável", () => {
    const saved = { ...NOTHING_SAVED, assigneeIds: ["user-1"] };

    expect(toQuickCardDefaults("state-1", { isUnassigned: true }, saved).assigneeId).toBe("");
  });
});

describe("toQuickNewCard", () => {
  it("monta o card novo com o tipo e o título do formulário e o resto dos padrões", () => {
    const defaults = toQuickCardDefaults("state-1", { assigneeId: "user-1" }, NOTHING_SAVED);

    expect(
      toQuickNewCard("project-1", defaults, { cardType: "issue", title: "Lista vazia" })
    ).toEqual({
      projectId: "project-1",
      title: "Lista vazia",
      description: "",
      cardStateId: "state-1",
      priority: "medium",
      assigneeId: "user-1",
      featureId: null,
      fields: {
        type: "issue",
        stepsToReproduce: "",
        expectedBehavior: "",
        observedBehavior: "",
        severity: null,
        location: "",
      },
    });
  });
});
