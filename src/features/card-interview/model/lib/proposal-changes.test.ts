import { describe, expect, it } from "vitest";
import type { Card } from "@/features/card";
import type { CardInterviewProposal } from "../types/card-interview.types";
import {
  chooseFields,
  currentValueOf,
  isPendingProposal,
  wasLatestProposalApplied,
} from "./proposal-changes";

const userStory: Card = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "user_story",
  title: "Filtrar a lista de cards",
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
  description: "A lista precisa de filtro.",
  fields: { type: "user_story", acceptanceCriteria: ["O filtro fica na URL."] },
  createdAt: "2026-10-12T09:00:00Z",
};

const spike: Card = {
  ...userStory,
  type: "spike",
  fields: { type: "spike", question: "Cabe no Core?", deadline: null, conclusion: "" },
};

const issue: Card = {
  ...userStory,
  type: "issue",
  fields: {
    type: "issue",
    stepsToReproduce: "Abrir a lista.",
    expectedBehavior: "A lista aparece.",
    observedBehavior: "A lista fica vazia.",
    severity: null,
    location: "",
  },
};

const techDebt: Card = {
  ...userStory,
  type: "tech_debt",
  fields: { type: "tech_debt", impact: "Build lento." },
};

const proposal: CardInterviewProposal = {
  id: "proposal-1",
  interviewId: "interview-1",
  status: "pending",
  summary: "",
  changes: [
    { field: "description", proposed: "O P.O filtra a lista." },
    { field: "acceptance_criteria", proposed: ["O filtro fica na URL.", "A página volta para 1."] },
  ],
  appliedFields: [],
  createdAt: "2026-10-13T12:10:00Z",
  decidedAt: null,
};

describe("currentValueOf", () => {
  it("lê a descrição e os critérios de aceite da user story", () => {
    expect(currentValueOf(userStory, "description")).toBe("A lista precisa de filtro.");
    expect(currentValueOf(userStory, "acceptance_criteria")).toEqual(["O filtro fica na URL."]);
  });

  it("lê a pergunta e a conclusão do spike, inclusive a que está vazia", () => {
    expect(currentValueOf(spike, "spike_question")).toBe("Cabe no Core?");
    expect(currentValueOf(spike, "spike_conclusion")).toBe("");
  });

  it("lê os três textos da issue", () => {
    expect(currentValueOf(issue, "issue_steps_to_reproduce")).toBe("Abrir a lista.");
    expect(currentValueOf(issue, "issue_expected_behavior")).toBe("A lista aparece.");
    expect(currentValueOf(issue, "issue_observed_behavior")).toBe("A lista fica vazia.");
  });

  it("lê o impacto da dívida técnica", () => {
    expect(currentValueOf(techDebt, "tech_debt_impact")).toBe("Build lento.");
  });

  it("mostra vazio o campo que não é do tipo do card", () => {
    expect(currentValueOf(techDebt, "acceptance_criteria")).toEqual([]);
    expect(currentValueOf(userStory, "spike_question")).toBe("");
    expect(currentValueOf(userStory, "issue_observed_behavior")).toBe("");
    expect(currentValueOf(userStory, "tech_debt_impact")).toBe("");
  });
});

describe("isPendingProposal e wasLatestProposalApplied", () => {
  it("reconhece a proposta que ainda espera decisão", () => {
    expect(isPendingProposal(proposal)).toBe(true);
    expect(isPendingProposal({ ...proposal, status: "discarded" })).toBe(false);
  });

  it("olha só a proposta mais recente, que vem primeiro", () => {
    const applied: CardInterviewProposal = { ...proposal, status: "applied" };
    const discarded: CardInterviewProposal = { ...proposal, status: "discarded" };

    expect(wasLatestProposalApplied([applied, discarded])).toBe(true);
    expect(wasLatestProposalApplied([discarded, applied])).toBe(false);
    expect(wasLatestProposalApplied([])).toBe(false);
  });
});

describe("chooseFields", () => {
  it("devolve, na ordem da proposta, só os campos marcados que ela traz", () => {
    expect(chooseFields(proposal, ["acceptance_criteria", "description"])).toEqual([
      "description",
      "acceptance_criteria",
    ]);
    expect(chooseFields(proposal, ["acceptance_criteria", "tech_debt_impact"])).toEqual([
      "acceptance_criteria",
    ]);
    expect(chooseFields(proposal, [])).toEqual([]);
  });
});
