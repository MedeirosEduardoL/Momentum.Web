import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { updateEpic } from "../../api/epic.service";
import { featureKeys } from "../../api/feature-api-keys";
import type { Epic } from "../types/feature.types";
import { useEditEpic } from "./use-edit-epic";

vi.mock("../../api/feature.service");
vi.mock("../../api/epic.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const epic: Epic = {
  id: "epic-1",
  projectId: "project-1",
  title: "Lista de cards",
  description: "Para a v1.0.0.",
  progress: 25,
  state: "in_progress",
  featureCount: 2,
  cardCount: 8,
};
const onSaved = vi.fn();

function renderEditEpic() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useEditEpic({ epic, onSaved }), { wrapper });

  return { result, invalidateQueries };
}

beforeEach(() => {
  vi.mocked(updateEpic).mockReset().mockResolvedValue(epic);
  vi.mocked(toast.error).mockClear();
  onSaved.mockClear();
});

describe("useEditEpic", () => {
  it("começa com o título e a descrição do epic", () => {
    const { result } = renderEditEpic();

    expect(result.current.form.getValues()).toEqual({
      title: "Lista de cards",
      description: "Para a v1.0.0.",
    });
  });

  it("grava só o título e a descrição do epic", async () => {
    const { result, invalidateQueries } = renderEditEpic();

    await act(async () => {
      result.current.form.reset({ title: "Listas", description: "Para a v1.1.0." });
      await result.current.onSubmit();
    });

    expect(vi.mocked(updateEpic).mock.calls[0][0]).toEqual({
      epicId: "epic-1",
      title: "Listas",
      description: "Para a v1.1.0.",
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: featureKeys.all });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("avisa quando o epic foi excluído por outra pessoa", async () => {
    vi.mocked(updateEpic).mockRejectedValue(apiError(404, "EpicNotFound", "Epic não encontrado."));
    const { result } = renderEditEpic();

    await act(() => result.current.onSubmit());

    expect(toast.error).toHaveBeenCalledWith("Epic não encontrado.");
    expect(onSaved).not.toHaveBeenCalled();
  });
});
