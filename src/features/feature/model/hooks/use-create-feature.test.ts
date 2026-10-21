import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { featureKeys } from "../../api/feature-api-keys";
import { createFeature } from "../../api/feature.service";
import type { Feature } from "../types/feature.types";
import { useCreateFeature } from "./use-create-feature";

vi.mock("../../api/feature.service");
vi.mock("../../api/epic.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const createdFeature: Feature = {
  id: "feature-9",
  projectId: "project-1",
  epicId: "epic-1",
  title: "Filtros da lista",
  description: "",
  progress: 0,
  state: "to_do",
  cardCount: 0,
};
const onCreated = vi.fn();

function renderCreateFeature(epicId: string | null) {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(
    () => useCreateFeature({ projectId: "project-1", epicId, onCreated }),
    { wrapper }
  );

  return { result, invalidateQueries };
}

async function submit(result: ReturnType<typeof renderCreateFeature>["result"], title: string) {
  await act(async () => {
    result.current.form.reset({ title, description: "" });
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(createFeature).mockReset().mockResolvedValue(createdFeature);
  vi.mocked(toast.error).mockClear();
  onCreated.mockClear();
});

describe("useCreateFeature", () => {
  it("cria a feature no projeto, dentro do epic de onde a criação partiu, e entrega a feature criada", async () => {
    const { result, invalidateQueries } = renderCreateFeature("epic-1");

    await submit(result, " Filtros da lista ");

    expect(vi.mocked(createFeature).mock.calls[0][0]).toEqual({
      projectId: "project-1",
      epicId: "epic-1",
      title: "Filtros da lista",
      description: "",
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: featureKeys.all });
    expect(onCreated).toHaveBeenCalledWith(createdFeature);
  });

  it("cria a feature sem epic", async () => {
    const { result } = renderCreateFeature(null);

    await submit(result, "Board");

    expect(vi.mocked(createFeature).mock.calls[0][0]).toMatchObject({ epicId: null });
  });

  it("avisa que o projeto chegou a 500 features e recarrega a lista", async () => {
    vi.mocked(createFeature).mockRejectedValue(
      apiError(422, "FeatureLimitReached", "O projeto já tem o máximo de 500 features.")
    );
    const { result, invalidateQueries } = renderCreateFeature(null);

    await submit(result, "Board");

    expect(toast.error).toHaveBeenCalledWith("O projeto já tem o máximo de 500 features.");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: featureKeys.all });
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("avisa quando o epic foi excluído enquanto a feature era escrita", async () => {
    vi.mocked(createFeature).mockRejectedValue(
      apiError(422, "FeatureEpicInvalid", "Este epic não existe no projeto da feature.", {
        property: "epicId",
      })
    );
    const { result } = renderCreateFeature("epic-1");

    await submit(result, "Board");

    expect(result.current.epicError).toBe("Este epic não existe no projeto da feature.");
    expect(toast.error).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });
});
