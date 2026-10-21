import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { deleteEpic } from "../../api/epic.service";
import { featureKeys } from "../../api/feature-api-keys";
import { deleteFeature } from "../../api/feature.service";
import type { EpicSummary, FeatureSummary } from "../types/feature.types";
import { useHierarchyRemoval } from "./use-hierarchy-removal";

vi.mock("../../api/feature.service");
vi.mock("../../api/epic.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const feature: FeatureSummary = {
  id: "feature-1",
  projectId: "project-1",
  epicId: "epic-1",
  title: "Filtros da lista",
  progress: 40,
  state: "in_progress",
  cardCount: 3,
};

const epic: EpicSummary = {
  id: "epic-1",
  projectId: "project-1",
  title: "Lista de cards",
  progress: 25,
  state: "in_progress",
  featureCount: 2,
  cardCount: 8,
};

const CARD_QUERY_KEY = ["card", "detail", "card-1"];

function renderRemoval() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useHierarchyRemoval(), { wrapper });

  return { result, queryClient, invalidateQueries };
}

beforeEach(() => {
  vi.mocked(deleteFeature).mockReset().mockResolvedValue(undefined);
  vi.mocked(deleteEpic).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
});

describe("useHierarchyRemoval — feature", () => {
  it("exclui a feature e confirma na tela", async () => {
    const { result } = renderRemoval();

    await act(() => result.current.removeFeature(feature));

    expect(vi.mocked(deleteFeature).mock.calls[0][0]).toBe("feature-1");
    expect(toast.success).toHaveBeenCalledWith("A feature Filtros da lista foi excluída.");
  });

  it("recarrega tudo, porque os cards da feature ficam sem feature", async () => {
    const { result, queryClient, invalidateQueries } = renderRemoval();
    queryClient.setQueryData(CARD_QUERY_KEY, { featureId: "feature-1" });

    await act(() => result.current.removeFeature(feature));

    expect(invalidateQueries).toHaveBeenCalledWith();
    expect(queryClient.getQueryState(CARD_QUERY_KEY)?.isInvalidated).toBe(true);
  });

  it("esquece a leitura guardada da feature excluída", async () => {
    const { result, queryClient } = renderRemoval();
    queryClient.setQueryData(featureKeys.byId("feature-1"), feature);
    queryClient.setQueryData(featureKeys.byId("feature-2"), { ...feature, id: "feature-2" });

    await act(() => result.current.removeFeature(feature));

    expect(queryClient.getQueryData(featureKeys.byId("feature-1"))).toBeUndefined();
    expect(queryClient.getQueryData(featureKeys.byId("feature-2"))).toBeDefined();
  });

  it("mostra a mensagem do Core e mantém a leitura guardada quando a exclusão falha", async () => {
    vi.mocked(deleteFeature).mockRejectedValue(
      apiError(404, "FeatureNotFound", "Feature não encontrada.")
    );
    const { result, queryClient, invalidateQueries } = renderRemoval();
    queryClient.setQueryData(featureKeys.byId("feature-1"), feature);

    await act(() => result.current.removeFeature(feature));

    expect(toast.error).toHaveBeenCalledWith("Feature não encontrada.");
    expect(toast.success).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(featureKeys.byId("feature-1"))).toBeDefined();
    expect(invalidateQueries).toHaveBeenCalledWith();
  });
});

describe("useHierarchyRemoval — epic", () => {
  it("exclui o epic, confirma na tela e recarrega epics e features", async () => {
    const { result, invalidateQueries } = renderRemoval();

    await act(() => result.current.removeEpic(epic));

    expect(vi.mocked(deleteEpic).mock.calls[0][0]).toBe("epic-1");
    expect(toast.success).toHaveBeenCalledWith("O epic Lista de cards foi excluído.");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: featureKeys.all });
  });

  it("esquece a leitura guardada do epic excluído", async () => {
    const { result, queryClient } = renderRemoval();
    queryClient.setQueryData(featureKeys.epicById("epic-1"), epic);

    await act(() => result.current.removeEpic(epic));

    expect(queryClient.getQueryData(featureKeys.epicById("epic-1"))).toBeUndefined();
  });

  it("mostra a mensagem do Core quando a exclusão do epic falha", async () => {
    vi.mocked(deleteEpic).mockRejectedValue(apiError(404, "EpicNotFound", "Epic não encontrado."));
    const { result } = renderRemoval();

    await act(() => result.current.removeEpic(epic));

    expect(toast.error).toHaveBeenCalledWith("Epic não encontrado.");
    expect(toast.success).not.toHaveBeenCalled();
  });
});
