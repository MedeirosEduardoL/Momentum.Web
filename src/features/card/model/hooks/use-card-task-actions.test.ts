import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListProjectMembers } from "@/features/project";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardKeys } from "../../api/card-api-keys";
import { deleteCardTask, setCardTaskAssignee, updateCardTask } from "../../api/card-task.service";
import type { CardTask } from "../types/card.types";
import { useCardTaskActions } from "./use-card-task-actions";

vi.mock("../../api/card.service");
vi.mock("../../api/card-task.service");
vi.mock("../../api/card-relation.service");
vi.mock("@/features/project", () => ({ useListProjectMembers: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

type TeamResult = ReturnType<typeof useListProjectMembers>;

const task: CardTask = {
  id: "task-1",
  cardId: "card-1",
  kind: "task",
  title: "Escrever o teste do filtro",
  description: "",
  state: "to_do",
  assignee: { userId: "user-1", name: "Ana Souza" },
  updatedAt: "2026-10-13T12:00:00Z",
};
const otherTask: CardTask = { ...task, id: "task-2", title: "Revisar", assignee: null };
const refetchTeam = vi.fn<TeamResult["refetch"]>();
const refetch: TeamResult["refetch"] = refetchTeam;

function renderActions() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useCardTaskActions("project-1"), { wrapper });

  return { result, invalidateQueries };
}

function neverSettles<TResult>() {
  return new Promise<TResult>(() => {});
}

beforeEach(() => {
  vi.mocked(updateCardTask).mockReset().mockResolvedValue(task);
  vi.mocked(setCardTaskAssignee).mockReset().mockResolvedValue(undefined);
  vi.mocked(deleteCardTask).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
  refetchTeam.mockReset();
  vi.mocked(useListProjectMembers).mockReturnValue({ data: [], refetch } as unknown as TeamResult);
});

describe("useCardTaskActions — o que a linha mostra", () => {
  it("mostra o estado e o responsável da task", () => {
    const { result } = renderActions();

    expect(result.current.selectedOf(task)).toEqual({ state: "to_do", assigneeId: "user-1" });
    expect(result.current.selectedOf(otherTask)).toEqual({ state: "to_do", assigneeId: "" });
    expect(result.current.isBusy).toBe(false);
  });

  it("mostra o estado pedido só na task que está mudando, e trava as ações", async () => {
    vi.mocked(updateCardTask).mockReturnValue(neverSettles());
    const { result } = renderActions();

    act(() => result.current.changeState(task, "done"));

    await waitFor(() => expect(result.current.isBusy).toBe(true));
    expect(result.current.selectedOf(task).state).toBe("done");
    expect(result.current.selectedOf(otherTask).state).toBe("to_do");
  });

  it("mostra a task sem responsável enquanto a retirada corre", async () => {
    vi.mocked(setCardTaskAssignee).mockReturnValue(neverSettles());
    const { result } = renderActions();

    act(() => result.current.changeAssignee(task, ""));

    await waitFor(() => expect(result.current.isBusy).toBe(true));
    expect(result.current.selectedOf(task).assigneeId).toBe("");
  });
});

describe("useCardTaskActions — estado", () => {
  it("muda só o estado da task e recarrega as consultas de card, que trazem o progresso", async () => {
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeState(task, "done"));

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all }));
    expect(vi.mocked(updateCardTask).mock.calls[0][0]).toEqual({
      cardTaskId: "task-1",
      state: "done",
    });
  });

  it("avisa quando a task foi excluída por outra pessoa e recarrega a lista", async () => {
    vi.mocked(updateCardTask).mockRejectedValue(
      apiError(404, "CardTaskNotFound", "Task não encontrada.")
    );
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeState(task, "done"));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Task não encontrada."));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
    expect(refetchTeam).not.toHaveBeenCalled();
  });

  it("mostra a falha de rede e volta ao estado que a task tem", async () => {
    vi.mocked(updateCardTask).mockRejectedValue(networkFailure);
    const { result } = renderActions();

    act(() => result.current.changeState(task, "done"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
      )
    );
    expect(result.current.selectedOf(task).state).toBe("to_do");
  });
});

describe("useCardTaskActions — responsável", () => {
  it("define o responsável da task pela rota própria", async () => {
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeAssignee(otherTask, "user-2"));

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all }));
    expect(vi.mocked(setCardTaskAssignee).mock.calls[0][0]).toEqual({
      cardTaskId: "task-2",
      userId: "user-2",
    });
    expect(updateCardTask).not.toHaveBeenCalled();
  });

  it("tira o responsável quando a escolha é sem responsável", async () => {
    const { result } = renderActions();

    act(() => result.current.changeAssignee(task, ""));

    await waitFor(() => expect(setCardTaskAssignee).toHaveBeenCalledTimes(1));
    expect(vi.mocked(setCardTaskAssignee).mock.calls[0][0]).toEqual({
      cardTaskId: "task-1",
      userId: null,
    });
  });

  it("avisa e recarrega o time quando a pessoa escolhida saiu dele", async () => {
    vi.mocked(setCardTaskAssignee).mockRejectedValue(
      apiError(
        422,
        "CardAssigneeOutsideProject",
        "O responsável precisa fazer parte do time do projeto.",
        { property: "assigneeId" }
      )
    );
    const { result } = renderActions();

    act(() => result.current.changeAssignee(task, "user-9"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "O responsável precisa fazer parte do time do projeto."
      )
    );
    expect(refetchTeam).toHaveBeenCalledTimes(1);
  });
});

describe("useCardTaskActions — excluir", () => {
  it("exclui a task, confirma na tela e recarrega as consultas de card", async () => {
    const { result, invalidateQueries } = renderActions();

    await act(() => result.current.remove(task));

    expect(vi.mocked(deleteCardTask).mock.calls[0][0]).toBe("task-1");
    expect(toast.success).toHaveBeenCalledWith("Subitem excluído.");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
  });

  it("mostra a mensagem do Core quando a exclusão falha", async () => {
    vi.mocked(deleteCardTask).mockRejectedValue(
      apiError(404, "CardTaskNotFound", "Task não encontrada.")
    );
    const { result } = renderActions();

    await act(() => result.current.remove(task));

    expect(toast.error).toHaveBeenCalledWith("Task não encontrada.");
    expect(toast.success).not.toHaveBeenCalled();
  });
});
