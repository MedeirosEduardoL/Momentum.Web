import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardKeys } from "../../api/card-api-keys";
import { deleteCardRelation } from "../../api/card-relation.service";
import type { CardRelation } from "../types/card.types";
import { useRemoveCardRelation } from "./use-remove-card-relation";

vi.mock("../../api/card.service");
vi.mock("../../api/card-task.service");
vi.mock("../../api/card-relation.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const relation: CardRelation = {
  id: "relation-1",
  relation: "blocks",
  card: {
    id: "card-2",
    identifier: "SUP-7",
    type: "issue",
    title: "Lista de chamados vazia",
    stateName: "Novo",
  },
};

function renderRemoval() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useRemoveCardRelation(), { wrapper });

  return { result, invalidateQueries };
}

beforeEach(() => {
  vi.mocked(deleteCardRelation).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
});

describe("useRemoveCardRelation", () => {
  it("desfaz a relação, confirma na tela e recarrega as consultas de card", async () => {
    const { result, invalidateQueries } = renderRemoval();

    await act(() => result.current(relation));

    expect(vi.mocked(deleteCardRelation).mock.calls[0][0]).toBe("relation-1");
    expect(toast.success).toHaveBeenCalledWith("A relação com SUP-7 foi desfeita.");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
  });

  it("mostra a mensagem do Core quando a relação já tinha sido desfeita", async () => {
    vi.mocked(deleteCardRelation).mockRejectedValue(
      apiError(404, "CardRelationNotFound", "Relação não encontrada.")
    );
    const { result, invalidateQueries } = renderRemoval();

    await act(() => result.current(relation));

    expect(toast.error).toHaveBeenCalledWith("Relação não encontrada.");
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
  });
});
