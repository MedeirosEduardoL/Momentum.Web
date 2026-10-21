import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, networkFailure } from "@/test/api-errors";
import type { GroupFormValues } from "../schemas/group.schema";
import type { GroupText } from "../types/feature.types";
import { useGroupForm } from "./use-group-form";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const validValues: GroupFormValues = {
  title: " Filtros da lista ",
  description: "Por **tipo** e por estado.",
};
const saved = { id: "feature-1" };
const save = vi.fn<(text: GroupText) => Promise<unknown>>();
const onSaved = vi.fn();

function renderGroupForm(text?: GroupText) {
  return renderHook(() => useGroupForm({ text, save, isSaving: false, onSaved })).result;
}

async function submit(result: ReturnType<typeof renderGroupForm>, values: GroupFormValues) {
  await act(async () => {
    result.current.form.reset(values);
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  save.mockReset().mockResolvedValue(saved);
  onSaved.mockClear();
  vi.mocked(toast.error).mockClear();
});

describe("useGroupForm", () => {
  it("começa vazio quando não há o que editar", () => {
    expect(renderGroupForm().current.form.getValues()).toEqual({ title: "", description: "" });
  });

  it("começa só com o título e a descrição de quem é editado", () => {
    const feature = { id: "feature-1", title: "Filtros", description: "Por tipo.", progress: 40 };

    expect(renderGroupForm(feature).current.form.getValues()).toEqual({
      title: "Filtros",
      description: "Por tipo.",
    });
  });

  it("grava o título sem espaços e a descrição, e entrega o que foi gravado", async () => {
    const result = renderGroupForm();

    await submit(result, validValues);

    expect(save).toHaveBeenCalledWith({
      title: "Filtros da lista",
      description: "Por **tipo** e por estado.",
    });
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("não grava quando o schema recusa o título", async () => {
    const result = renderGroupForm();

    await submit(result, { ...validValues, title: " " });

    expect(save).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("title").error?.message).toBe("Informe o título.");
  });

  it.each([
    ["FeatureTitleTooLong", "O título pode ter no máximo 200 caracteres.", "title"],
    [
      "FeatureDescriptionTooLong",
      "A descrição pode ter no máximo 50.000 caracteres.",
      "description",
    ],
  ] as const)("põe no campo o erro %s vindo do Core", async (code, details, field) => {
    save.mockRejectedValue(apiError(400, code, details, { property: field }));
    const result = renderGroupForm();

    await submit(result, validValues);

    expect(result.current.form.getFieldState(field).error?.message).toBe(details);
    expect(toast.error).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it.each([
    ["FeatureLimitReached", "O projeto já tem o máximo de 500 features."],
    ["EpicLimitReached", "O projeto já tem o máximo de 100 epics."],
  ])(
    "avisa com a mensagem do Core quando o projeto chegou ao limite (%s)",
    async (code, details) => {
      save.mockRejectedValue(apiError(422, code, details));
      const result = renderGroupForm();

      await submit(result, validValues);

      expect(toast.error).toHaveBeenCalledWith(details);
      expect(onSaved).not.toHaveBeenCalled();
    }
  );

  it("devolve à parte o erro do epic, que não tem campo no formulário", async () => {
    save.mockRejectedValue(
      apiError(422, "FeatureEpicInvalid", "Este epic não existe no projeto da feature.", {
        property: "epicId",
      })
    );
    const result = renderGroupForm();

    await submit(result, validValues);

    expect(result.current.epicError).toBe("Este epic não existe no projeto da feature.");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("mostra a falha de rede e mantém o que foi escrito", async () => {
    save.mockRejectedValue(networkFailure);
    const result = renderGroupForm();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(result.current.form.getValues("description")).toBe("Por **tipo** e por estado.");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("repassa se a gravação está em curso", () => {
    const { result } = renderHook(() => useGroupForm({ save, isSaving: true, onSaved }));

    expect(result.current.isSaving).toBe(true);
  });
});
