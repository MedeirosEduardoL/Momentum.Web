import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListProjectMembers, type ProjectMember } from "@/features/project";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardKeys } from "../../api/card-api-keys";
import { setCardAssignee, updateCard } from "../../api/card.service";
import type { Card } from "../types/card.types";
import { useCardActions } from "./use-card-actions";

vi.mock("../../api/card.service");
vi.mock("@/features/project", () => ({ useListProjectMembers: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type TeamResult = ReturnType<typeof useListProjectMembers>;

const card: Card = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "tech_debt",
  title: "Pagar a dívida do build",
  state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  priority: "medium",
  assignee: { userId: "user-1", name: "Ana Souza" },
  featureId: null,
  progress: 0,
  taskCount: 0,
  doneTaskCount: 0,
  subitemCounts: {
    task: { total: 0, done: 0 },
    bug: { total: 0, done: 0 },
    impediment: { total: 0, done: 0 },
  },
  isArchived: false,
  updatedAt: "2026-10-13T12:00:00Z",
  description: "",
  fields: { type: "tech_debt", impact: "Build lento" },
  createdAt: "2026-10-12T09:00:00Z",
};
const refetchTeam = vi.fn<TeamResult["refetch"]>();
const refetch: TeamResult["refetch"] = refetchTeam;
const team: ProjectMember[] = [];

function renderActions(shownCard = card) {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useCardActions(shownCard), { wrapper });

  return { result, invalidateQueries };
}

function neverSettles<TResult>() {
  return new Promise<TResult>(() => {});
}

beforeEach(() => {
  vi.mocked(updateCard).mockReset().mockResolvedValue(card);
  vi.mocked(setCardAssignee).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  refetchTeam.mockReset();
  vi.mocked(useListProjectMembers).mockReturnValue({ data: team, refetch } as TeamResult);
});

describe("useCardActions — o que a tela mostra", () => {
  it("mostra o estado, a prioridade e o responsável do card", () => {
    const { result } = renderActions();

    expect(result.current.selected).toEqual({
      cardStateId: "state-1",
      priority: "medium",
      assigneeId: "user-1",
    });
    expect(result.current.isBusy).toBe(false);
  });

  it("mostra o responsável vazio no card sem responsável", () => {
    const { result } = renderActions({ ...card, assignee: null });

    expect(result.current.selected.assigneeId).toBe("");
  });

  it("mostra o estado pedido e trava as ações enquanto a mudança corre", async () => {
    vi.mocked(updateCard).mockReturnValue(neverSettles());
    const { result } = renderActions();

    act(() => result.current.changeState("state-2"));

    await waitFor(() => expect(result.current.isBusy).toBe(true));
    expect(result.current.selected).toEqual({
      cardStateId: "state-2",
      priority: "medium",
      assigneeId: "user-1",
    });
  });

  it("mostra o card sem responsável enquanto a retirada corre", async () => {
    vi.mocked(setCardAssignee).mockReturnValue(neverSettles());
    const { result } = renderActions();

    act(() => result.current.changeAssignee(""));

    await waitFor(() => expect(result.current.isBusy).toBe(true));
    expect(result.current.selected.assigneeId).toBe("");
  });
});

describe("useCardActions — estado, prioridade e arquivo", () => {
  it("muda só o estado do card e recarrega as consultas de card", async () => {
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeState("state-2"));

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all }));
    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      cardStateId: "state-2",
    });
  });

  it("muda só a prioridade do card", async () => {
    const { result } = renderActions();

    act(() => result.current.changePriority("urgent"));

    await waitFor(() => expect(updateCard).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      priority: "urgent",
    });
  });

  it("arquiva e desarquiva o card", async () => {
    const { result } = renderActions();

    act(() => result.current.archive());
    await waitFor(() => expect(result.current.isBusy).toBe(false));
    act(() => result.current.unarchive());

    await waitFor(() => expect(updateCard).toHaveBeenCalledTimes(2));
    expect(vi.mocked(updateCard).mock.calls.map(([update]) => update)).toEqual([
      { cardId: "card-1", isArchived: true },
      { cardId: "card-1", isArchived: false },
    ]);
  });

  it("pede para refazer, com a tela já recarregada, quando outra pessoa alterou o card", async () => {
    vi.mocked(updateCard).mockRejectedValue(
      apiError(
        409,
        "CardChangedMeanwhile",
        "O card foi alterado por outra pessoa enquanto você editava. Recarregue e tente de novo."
      )
    );
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeState("state-2"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "O card foi alterado por outra pessoa. A tela mostra a versão atual: confira e refaça a alteração."
      )
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
    expect(refetchTeam).not.toHaveBeenCalled();
  });

  it("mostra a mensagem do Core e recarrega os estados quando o estado deixou de existir", async () => {
    vi.mocked(updateCard).mockRejectedValue(
      apiError(422, "CardStateInvalid", "Este estado não existe no projeto do card.", {
        property: "cardStateId",
      })
    );
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeState("state-9"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Este estado não existe no projeto do card.")
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
  });

  it("mostra a falha de rede sem quebrar a tela", async () => {
    vi.mocked(updateCard).mockRejectedValue(networkFailure);
    const { result } = renderActions();

    act(() => result.current.changePriority("low"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
      )
    );
    expect(result.current.selected.priority).toBe("medium");
  });
});

describe("useCardActions — responsável", () => {
  it("define o responsável pela rota própria e recarrega as consultas de card", async () => {
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeAssignee("user-2"));

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all }));
    expect(vi.mocked(setCardAssignee).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      userId: "user-2",
    });
    expect(updateCard).not.toHaveBeenCalled();
  });

  it("tira o responsável quando a escolha é sem responsável", async () => {
    const { result } = renderActions();

    act(() => result.current.changeAssignee(""));

    await waitFor(() => expect(setCardAssignee).toHaveBeenCalledTimes(1));
    expect(vi.mocked(setCardAssignee).mock.calls[0][0]).toEqual({ cardId: "card-1", userId: null });
  });

  it("avisa e recarrega o time quando a pessoa escolhida saiu dele", async () => {
    vi.mocked(setCardAssignee).mockRejectedValue(
      apiError(
        422,
        "CardAssigneeOutsideProject",
        "O responsável precisa fazer parte do time do projeto.",
        { property: "assigneeId" }
      )
    );
    const { result } = renderActions();

    act(() => result.current.changeAssignee("user-2"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "O responsável precisa fazer parte do time do projeto."
      )
    );
    expect(refetchTeam).toHaveBeenCalledTimes(1);
  });

  it("avisa quando o card saiu do alcance da pessoa, sem recarregar o time", async () => {
    vi.mocked(setCardAssignee).mockRejectedValue(
      apiError(404, "CardNotFound", "Card não encontrado.")
    );
    const { result } = renderActions();

    act(() => result.current.changeAssignee("user-2"));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Card não encontrado."));
    expect(refetchTeam).not.toHaveBeenCalled();
  });
});
