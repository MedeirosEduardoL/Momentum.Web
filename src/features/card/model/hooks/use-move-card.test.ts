import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardKeys } from "../../api/card-api-keys";
import { setCardAssignee, updateCard } from "../../api/card.service";
import type { Card, CardAssignee, CardSummary } from "../types/card.types";
import { useMoveCard } from "./use-move-card";

vi.mock("../../api/card.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const card: CardSummary = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "issue",
  title: "Lista de chamados vazia",
  state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  priority: "high",
  assignee: null,
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
};
const ana: CardAssignee = { userId: "user-1", name: "Ana Souza" };
const onMoved = vi.fn<() => Promise<unknown>>();

function renderMove() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useMoveCard(onMoved), { wrapper });

  return { result, invalidateQueries };
}

function deferred<TResult>() {
  let resolve: (value: TResult) => void = () => {};
  const promise = new Promise<TResult>(resolver => {
    resolve = resolver;
  });

  return { promise, resolve };
}

beforeEach(() => {
  vi.mocked(updateCard)
    .mockReset()
    .mockResolvedValue({} as Card);
  vi.mocked(setCardAssignee).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  onMoved.mockReset().mockResolvedValue(undefined);
});

describe("useMoveCard", () => {
  it("muda só o estado do card e recarrega as colunas", async () => {
    const { result, invalidateQueries } = renderMove();

    await act(() => result.current.move(card, { cardStateId: "state-2" }));

    expect(updateCard).toHaveBeenCalledTimes(1);
    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      cardStateId: "state-2",
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
    expect(onMoved).toHaveBeenCalledTimes(1);
    expect(result.current.pendingMove).toBeNull();
    expect(toast.error).not.toHaveBeenCalled();
    expect(setCardAssignee).not.toHaveBeenCalled();
  });

  it("muda o estado e depois o responsável, pela rota própria, quando o card vai para a raia de outra pessoa", async () => {
    const { result } = renderMove();

    await act(() => result.current.move(card, { cardStateId: "state-2", assignee: ana }));

    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      cardStateId: "state-2",
    });
    expect(vi.mocked(setCardAssignee).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      userId: "user-1",
    });
    expect(vi.mocked(updateCard).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(setCardAssignee).mock.invocationCallOrder[0]
    );
    expect(onMoved).toHaveBeenCalledTimes(1);
  });

  it("muda só o responsável quando o card fica no mesmo estado, em outra raia", async () => {
    const { result } = renderMove();

    await act(() => result.current.move(card, { cardStateId: "state-1", assignee: ana }));

    expect(updateCard).not.toHaveBeenCalled();
    expect(vi.mocked(setCardAssignee).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      userId: "user-1",
    });
    expect(onMoved).toHaveBeenCalledTimes(1);
  });

  it("tira o responsável quando o card vai para a raia sem responsável", async () => {
    const { result } = renderMove();

    await act(() =>
      result.current.move({ ...card, assignee: ana }, { cardStateId: "state-1", assignee: null })
    );

    expect(vi.mocked(setCardAssignee).mock.calls[0][0]).toEqual({ cardId: "card-1", userId: null });
  });

  it("mostra o card na raia nova até as colunas voltarem", async () => {
    const reload = deferred<unknown>();
    onMoved.mockReturnValue(reload.promise);
    const { result } = renderMove();

    let moving = Promise.resolve();
    act(() => {
      moving = result.current.move(card, { cardStateId: "state-1", assignee: ana });
    });

    await waitFor(() => expect(onMoved).toHaveBeenCalledTimes(1));
    expect(result.current.pendingMove).toEqual({
      cardId: "card-1",
      cardStateId: "state-1",
      assignee: ana,
    });

    await act(async () => {
      reload.resolve(undefined);
      await moving;
    });
  });

  it("não tenta o responsável quando o Core recusa o estado", async () => {
    vi.mocked(updateCard).mockRejectedValue(
      apiError(422, "CardStateInvalid", "O estado não existe neste projeto.")
    );
    const { result } = renderMove();

    await act(() => result.current.move(card, { cardStateId: "state-2", assignee: ana }));

    expect(setCardAssignee).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("O estado não existe neste projeto.");
    expect(onMoved).toHaveBeenCalledTimes(1);
    expect(result.current.pendingMove).toBeNull();
  });

  it("mostra a mensagem do Core e recarrega as colunas quando a pessoa da raia saiu do time", async () => {
    vi.mocked(setCardAssignee).mockRejectedValue(
      apiError(
        422,
        "CardAssigneeOutsideProject",
        "O responsável precisa fazer parte do time do projeto."
      )
    );
    const { result, invalidateQueries } = renderMove();

    await act(() => result.current.move(card, { cardStateId: "state-1", assignee: ana }));

    expect(toast.error).toHaveBeenCalledWith(
      "O responsável precisa fazer parte do time do projeto."
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
    expect(onMoved).toHaveBeenCalledTimes(1);
    expect(result.current.pendingMove).toBeNull();
  });

  it("mostra o card no estado pedido até as colunas voltarem", async () => {
    const reload = deferred<unknown>();
    onMoved.mockReturnValue(reload.promise);
    const { result } = renderMove();

    let moving = Promise.resolve();
    act(() => {
      moving = result.current.move(card, { cardStateId: "state-2" });
    });

    await waitFor(() => expect(onMoved).toHaveBeenCalledTimes(1));
    expect(result.current.pendingMove).toEqual({ cardId: "card-1", cardStateId: "state-2" });

    await act(async () => {
      reload.resolve(undefined);
      await moving;
    });

    expect(result.current.pendingMove).toBeNull();
  });

  it("não chama a API quando o card já está no estado pedido", async () => {
    const { result } = renderMove();

    await act(() => result.current.move(card, { cardStateId: "state-1" }));

    expect(updateCard).not.toHaveBeenCalled();
    expect(onMoved).not.toHaveBeenCalled();
  });

  it("não chama a API quando o card já está no estado e na raia pedidos", async () => {
    const { result } = renderMove();

    await act(() => result.current.move(card, { cardStateId: "state-1", assignee: null }));

    expect(updateCard).not.toHaveBeenCalled();
    expect(setCardAssignee).not.toHaveBeenCalled();
    expect(onMoved).not.toHaveBeenCalled();
  });

  it("não começa outro movimento enquanto um ainda corre", async () => {
    const reload = deferred<unknown>();
    onMoved.mockReturnValue(reload.promise);
    const { result } = renderMove();

    let moving = Promise.resolve();
    act(() => {
      moving = result.current.move(card, { cardStateId: "state-2" });
    });
    await waitFor(() => expect(result.current.pendingMove).not.toBeNull());

    await act(() => result.current.move({ ...card, id: "card-2" }, { cardStateId: "state-3" }));

    expect(updateCard).toHaveBeenCalledTimes(1);

    await act(async () => {
      reload.resolve(undefined);
      await moving;
    });
  });

  it("desfaz o movimento, recarrega as colunas e pede para mover de novo no 409", async () => {
    vi.mocked(updateCard).mockRejectedValue(
      apiError(409, "CardChangedMeanwhile", "O card foi alterado por outra pessoa. Recarregue.")
    );
    const { result } = renderMove();

    await act(() => result.current.move(card, { cardStateId: "state-2" }));

    expect(toast.error).toHaveBeenCalledWith(
      "O card foi alterado por outra pessoa. O board mostra a versão atual: confira e mova de novo."
    );
    expect(onMoved).toHaveBeenCalledTimes(1);
    expect(result.current.pendingMove).toBeNull();
  });

  it("mostra a mensagem do Core quando o estado deixou de existir", async () => {
    vi.mocked(updateCard).mockRejectedValue(
      apiError(422, "CardStateInvalid", "O estado não existe neste projeto.")
    );
    const { result } = renderMove();

    await act(() => result.current.move(card, { cardStateId: "state-2" }));

    expect(toast.error).toHaveBeenCalledWith("O estado não existe neste projeto.");
    expect(onMoved).toHaveBeenCalledTimes(1);
    expect(result.current.pendingMove).toBeNull();
  });

  it("desfaz o movimento e mostra a falha de rede", async () => {
    vi.mocked(updateCard).mockRejectedValue(networkFailure);
    const { result } = renderMove();

    await act(() => result.current.move(card, { cardStateId: "state-2" }));

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(onMoved).toHaveBeenCalledTimes(1);
    expect(result.current.pendingMove).toBeNull();
  });
});
