import { describe, expect, it } from "vitest";
import type { CardInterviewProposal, CardInterviewSummary } from "../types/card-interview.types";
import { describeInterview, describeProposalDecision } from "./card-interview-description";

const interview: CardInterviewSummary = {
  id: "interview-1",
  cardId: "card-1",
  status: "open",
  startedBy: { userId: "user-1", name: "Ana Souza" },
  roundCount: 3,
  createdAt: "2026-10-13T15:00:00Z",
  closedAt: null,
};

const proposal: CardInterviewProposal = {
  id: "proposal-1",
  interviewId: "interview-1",
  status: "applied",
  summary: "Deixei explícito quem usa o filtro.",
  changes: [],
  appliedFields: ["description", "acceptance_criteria"],
  createdAt: "2026-10-13T15:00:00Z",
  decidedAt: "2026-10-14T15:00:00Z",
};

describe("describeInterview", () => {
  it("diz quem iniciou, quando e quantas rodadas a entrevista aberta tem", () => {
    expect(describeInterview(interview)).toBe("Iniciada por Ana Souza em 13/10/2026 · 3 rodadas");
  });

  it("diz quando a entrevista foi encerrada, com a rodada no singular", () => {
    expect(
      describeInterview({
        ...interview,
        status: "closed",
        roundCount: 1,
        closedAt: "2026-10-14T15:00:00Z",
      })
    ).toBe("Iniciada por Ana Souza em 13/10/2026 · 1 rodada · Encerrada em 14/10/2026");
  });

  it("não inventa nome para quem saiu da organização", () => {
    expect(describeInterview({ ...interview, startedBy: null })).toBe(
      "Iniciada por alguém que saiu da organização em 13/10/2026 · 3 rodadas"
    );
  });
});

describe("describeProposalDecision", () => {
  it("diz quando a proposta foi aplicada e quais campos entraram no card", () => {
    expect(describeProposalDecision(proposal)).toBe(
      "Proposta aplicada em 14/10/2026: Descrição, Critérios de aceite"
    );
  });

  it("diz quando a proposta foi descartada", () => {
    expect(describeProposalDecision({ ...proposal, status: "discarded", appliedFields: [] })).toBe(
      "Proposta descartada em 14/10/2026"
    );
  });
});
