import { api } from "@/shared/api/client";
import { fillPath } from "@/shared/api/fill-path";
import type { components } from "@/shared/api/generated/openapi";
import type {
  CardInterviewProposal,
  CardInterviewProposalChange,
  CardInterviewProposalDecision,
} from "../model/types/card-interview.types";

type Schemas = components["schemas"];
type ProposalDto = Schemas["InterviewProposalResponseDto"];
type ProposalChangeDto = Schemas["InterviewProposalChangeDto"];

const PROPOSAL_TIMEOUT_MS = 330_000;

function proposalsPath(cardInterviewId: string) {
  return fillPath("/api/v1/card-interviews/{cardInterviewId}/proposals", { cardInterviewId });
}

function proposalPath(cardInterviewProposalId: string) {
  return fillPath("/api/v1/card-interview-proposals/{cardInterviewProposalId}", {
    cardInterviewProposalId,
  });
}

function toChange(dto: ProposalChangeDto): CardInterviewProposalChange {
  return { field: dto.field, proposed: dto.items ?? dto.text ?? "" };
}

function toProposal(dto: ProposalDto): CardInterviewProposal {
  return {
    id: dto.card_interview_proposal_id,
    interviewId: dto.card_interview_id,
    status: dto.status,
    summary: dto.summary,
    changes: dto.changes.map(toChange),
    appliedFields: dto.applied_fields,
    createdAt: dto.created_at,
    decidedAt: dto.decided_at,
  };
}

function toDecisionPayload(
  decision: CardInterviewProposalDecision
): Schemas["DecideInterviewProposalRequestDto"] {
  return decision.status === "applied"
    ? { status: decision.status, fields: decision.fields, close_interview: decision.closeInterview }
    : { status: decision.status, close_interview: false };
}

export async function listCardInterviewProposals(
  interviewId: string
): Promise<CardInterviewProposal[]> {
  const response = await api.get<ProposalDto[]>(proposalsPath(interviewId));

  return response.data.map(toProposal);
}

export async function requestCardInterviewProposal(
  interviewId: string
): Promise<CardInterviewProposal> {
  const response = await api.post<ProposalDto>(proposalsPath(interviewId), undefined, {
    timeout: PROPOSAL_TIMEOUT_MS,
  });

  return toProposal(response.data);
}

export async function decideCardInterviewProposal(
  decision: CardInterviewProposalDecision
): Promise<CardInterviewProposal> {
  const response = await api.patch<ProposalDto>(
    proposalPath(decision.proposalId),
    toDecisionPayload(decision)
  );

  return toProposal(response.data);
}
