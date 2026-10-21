import { formatCount } from "@/shared/lib/format-count";
import { formatDate } from "@/shared/lib/format-date";
import type { CardInterviewProposal, CardInterviewSummary } from "../types/card-interview.types";
import { PROPOSAL_FIELD_LABELS } from "./proposal-changes";

const SEPARATOR = " · ";
const STARTER_WHO_LEFT = "alguém que saiu da organização";

function describeStart({ startedBy, createdAt }: CardInterviewSummary) {
  return `Iniciada por ${startedBy?.name ?? STARTER_WHO_LEFT} em ${formatDate(createdAt)}`;
}

export function describeInterview(interview: CardInterviewSummary) {
  return [
    describeStart(interview),
    formatCount(interview.roundCount, "rodada"),
    ...(interview.closedAt ? [`Encerrada em ${formatDate(interview.closedAt)}`] : []),
  ].join(SEPARATOR);
}

export function describeProposalDecision({
  status,
  appliedFields,
  decidedAt,
  createdAt,
}: CardInterviewProposal) {
  const day = formatDate(decidedAt ?? createdAt);

  if (status === "discarded") {
    return `Proposta descartada em ${day}`;
  }

  const fields = appliedFields.map(field => PROPOSAL_FIELD_LABELS[field]).join(", ");

  return `Proposta aplicada em ${day}: ${fields}`;
}
