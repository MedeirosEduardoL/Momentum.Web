import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGetCurrentOrganization } from "@/features/organization";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardInterviewKeys } from "../../api/card-interview-api-keys";
import { askCardInterviewRound } from "../../api/card-interview.service";
import type { CardInterviewRound } from "../types/card-interview.types";
import { useCardInterviewRound } from "./use-card-interview-round";

vi.mock("../../api/card-interview.service");
vi.mock("../../api/card-interview-proposal.service");
vi.mock("@/features/organization", () => ({ useGetCurrentOrganization: vi.fn() }));

type OrganizationResult = ReturnType<typeof useGetCurrentOrganization>;

const nextRound: CardInterviewRound = {
  number: 2,
  questions: [{ title: "Quem usa o filtro?", body: "", recommendedAnswer: "O P.O." }],
  answers: null,
};
const answers = [{ question: 1, answer: "Sim, na URL." }];
const refetchOrganization = vi.fn<OrganizationResult["refetch"]>();

function renderRound() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const hook = renderHook(() => useCardInterviewRound(), { wrapper });

  return { ...hook, invalidateQueries };
}

function coreKeepsWriting() {
  let finish: (round: CardInterviewRound) => void = () => {};
  let fail: (error: unknown) => void = () => {};

  vi.mocked(askCardInterviewRound).mockImplementation(
    ({ signal }) =>
      new Promise<CardInterviewRound>((resolve, reject) => {
        finish = resolve;
        fail = reject;
        signal.addEventListener("abort", () =>
          reject(new DOMException("The operation was aborted.", "AbortError"))
        );
      })
  );

  return {
    request: () => vi.mocked(askCardInterviewRound).mock.calls[0][0],
    finish: () => finish(nextRound),
    fail: (error: unknown) => fail(error),
  };
}

beforeEach(() => {
  vi.mocked(askCardInterviewRound).mockReset().mockResolvedValue(nextRound);
  refetchOrganization.mockReset();
  vi.mocked(useGetCurrentOrganization).mockReturnValue({
    refetch: refetchOrganization,
  } as unknown as OrganizationResult);
});

describe("useCardInterviewRound — pedido", () => {
  it("manda as respostas da rodada e recarrega a entrevista quando a rodada chega", async () => {
    const { result, invalidateQueries } = renderRound();

    await act(() => result.current.ask("interview-1", answers));

    expect(vi.mocked(askCardInterviewRound).mock.calls[0][0]).toMatchObject({
      interviewId: "interview-1",
      answers,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardInterviewKeys.all });
    expect(result.current.isAsking).toBe(false);
    expect(result.current.failure).toBeNull();
  });

  it("mostra que está gerando enquanto o stream corre", async () => {
    const core = coreKeepsWriting();
    const { result } = renderRound();

    act(() => void result.current.ask("interview-1", []));
    await waitFor(() => expect(result.current.isAsking).toBe(true));

    await act(async () => core.finish());

    await waitFor(() => expect(result.current.isAsking).toBe(false));
  });

  it("não pede duas rodadas ao mesmo tempo", async () => {
    const core = coreKeepsWriting();
    const { result } = renderRound();

    act(() => void result.current.ask("interview-1", []));
    await waitFor(() => expect(result.current.isAsking).toBe(true));
    await act(() => result.current.ask("interview-1", []));

    expect(askCardInterviewRound).toHaveBeenCalledTimes(1);

    await act(async () => core.finish());
  });
});

describe("useCardInterviewRound — falha", () => {
  it.each([
    ["AiNotConfigured", 424, "Os recursos de IA não estão configurados neste ambiente."],
    [
      "InterviewRoundInvalid",
      424,
      "A IA devolveu uma rodada que não pôde ser usada. Tente de novo.",
    ],
    ["InterviewRoundAlreadyAsked", 409, "Esta rodada já foi gerada por outra requisição."],
    ["InterviewClosed", 422, "Esta entrevista já foi encerrada."],
    ["InterviewAnswerInvalid", 400, "Há resposta vazia, repetida ou com caractere inválido."],
  ])("guarda a recusa %s para a tela e recarrega a entrevista", async (code, status, details) => {
    const refusal = apiError(status, code, details);
    vi.mocked(askCardInterviewRound).mockRejectedValue(refusal);
    const { result, invalidateQueries } = renderRound();

    await act(() => result.current.ask("interview-1", answers));

    expect(result.current.failure).toBe(refusal);
    expect(result.current.isAsking).toBe(false);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardInterviewKeys.all });
    expect(askCardInterviewRound).toHaveBeenCalledTimes(1);
  });

  it("não trata como falha o limite de rodadas, que chega depois de as respostas serem gravadas", async () => {
    vi.mocked(askCardInterviewRound).mockRejectedValue(
      apiError(422, "InterviewRoundLimitReached", "A entrevista chegou ao limite de 10 rodadas.")
    );
    const { result, invalidateQueries } = renderRound();

    await act(() => result.current.ask("interview-1", answers));

    expect(result.current.failure).toBeNull();
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
  });

  it("relê a permissão quando o Core diz que ela caiu", async () => {
    const notEnabled = apiError(403, "InterviewNotEnabled", "A entrevista pede a permissão de IA.");
    vi.mocked(askCardInterviewRound).mockRejectedValue(notEnabled);
    const { result } = renderRound();

    await act(() => result.current.ask("interview-1", answers));

    expect(result.current.failure).toBe(notEnabled);
    expect(refetchOrganization).toHaveBeenCalledTimes(1);
  });

  it("limpa a falha anterior quando a pessoa tenta de novo", async () => {
    vi.mocked(askCardInterviewRound).mockRejectedValueOnce(networkFailure);
    const { result } = renderRound();

    await act(() => result.current.ask("interview-1", []));
    expect(result.current.failure).toBe(networkFailure);

    await act(() => result.current.ask("interview-1", []));

    expect(result.current.failure).toBeNull();
    expect(askCardInterviewRound).toHaveBeenCalledTimes(2);
  });
});

describe("useCardInterviewRound — cancelamento", () => {
  it("cancela o stream a pedido da pessoa, sem mostrar falha, e recarrega a entrevista", async () => {
    const core = coreKeepsWriting();
    const { result, invalidateQueries } = renderRound();

    act(() => void result.current.ask("interview-1", []));
    await waitFor(() => expect(result.current.isAsking).toBe(true));
    act(() => result.current.cancel());

    await waitFor(() => expect(result.current.isAsking).toBe(false));
    expect(core.request().signal.aborted).toBe(true);
    expect(result.current.failure).toBeNull();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardInterviewKeys.all });
  });

  it("cancela o stream quando a tela sai", async () => {
    const core = coreKeepsWriting();
    const { result, unmount } = renderRound();

    act(() => void result.current.ask("interview-1", []));
    await waitFor(() => expect(result.current.isAsking).toBe(true));
    unmount();

    expect(core.request().signal.aborted).toBe(true);
  });

  it("deixa pedir de novo depois de cancelar", async () => {
    coreKeepsWriting();
    const { result } = renderRound();

    act(() => void result.current.ask("interview-1", []));
    await waitFor(() => expect(result.current.isAsking).toBe(true));
    act(() => result.current.cancel());
    await waitFor(() => expect(result.current.isAsking).toBe(false));
    vi.mocked(askCardInterviewRound).mockResolvedValue(nextRound);

    await act(() => result.current.ask("interview-1", []));

    expect(askCardInterviewRound).toHaveBeenCalledTimes(2);
  });
});
