import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { featureKeys } from "../../api/feature-api-keys";
import { updateFeature } from "../../api/feature.service";
import type { Feature } from "../types/feature.types";
import { useEditFeature } from "./use-edit-feature";

vi.mock("../../api/feature.service");
vi.mock("../../api/epic.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const feature: Feature = {
  id: "feature-1",
  projectId: "project-1",
  epicId: "epic-1",
  title: "Filtros da lista",
  description: "Por tipo.",
  progress: 40,
  state: "in_progress",
  cardCount: 3,
};
const onSaved = vi.fn();

function renderEditFeature() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useEditFeature({ feature, onSaved }), { wrapper });

  return { result, invalidateQueries };
}

beforeEach(() => {
  vi.mocked(updateFeature).mockReset().mockResolvedValue(feature);
  vi.mocked(toast.error).mockClear();
  onSaved.mockClear();
});

describe("useEditFeature", () => {
  it("começa com o título e a descrição da feature", () => {
    const { result } = renderEditFeature();

    expect(result.current.form.getValues()).toEqual({
      title: "Filtros da lista",
      description: "Por tipo.",
    });
  });

  it("grava só o título e a descrição, com a descrição apagada como texto vazio", async () => {
    const { result, invalidateQueries } = renderEditFeature();

    await act(async () => {
      result.current.form.reset({ title: "Filtros", description: "" });
      await result.current.onSubmit();
    });

    expect(vi.mocked(updateFeature).mock.calls[0][0]).toEqual({
      featureId: "feature-1",
      title: "Filtros",
      description: "",
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: featureKeys.all });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("avisa quando a feature foi excluída por outra pessoa", async () => {
    vi.mocked(updateFeature).mockRejectedValue(
      apiError(404, "FeatureNotFound", "Feature não encontrada.")
    );
    const { result } = renderEditFeature();

    await act(() => result.current.onSubmit());

    expect(toast.error).toHaveBeenCalledWith("Feature não encontrada.");
    expect(onSaved).not.toHaveBeenCalled();
  });
});
