import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Card } from "@/features/card";
import { useGetCurrentOrganization } from "@/features/organization";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardInterviewKeys } from "../../api/card-interview-api-keys";
import { startCardInterview } from "../../api/card-interview.service";
import type { CardInterview } from "../types/card-interview.types";
import type { RoundRequestState } from "./use-card-interview-round";
import { useStartCardInterview } from "./use-start-card-interview";

vi.mock("../../api/card-interview.service");
vi.mock("../../api/card-interview-proposal.service");
vi.mock("@/features/organization", () => ({ useGetCurrentOrganization: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type OrganizationResult = ReturnType<typeof useGetCurrentOrganization>;

const card = { id: "card-1", projectId: "project-1" } as Card;
const interview: CardInterview = {
  id: "interview-1",
  cardId: "card-1",
  status: "open",
  startedBy: { userId: "user-1", name: "Ana Souza" },
  isFinished: false,
  rounds: [],
  createdAt: "2026-10-13T12:00:00Z",
  closedAt: null,
};
const refetchOrganization = vi.fn<OrganizationResult["refetch"]>();
const askRound = vi.fn<RoundRequestState["ask"]>();

function renderStart() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useStartCardInterview(card, askRound), { wrapper });

  return { result, invalidateQueries };
}

beforeEach(() => {
  vi.mocked(startCardInterview).mockReset().mockResolvedValue(interview);
  vi.mocked(toast.error).mockClear();
  refetchOrganization.mockReset();
  askRound.mockReset().mockResolvedValue(null);
  vi.mocked(useGetCurrentOrganization).mockReturnValue({
    refetch: refetchOrganization,
  } as unknown as OrganizationResult);
});

describe("useStartCardInterview", () => {
  it("inicia a entrevista do card e, depois de recarregar as entrevistas, pede a primeira rodada", async () => {
    const { result, invalidateQueries } = renderStart();

    act(() => result.current.startInterview());

    await waitFor(() => expect(askRound).toHaveBeenCalledTimes(1));
    expect(askRound).toHaveBeenCalledWith("interview-1", []);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardInterviewKeys.all });
    expect(invalidateQueries.mock.invocationCallOrder[0]).toBeLessThan(
      askRound.mock.invocationCallOrder[0]
    );
    expect(vi.mocked(startCardInterview).mock.calls[0][0]).toBe("card-1");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it.each([
    ["InterviewAlreadyOpen", 409, "Este card já tem uma entrevista aberta."],
    ["InterviewLimitReached", 422, "Este card já teve o máximo de 20 entrevistas."],
    ["InterviewCardArchived", 422, "Card arquivado não recebe entrevista."],
  ])(
    "mostra a recusa %s do Core, recarrega as entrevistas e não pede rodada",
    async (code, status, details) => {
      vi.mocked(startCardInterview).mockRejectedValue(apiError(status, code, details));
      const { result, invalidateQueries } = renderStart();

      act(() => result.current.startInterview());

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(details));
      expect(invalidateQueries).toHaveBeenCalledTimes(1);
      expect(refetchOrganization).not.toHaveBeenCalled();
      expect(askRound).not.toHaveBeenCalled();
    }
  );

  it("relê a permissão quando o Core diz que ela caiu", async () => {
    const details =
      "A entrevista pede a permissão de IA, e quem a concede é o administrador da organização.";
    vi.mocked(startCardInterview).mockRejectedValue(apiError(403, "InterviewNotEnabled", details));
    const { result } = renderStart();

    act(() => result.current.startInterview());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(details));
    expect(refetchOrganization).toHaveBeenCalledTimes(1);
  });

  it("trata a falha de rede sem deixar o erro escapar para a tela nem pedir rodada", async () => {
    vi.mocked(startCardInterview).mockRejectedValue(networkFailure);
    const { result } = renderStart();

    act(() => result.current.startInterview());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
      )
    );
    expect(result.current.isStarting).toBe(false);
    expect(askRound).not.toHaveBeenCalled();
  });
});
