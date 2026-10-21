import type { Card } from "@/features/card";
import type {
  CardInterviewProposal,
  CardInterviewProposalField,
  CardInterviewProposalValue,
} from "../types/card-interview.types";

export const PROPOSAL_FIELD_LABELS: Record<CardInterviewProposalField, string> = {
  description: "Descrição",
  acceptance_criteria: "Critérios de aceite",
  spike_question: "Pergunta",
  spike_conclusion: "Conclusão",
  issue_steps_to_reproduce: "Passos para reproduzir",
  issue_expected_behavior: "Comportamento esperado",
  issue_observed_behavior: "Comportamento observado",
  tech_debt_impact: "Impacto",
};

const NO_TEXT = "";

function userStoryValueOf({ fields }: Card) {
  return fields.type === "user_story" ? fields.acceptanceCriteria : [];
}

function spikeValueOf({ fields }: Card, field: "question" | "conclusion") {
  return fields.type === "spike" ? fields[field] : NO_TEXT;
}

function issueValueOf(
  { fields }: Card,
  field: "stepsToReproduce" | "expectedBehavior" | "observedBehavior"
) {
  return fields.type === "issue" ? fields[field] : NO_TEXT;
}

function techDebtValueOf({ fields }: Card) {
  return fields.type === "tech_debt" ? fields.impact : NO_TEXT;
}

export function currentValueOf(
  card: Card,
  field: CardInterviewProposalField
): CardInterviewProposalValue {
  switch (field) {
    case "description":
      return card.description;
    case "acceptance_criteria":
      return userStoryValueOf(card);
    case "spike_question":
      return spikeValueOf(card, "question");
    case "spike_conclusion":
      return spikeValueOf(card, "conclusion");
    case "issue_steps_to_reproduce":
      return issueValueOf(card, "stepsToReproduce");
    case "issue_expected_behavior":
      return issueValueOf(card, "expectedBehavior");
    case "issue_observed_behavior":
      return issueValueOf(card, "observedBehavior");
    case "tech_debt_impact":
      return techDebtValueOf(card);
  }
}

export function isPendingProposal(proposal: CardInterviewProposal) {
  return proposal.status === "pending";
}

export function wasLatestProposalApplied(proposals: CardInterviewProposal[]) {
  return proposals.at(0)?.status === "applied";
}

export function chooseFields(proposal: CardInterviewProposal, chosen: string[]) {
  return proposal.changes.map(change => change.field).filter(field => chosen.includes(field));
}
