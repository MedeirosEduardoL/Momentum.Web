import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import {
  decideCardInterviewProposal,
  listCardInterviewProposals,
  requestCardInterviewProposal,
} from "./card-interview-proposal.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const proposalDto = {
  card_interview_proposal_id: "proposal-1",
  card_interview_id: "interview-1",
  status: "pending",
  summary: "Deixei explícito quem usa o filtro.",
  changes: [
    { field: "description", text: "O P.O filtra a lista de cards por responsável.", items: null },
    {
      field: "acceptance_criteria",
      text: null,
      items: ["O filtro fica na URL.", "A lista volta para a primeira página."],
    },
  ],
  applied_fields: [],
  created_at: "2026-10-13T12:10:00Z",
  decided_at: null,
};

const proposal = {
  id: "proposal-1",
  interviewId: "interview-1",
  status: "pending",
  summary: "Deixei explícito quem usa o filtro.",
  changes: [
    { field: "description", proposed: "O P.O filtra a lista de cards por responsável." },
    {
      field: "acceptance_criteria",
      proposed: ["O filtro fica na URL.", "A lista volta para a primeira página."],
    },
  ],
  appliedFields: [],
  createdAt: "2026-10-13T12:10:00Z",
  decidedAt: null,
};

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: proposalDto });
  vi.mocked(api.patch).mockReset().mockResolvedValue({ data: proposalDto });
});

describe("listCardInterviewProposals", () => {
  it("lista as propostas da entrevista, com o texto ou os itens de cada mudança", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        proposalDto,
        {
          ...proposalDto,
          card_interview_proposal_id: "proposal-0",
          status: "applied",
          applied_fields: ["description"],
          decided_at: "2026-10-13T12:00:00Z",
        },
      ],
    });

    await expect(listCardInterviewProposals("interview-1")).resolves.toEqual([
      proposal,
      {
        ...proposal,
        id: "proposal-0",
        status: "applied",
        appliedFields: ["description"],
        decidedAt: "2026-10-13T12:00:00Z",
      },
    ]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/card-interviews/interview-1/proposals");
  });
});

describe("requestCardInterviewProposal", () => {
  it("pede a proposta sem corpo e espera mais do que uma chamada comum", async () => {
    await expect(requestCardInterviewProposal("interview-1")).resolves.toEqual(proposal);

    expect(api.post).toHaveBeenCalledWith(
      "/api/v1/card-interviews/interview-1/proposals",
      undefined,
      { timeout: 330_000 }
    );
  });

  it("repassa o erro de IA que o Core devolve como erro HTTP", async () => {
    const notConfigured = apiError(
      424,
      "AiNotConfigured",
      "Os recursos de IA não estão configurados neste ambiente."
    );
    vi.mocked(api.post).mockRejectedValue(notConfigured);

    await expect(requestCardInterviewProposal("interview-1")).rejects.toBe(notConfigured);
  });
});

describe("decideCardInterviewProposal", () => {
  it.each([true, false])(
    "aplica só as mudanças escolhidas e diz se encerra a entrevista (%s)",
    async closeInterview => {
      await decideCardInterviewProposal({
        proposalId: "proposal-1",
        status: "applied",
        fields: ["acceptance_criteria"],
        closeInterview,
      });

      expect(api.patch).toHaveBeenCalledWith("/api/v1/card-interview-proposals/proposal-1", {
        status: "applied",
        fields: ["acceptance_criteria"],
        close_interview: closeInterview,
      });
    }
  );

  it("descarta a proposta sem mandar campos nem encerrar a entrevista", async () => {
    await decideCardInterviewProposal({ proposalId: "proposal-1", status: "discarded" });

    expect(api.patch).toHaveBeenCalledWith("/api/v1/card-interview-proposals/proposal-1", {
      status: "discarded",
      close_interview: false,
    });
  });

  it("devolve a proposta decidida, com o que entrou no card", async () => {
    vi.mocked(api.patch).mockResolvedValue({
      data: {
        ...proposalDto,
        status: "applied",
        applied_fields: ["description"],
        decided_at: "2026-10-13T12:20:00Z",
      },
    });

    await expect(
      decideCardInterviewProposal({
        proposalId: "proposal-1",
        status: "applied",
        fields: ["description"],
        closeInterview: false,
      })
    ).resolves.toMatchObject({
      status: "applied",
      appliedFields: ["description"],
      decidedAt: "2026-10-13T12:20:00Z",
    });
  });
});
