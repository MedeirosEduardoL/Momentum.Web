import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { createEpic } from "../../api/epic.service";
import { featureKeys } from "../../api/feature-api-keys";
import type { Epic } from "../types/feature.types";
import { useCreateEpic } from "./use-create-epic";

vi.mock("../../api/feature.service");
vi.mock("../../api/epic.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const createdEpic: Epic = {
  id: "epic-9",
  projectId: "project-1",
  title: "Lista de cards",
  description: "",
  progress: 0,
  state: "to_do",
  featureCount: 0,
  cardCount: 0,
};
const onCreated = vi.fn();

function renderCreateEpic() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useCreateEpic({ projectId: "project-1", onCreated }), {
    wrapper,
  });

  return { result, invalidateQueries };
}

async function submit(result: ReturnType<typeof renderCreateEpic>["result"]) {
  await act(async () => {
    result.current.form.reset({ title: " Lista de cards ", description: "Para a v1.0.0." });
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(createEpic).mockReset().mockResolvedValue(createdEpic);
  vi.mocked(toast.error).mockClear();
  onCreated.mockClear();
});

describe("useCreateEpic", () => {
  it("cria o epic no projeto, recarrega epics e features e entrega o epic criado", async () => {
    const { result, invalidateQueries } = renderCreateEpic();

    await submit(result);

    expect(vi.mocked(createEpic).mock.calls[0][0]).toEqual({
      projectId: "project-1",
      title: "Lista de cards",
      description: "Para a v1.0.0.",
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: featureKeys.all });
    expect(onCreated).toHaveBeenCalledWith(createdEpic);
  });

  it("avisa que o projeto chegou a 100 epics", async () => {
    vi.mocked(createEpic).mockRejectedValue(
      apiError(422, "EpicLimitReached", "O projeto já tem o máximo de 100 epics.")
    );
    const { result } = renderCreateEpic();

    await submit(result);

    expect(toast.error).toHaveBeenCalledWith("O projeto já tem o máximo de 100 epics.");
    expect(onCreated).not.toHaveBeenCalled();
  });
});
