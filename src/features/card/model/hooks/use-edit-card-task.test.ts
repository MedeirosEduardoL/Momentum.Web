import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardKeys } from "../../api/card-api-keys";
import { listCardTasks, updateCardTask } from "../../api/card-task.service";
import type { CardTask } from "../types/card.types";
import { useEditCardTask } from "./use-edit-card-task";

vi.mock("../../api/card.service");
vi.mock("../../api/card-task.service");
vi.mock("../../api/card-relation.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const bug: CardTask = {
  id: "task-1",
  cardId: "card-1",
  kind: "bug",
  title: "Filtro ignora acento",
  description: "1. Buscar por *São*",
  state: "to_do",
  assignee: null,
  updatedAt: "2026-10-20T10:00:00Z",
};
const bugChangedByAnotherPerson: CardTask = {
  ...bug,
  description: "1. Buscar por *São Paulo*",
  updatedAt: "2026-10-20T10:05:00Z",
};
const changedMeanwhile = apiError(
  409,
  "CardTaskChangedMeanwhile",
  "O subitem foi alterado por outra pessoa enquanto você editava. Recarregue e tente de novo."
);
const onSaved = vi.fn();

function renderEditTask() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useEditCardTask({ task: bug, onSaved }), { wrapper });

  return { result, invalidateQueries };
}

type EditTask = ReturnType<typeof renderEditTask>["result"];

async function describeAndSubmit(result: EditTask, description: string) {
  await act(async () => {
    result.current.form.setValue("description", description);
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(listCardTasks).mockReset().mockResolvedValue([bug]);
  vi.mocked(updateCardTask).mockReset().mockResolvedValue(bug);
  vi.mocked(toast.error).mockClear();
  onSaved.mockClear();
});

describe("useEditCardTask", () => {
  it("começa com o título e a descrição do subitem", () => {
    const { result } = renderEditTask();

    expect(result.current.form.getValues()).toEqual({
      title: "Filtro ignora acento",
      description: "1. Buscar por *São*",
    });
  });

  it("grava o título e a descrição com a versão lida e recarrega o card", async () => {
    const { result, invalidateQueries } = renderEditTask();

    await describeAndSubmit(result, "1. Buscar por *Sao*");

    expect(vi.mocked(updateCardTask).mock.calls[0][0]).toEqual({
      cardTaskId: "task-1",
      title: "Filtro ignora acento",
      description: "1. Buscar por *Sao*",
      expectedUpdatedAt: "2026-10-20T10:00:00Z",
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("mantém o que foi digitado e avisa quando outra pessoa mudou o subitem", async () => {
    vi.mocked(updateCardTask).mockRejectedValue(changedMeanwhile);
    const { result } = renderEditTask();

    await describeAndSubmit(result, "Meu texto");

    expect(result.current.hasChangedMeanwhile).toBe(true);
    expect(result.current.form.getValues("description")).toBe("Meu texto");
    expect(toast.error).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("carrega a versão atual a pedido e passa a gravar com ela", async () => {
    vi.mocked(updateCardTask).mockRejectedValueOnce(changedMeanwhile);
    vi.mocked(listCardTasks).mockResolvedValue([bugChangedByAnotherPerson]);
    const { result } = renderEditTask();
    await describeAndSubmit(result, "Meu texto");

    await act(() => result.current.loadCurrentVersion());

    expect(result.current.hasChangedMeanwhile).toBe(false);
    expect(result.current.form.getValues("description")).toBe("1. Buscar por *São Paulo*");

    await describeAndSubmit(result, "1. Buscar por *São Paulo* e *Rio*");

    expect(vi.mocked(updateCardTask).mock.calls[1][0]).toMatchObject({
      expectedUpdatedAt: "2026-10-20T10:05:00Z",
    });
  });

  it("põe no campo o erro de descrição longa vinda do Core", async () => {
    vi.mocked(updateCardTask).mockRejectedValue(
      apiError(400, "CardTaskDescriptionTooLong", "A descrição passou do limite.", {
        property: "description",
      })
    );
    const { result } = renderEditTask();

    await describeAndSubmit(result, "Texto");

    expect(result.current.form.getFieldState("description").error?.message).toBe(
      "A descrição passou do limite."
    );
    expect(result.current.hasChangedMeanwhile).toBe(false);
  });
});
