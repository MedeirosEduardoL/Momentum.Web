import type { components } from "@/shared/api/generated/openapi";

type Schemas = components["schemas"];

export type CardInterviewStatus = Schemas["InterviewStatus"];
export type CardInterviewProposalStatus = Schemas["InterviewProposalStatus"];
export type CardInterviewProposalField = Schemas["InterviewProposalField"];

export type CardInterviewStarter = {
  userId: string;
  name: string;
};

export type CardInterviewSummary = {
  id: string;
  cardId: string;
  status: CardInterviewStatus;
  startedBy: CardInterviewStarter | null;
  roundCount: number;
  createdAt: string;
  closedAt: string | null;
};

export type CardInterviewQuestion = {
  title: string;
  body: string;
  recommendedAnswer: string;
};

export type CardInterviewAnswer = {
  question: number;
  answer: string;
};

export type CardInterviewRound = {
  number: number;
  questions: CardInterviewQuestion[];
  answers: CardInterviewAnswer[] | null;
};

export type CardInterview = Omit<CardInterviewSummary, "roundCount"> & {
  isFinished: boolean;
  rounds: CardInterviewRound[];
};

export type CardInterviewStep =
  | { kind: "answer"; round: CardInterviewRound }
  | { kind: "ask" }
  | { kind: "finished" }
  | { kind: "round-limit" };

export type CardInterviewRoundRequest = {
  interviewId: string;
  answers: CardInterviewAnswer[];
  signal: AbortSignal;
};

export type CardInterviewAccess = {
  userId: string | null;
  isAiEnabled: boolean;
  canAdministerProject: boolean;
};

export type CardInterviewProposalValue = string | string[];

export type CardInterviewProposalChange = {
  field: CardInterviewProposalField;
  proposed: CardInterviewProposalValue;
};

export type CardInterviewProposal = {
  id: string;
  interviewId: string;
  status: CardInterviewProposalStatus;
  summary: string;
  changes: CardInterviewProposalChange[];
  appliedFields: CardInterviewProposalField[];
  createdAt: string;
  decidedAt: string | null;
};

export type CardInterviewProposalDecision =
  | {
      proposalId: string;
      status: "applied";
      fields: CardInterviewProposalField[];
      closeInterview: boolean;
    }
  | { proposalId: string; status: "discarded" };
