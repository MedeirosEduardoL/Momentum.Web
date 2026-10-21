import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { createCardState, deleteCardState, updateCardState } from "../../api/card.service";
import type { CardState } from "../types/card.types";
import { useCardStateSettings } from "./use-card-state-settings";

vi.mock("../../api/card.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const state: CardState = {
  id: "state-2",
  name: "Em andamento",
  category: "in_progress",
  position: 2,
};

function renderSettings() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useCardStateSettings("project-1"), { wrapper });

  return { result, invalidateQueries };
}

async function submit(result: ReturnType<typeof renderSettings>["result"]) {
  await act(async () => {
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(createCardState).mockReset().mockResolvedValue(state);
  vi.mocked(updateCardState).mockReset().mockResolvedValue(state);
  vi.mocked(deleteCardState).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
});

describe("useCardStateSettings", () => {
  it("cria o estado no projeto, fecha o formulário e relê tudo, porque os boards mostram os estados", async () => {
    const { result, invalidateQueries } = renderSettings();
    act(() => result.current.startNew());
    act(() => result.current.form.setValue("name", " Em revisão "));

    await submit(result);

    expect(vi.mocked(createCardState).mock.calls[0][0]).toEqual({
      projectId: "project-1",
      name: "Em revisão",
      category: "in_progress",
    });
    expect(result.current.editing).toBeNull();
    expect(invalidateQueries).toHaveBeenCalledWith();
  });

  it("abre a edição com o nome e a categoria do estado e grava no mesmo estado", async () => {
    const { result } = renderSettings();
    act(() => result.current.startEditing(state));
    act(() => result.current.form.setValue("category", "done"));

    await submit(result);

    expect(vi.mocked(updateCardState).mock.calls[0][0]).toEqual({
      cardStateId: "state-2",
      name: "Em andamento",
      category: "done",
    });
    expect(createCardState).not.toHaveBeenCalled();
  });

  it("mantém o formulário aberto e põe no nome a recusa de nome repetido", async () => {
    vi.mocked(createCardState).mockRejectedValue(
      apiError(409, "CardStateNameAlreadyUsed", "Já existe um estado com esse nome no projeto.", {
        property: "name",
      })
    );
    const { result } = renderSettings();
    act(() => result.current.startNew());
    act(() => result.current.form.setValue("name", "Novo"));

    await submit(result);

    expect(result.current.editing).toEqual({ kind: "new" });
    expect(result.current.form.getFieldState("name").error?.message).toBe(
      "Já existe um estado com esse nome no projeto."
    );
  });

  it("muda só a posição ao subir ou descer o estado", async () => {
    const { result } = renderSettings();

    await act(() => result.current.move(state, 1));

    expect(vi.mocked(updateCardState).mock.calls[0][0]).toEqual({
      cardStateId: "state-2",
      position: 1,
    });
  });

  it("avisa quando o Core recusa excluir o último estado", async () => {
    vi.mocked(deleteCardState).mockRejectedValue(
      apiError(409, "CardStateLastOne", "O projeto precisa de pelo menos um estado.")
    );
    const { result } = renderSettings();

    await act(() => result.current.remove(state));

    expect(vi.mocked(deleteCardState).mock.calls[0][0]).toBe("state-2");
    expect(toast.error).toHaveBeenCalledWith("O projeto precisa de pelo menos um estado.");
  });
});
