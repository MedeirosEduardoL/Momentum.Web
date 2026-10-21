import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardInterviewKeys } from "../../api/card-interview-api-keys";
import { closeCardInterview } from "../../api/card-interview.service";
import type { CardInterview } from "../types/card-interview.types";
import { useCloseCardInterview } from "./use-close-card-interview";

vi.mock("../../api/card-interview.service");
vi.mock("../../api/card-interview-proposal.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const closedInterview: CardInterview = {
  id: "interview-1",
  cardId: "card-1",
  status: "closed",
  startedBy: { userId: "user-1", name: "Ana Souza" },
  isFinished: false,
  rounds: [],
  createdAt: "2026-10-13T12:00:00Z",
  closedAt: "2026-10-13T15:00:00Z",
};

function renderClose() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useCloseCardInterview(), { wrapper });

  return { result, invalidateQueries };
}

beforeEach(() => {
  vi.mocked(closeCardInterview).mockReset().mockResolvedValue(closedInterview);
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
});

describe("useCloseCardInterview", () => {
  it("encerra a entrevista, confirma na tela e recarrega entrevistas e propostas", async () => {
    const { result, invalidateQueries } = renderClose();

    await act(() => result.current("interview-1"));

    expect(vi.mocked(closeCardInterview).mock.calls[0][0]).toBe("interview-1");
    expect(toast.success).toHaveBeenCalledWith("A entrevista foi encerrada.");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardInterviewKeys.all });
  });

  it("mostra a recusa do Core a quem não iniciou nem administra o projeto", async () => {
    const details = "Só quem iniciou a entrevista ou o administrador do projeto a encerra.";
    vi.mocked(closeCardInterview).mockRejectedValue(apiError(403, "InterviewCloseDenied", details));
    const { result, invalidateQueries } = renderClose();

    await expect(act(() => result.current("interview-1"))).resolves.toBeUndefined();

    expect(toast.error).toHaveBeenCalledWith(details);
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
  });
});
