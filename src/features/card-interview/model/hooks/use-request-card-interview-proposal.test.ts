import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGetCurrentOrganization } from "@/features/organization";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardInterviewKeys } from "../../api/card-interview-api-keys";
import { requestCardInterviewProposal } from "../../api/card-interview-proposal.service";
import type { CardInterviewProposal } from "../types/card-interview.types";
import { useRequestCardInterviewProposal } from "./use-request-card-interview-proposal";

vi.mock("../../api/card-interview.service");
vi.mock("../../api/card-interview-proposal.service");
vi.mock("@/features/organization", () => ({ useGetCurrentOrganization: vi.fn() }));

type OrganizationResult = ReturnType<typeof useGetCurrentOrganization>;

const proposal: CardInterviewProposal = {
  id: "proposal-1",
  interviewId: "interview-1",
  status: "pending",
  summary: "Deixei explícito quem usa o filtro.",
  changes: [{ field: "description", proposed: "O P.O filtra a lista." }],
  appliedFields: [],
  createdAt: "2026-10-13T12:10:00Z",
  decidedAt: null,
};
const refetchOrganization = vi.fn<OrganizationResult["refetch"]>();

function renderRequest() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useRequestCardInterviewProposal("interview-1"), { wrapper });

  return { result, invalidateQueries };
}

beforeEach(() => {
  vi.mocked(requestCardInterviewProposal).mockReset().mockResolvedValue(proposal);
  refetchOrganization.mockReset();
  vi.mocked(useGetCurrentOrganization).mockReturnValue({
    refetch: refetchOrganization,
  } as unknown as OrganizationResult);
});

describe("useRequestCardInterviewProposal", () => {
  it("pede a proposta e recarrega as propostas da entrevista", async () => {
    const { result, invalidateQueries } = renderRequest();

    await act(() => result.current.request());

    expect(vi.mocked(requestCardInterviewProposal).mock.calls[0][0]).toBe("interview-1");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardInterviewKeys.all });
    expect(result.current.failure).toBeNull();
  });

  it("mostra a espera e não deixa pedir duas vezes enquanto a IA escreve", async () => {
    let finishRequest = (_proposal: CardInterviewProposal) => {};
    vi.mocked(requestCardInterviewProposal).mockReturnValue(
      new Promise<CardInterviewProposal>(resolve => {
        finishRequest = resolve;
      })
    );
    const { result } = renderRequest();

    act(() => void result.current.request());
    await waitFor(() => expect(result.current.isRequesting).toBe(true));
    await act(() => result.current.request());

    expect(requestCardInterviewProposal).toHaveBeenCalledTimes(1);

    await act(async () => finishRequest(proposal));

    await waitFor(() => expect(result.current.isRequesting).toBe(false));
  });

  it.each([
    [
      "InterviewProposalNeedsAnswers",
      422,
      "Responda a pelo menos uma rodada antes de pedir a proposta.",
    ],
    [
      "InterviewProposalCardTooLarge",
      422,
      "O card tem texto demais para a IA reescrever numa proposta.",
    ],
    [
      "InterviewProposalLimitReached",
      422,
      "Esta entrevista já teve o máximo de 10 pedidos de proposta.",
    ],
    [
      "InterviewProposalInvalid",
      424,
      "A IA devolveu uma proposta que não pôde ser usada. Tente de novo.",
    ],
    ["InterviewClosed", 422, "Esta entrevista já foi encerrada."],
    ["AiNotConfigured", 424, "Os recursos de IA não estão configurados neste ambiente."],
  ])("guarda a recusa %s para a tela, sem repetir o pedido", async (code, status, details) => {
    const refusal = apiError(status, code, details);
    vi.mocked(requestCardInterviewProposal).mockRejectedValue(refusal);
    const { result, invalidateQueries } = renderRequest();

    await act(() => result.current.request());

    expect(result.current.failure).toBe(refusal);
    expect(requestCardInterviewProposal).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
  });

  it("limpa a falha quando a pessoa pede de novo, e relê a permissão se ela foi tirada", async () => {
    vi.mocked(requestCardInterviewProposal).mockRejectedValueOnce(
      apiError(403, "InterviewNotEnabled", "A entrevista pede a permissão de IA.")
    );
    const { result } = renderRequest();

    await act(() => result.current.request());
    expect(refetchOrganization).toHaveBeenCalledTimes(1);

    await act(() => result.current.request());

    expect(result.current.failure).toBeNull();
  });
});
