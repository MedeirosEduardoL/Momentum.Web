import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListFeatures } from "@/features/feature";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardKeys } from "../../api/card-api-keys";
import { setCardFeature, updateCard } from "../../api/card.service";
import type { Card } from "../types/card.types";
import { useCardFeature } from "./use-card-feature";

vi.mock("../../api/card.service");
vi.mock("../../api/card-task.service");
vi.mock("../../api/card-relation.service");
vi.mock("@/features/feature", () => ({ useListFeatures: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type FeaturesResult = ReturnType<typeof useListFeatures>;

const card: Card = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "tech_debt",
  title: "Pagar a dívida do build",
  state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  priority: "medium",
  assignee: null,
  featureId: "feature-1",
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
const refetchFeatures = vi.fn<FeaturesResult["refetch"]>();
const refetch: FeaturesResult["refetch"] = refetchFeatures;
const features = { data: [], refetch } as unknown as FeaturesResult;

function renderCardFeature(shownCard = card) {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useCardFeature(shownCard), { wrapper });

  return { result, invalidateQueries };
}

function neverSettles<TResult>() {
  return new Promise<TResult>(() => {});
}

beforeEach(() => {
  vi.mocked(setCardFeature).mockReset().mockResolvedValue(undefined);
  vi.mocked(updateCard).mockReset();
  vi.mocked(toast.error).mockClear();
  refetchFeatures.mockReset();
  vi.mocked(useListFeatures).mockReturnValue(features);
});

describe("useCardFeature", () => {
  it("mostra a feature do card e entrega as features do projeto dele", () => {
    const { result } = renderCardFeature();

    expect(result.current.selectedFeatureId).toBe("feature-1");
    expect(result.current.features).toBe(features);
    expect(useListFeatures).toHaveBeenCalledWith("project-1");
    expect(result.current.isBusy).toBe(false);
  });

  it("mostra o card sem feature com o valor vazio", () => {
    const { result } = renderCardFeature({ ...card, featureId: null });

    expect(result.current.selectedFeatureId).toBe("");
  });

  it("põe o card na feature pela rota própria e recarrega as consultas de card", async () => {
    const { result, invalidateQueries } = renderCardFeature();

    act(() => result.current.changeFeature("feature-2"));

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all }));
    expect(vi.mocked(setCardFeature).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      featureId: "feature-2",
    });
    expect(updateCard).not.toHaveBeenCalled();
  });

  it("tira o card da feature quando a escolha é sem feature", async () => {
    const { result } = renderCardFeature();

    act(() => result.current.changeFeature(""));

    await waitFor(() => expect(setCardFeature).toHaveBeenCalledTimes(1));
    expect(vi.mocked(setCardFeature).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      featureId: null,
    });
  });

  it("mostra a feature pedida e trava o seletor enquanto a mudança corre", async () => {
    vi.mocked(setCardFeature).mockReturnValue(neverSettles());
    const { result } = renderCardFeature();

    act(() => result.current.changeFeature(""));

    await waitFor(() => expect(result.current.isBusy).toBe(true));
    expect(result.current.selectedFeatureId).toBe("");
  });

  it("avisa e recarrega as features quando a escolhida deixou de existir no projeto", async () => {
    vi.mocked(setCardFeature).mockRejectedValue(
      apiError(422, "CardFeatureInvalid", "Esta feature não existe no projeto do card.", {
        property: "featureId",
      })
    );
    const { result } = renderCardFeature();

    act(() => result.current.changeFeature("feature-9"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Esta feature não existe no projeto do card.")
    );
    expect(refetchFeatures).toHaveBeenCalledTimes(1);
    expect(result.current.selectedFeatureId).toBe("feature-1");
  });

  it("avisa quando o card saiu do alcance da pessoa, sem recarregar as features", async () => {
    vi.mocked(setCardFeature).mockRejectedValue(
      apiError(404, "CardNotFound", "Card não encontrado.")
    );
    const { result } = renderCardFeature();

    act(() => result.current.changeFeature("feature-2"));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Card não encontrado."));
    expect(refetchFeatures).not.toHaveBeenCalled();
  });

  it("mostra a falha de rede sem quebrar a tela", async () => {
    vi.mocked(setCardFeature).mockRejectedValue(networkFailure);
    const { result } = renderCardFeature();

    act(() => result.current.changeFeature("feature-2"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
      )
    );
  });
});
