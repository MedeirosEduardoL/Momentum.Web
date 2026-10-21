import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { featureKeys } from "../../api/feature-api-keys";
import { setFeatureEpic } from "../../api/feature.service";
import type { FeatureSummary } from "../types/feature.types";
import { useFeatureEpic } from "./use-feature-epic";

vi.mock("../../api/feature.service");
vi.mock("../../api/epic.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const feature: FeatureSummary = {
  id: "feature-1",
  projectId: "project-1",
  epicId: "epic-1",
  title: "Filtros da lista",
  progress: 40,
  state: "in_progress",
  cardCount: 3,
};

function renderFeatureEpic(shownFeature = feature) {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useFeatureEpic(shownFeature), { wrapper });

  return { result, invalidateQueries };
}

function neverSettles<TResult>() {
  return new Promise<TResult>(() => {});
}

beforeEach(() => {
  vi.mocked(setFeatureEpic).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
});

describe("useFeatureEpic", () => {
  it("mostra o epic da feature", () => {
    const { result } = renderFeatureEpic();

    expect(result.current.selectedEpicId).toBe("epic-1");
    expect(result.current.isBusy).toBe(false);
  });

  it("mostra a feature sem epic com o valor vazio", () => {
    const { result } = renderFeatureEpic({ ...feature, epicId: null });

    expect(result.current.selectedEpicId).toBe("");
  });

  it("põe a feature no epic escolhido e recarrega epics e features", async () => {
    const { result, invalidateQueries } = renderFeatureEpic();

    act(() => result.current.changeEpic("epic-2"));

    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: featureKeys.all })
    );
    expect(vi.mocked(setFeatureEpic).mock.calls[0][0]).toEqual({
      featureId: "feature-1",
      epicId: "epic-2",
    });
  });

  it("tira a feature do epic quando a escolha é sem epic", async () => {
    const { result } = renderFeatureEpic();

    act(() => result.current.changeEpic(""));

    await waitFor(() => expect(setFeatureEpic).toHaveBeenCalledTimes(1));
    expect(vi.mocked(setFeatureEpic).mock.calls[0][0]).toEqual({
      featureId: "feature-1",
      epicId: null,
    });
  });

  it("mostra o epic pedido e trava o seletor enquanto a mudança corre", async () => {
    vi.mocked(setFeatureEpic).mockReturnValue(neverSettles());
    const { result } = renderFeatureEpic();

    act(() => result.current.changeEpic(""));

    await waitFor(() => expect(result.current.isBusy).toBe(true));
    expect(result.current.selectedEpicId).toBe("");
  });

  it("mostra a mensagem do Core e recarrega os epics quando o epic deixou de existir", async () => {
    vi.mocked(setFeatureEpic).mockRejectedValue(
      apiError(422, "FeatureEpicInvalid", "Este epic não existe no projeto da feature.", {
        property: "epicId",
      })
    );
    const { result, invalidateQueries } = renderFeatureEpic();

    act(() => result.current.changeEpic("epic-9"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Este epic não existe no projeto da feature.")
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: featureKeys.all });
    expect(result.current.selectedEpicId).toBe("epic-1");
  });

  it("mostra a falha de rede sem quebrar a tela", async () => {
    vi.mocked(setFeatureEpic).mockRejectedValue(networkFailure);
    const { result } = renderFeatureEpic();

    act(() => result.current.changeEpic("epic-2"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
      )
    );
  });
});
