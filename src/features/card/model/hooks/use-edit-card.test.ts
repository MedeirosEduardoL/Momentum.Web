import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardKeys } from "../../api/card-api-keys";
import { getCard, updateCard } from "../../api/card.service";
import type { Card } from "../types/card.types";
import { useEditCard } from "./use-edit-card";

vi.mock("../../api/card.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const card: Card = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "issue",
  title: "Lista vazia",
  state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  priority: "high",
  assignee: null,
  featureId: null,
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
  description: "A lista não mostra os cards.",
  fields: {
    type: "issue",
    stepsToReproduce: "Abrir a lista",
    expectedBehavior: "Mostrar os cards",
    observedBehavior: "Lista vazia",
    severity: "high",
    location: "Lista de cards",
  },
  createdAt: "2026-10-12T09:00:00Z",
};
const cardChangedByAnotherPerson: Card = {
  ...card,
  title: "Lista vazia para o membro do time",
  updatedAt: "2026-10-13T12:05:00Z",
};
const changedMeanwhile = apiError(
  409,
  "CardChangedMeanwhile",
  "O card foi alterado por outra pessoa enquanto você editava. Recarregue e tente de novo."
);
const onSaved = vi.fn();

function renderEditCard() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useEditCard({ card, onSaved }), { wrapper });

  return { result, invalidateQueries };
}

type EditCard = ReturnType<typeof renderEditCard>["result"];

async function retitleAndSubmit(result: EditCard, title: string) {
  await act(async () => {
    result.current.form.setValue("title", title);
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(getCard).mockReset().mockResolvedValue(card);
  vi.mocked(updateCard).mockReset().mockResolvedValue(card);
  vi.mocked(toast.error).mockClear();
  onSaved.mockClear();
});

describe("useEditCard", () => {
  it("começa com os campos do card, inclusive os do tipo dele", () => {
    const { result } = renderEditCard();

    expect(result.current.form.getValues()).toMatchObject({
      cardType: "issue",
      title: "Lista vazia",
      description: "A lista não mostra os cards.",
      issue: {
        stepsToReproduce: "Abrir a lista",
        expectedBehavior: "Mostrar os cards",
        observedBehavior: "Lista vazia",
        severity: "high",
        location: "Lista de cards",
      },
    });
    expect(result.current.hasChangedMeanwhile).toBe(false);
  });

  it("grava o título, a descrição e o grupo inteiro do tipo, sem estado, prioridade nem responsável", async () => {
    const { result, invalidateQueries } = renderEditCard();

    await retitleAndSubmit(result, " Lista vazia no filtro ");

    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      expectedUpdatedAt: "2026-10-13T12:00:00Z",
      title: "Lista vazia no filtro",
      description: "A lista não mostra os cards.",
      fields: card.fields,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("não chama a API quando o schema recusa o título", async () => {
    const { result } = renderEditCard();

    await retitleAndSubmit(result, " ");

    expect(updateCard).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("title").error?.message).toBe(
      "Informe o título do card."
    );
  });

  it.each([
    ["CardTitleTooLong", "O título do card pode ter no máximo 200 caracteres.", "title"],
    [
      "CardDescriptionTooLong",
      "A descrição do card pode ter no máximo 50.000 caracteres.",
      "description",
    ],
    ["CardTypeFieldTooLong", "Este campo passou do tamanho máximo.", "issue.location"],
  ] as const)("põe no campo o erro %s vindo do Core", async (code, details, field) => {
    vi.mocked(updateCard).mockRejectedValue(apiError(400, code, details, { property: field }));
    const { result } = renderEditCard();

    await retitleAndSubmit(result, "Lista vazia no filtro");

    expect(result.current.form.getFieldState(field).error?.message).toBe(details);
    expect(result.current.hasChangedMeanwhile).toBe(false);
    expect(toast.error).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("mantém o texto digitado e avisa quando outra pessoa alterou o card", async () => {
    const { result } = renderEditCard();
    await waitFor(() => expect(getCard).toHaveBeenCalledTimes(1));
    vi.mocked(updateCard).mockRejectedValue(changedMeanwhile);
    vi.mocked(getCard).mockResolvedValue(cardChangedByAnotherPerson);

    await retitleAndSubmit(result, "Lista vazia no filtro");

    expect(result.current.form.getValues("title")).toBe("Lista vazia no filtro");
    expect(result.current.hasChangedMeanwhile).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("carrega a versão atual a pedido e passa a gravar sobre ela", async () => {
    const { result } = renderEditCard();
    vi.mocked(updateCard).mockRejectedValueOnce(changedMeanwhile);
    vi.mocked(getCard).mockResolvedValue(cardChangedByAnotherPerson);
    await retitleAndSubmit(result, "Lista vazia no filtro");

    await act(() => result.current.loadCurrentVersion());

    expect(result.current.form.getValues("title")).toBe("Lista vazia para o membro do time");
    expect(result.current.hasChangedMeanwhile).toBe(false);

    await retitleAndSubmit(result, "Lista vazia no filtro");

    expect(vi.mocked(updateCard).mock.calls[1][0]).toMatchObject({
      expectedUpdatedAt: "2026-10-13T12:05:00Z",
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("avisa quando o card não existe mais ou saiu do alcance da pessoa", async () => {
    vi.mocked(updateCard).mockRejectedValue(apiError(404, "CardNotFound", "Card não encontrado."));
    const { result } = renderEditCard();

    await retitleAndSubmit(result, "Lista vazia no filtro");

    expect(toast.error).toHaveBeenCalledWith("Card não encontrado.");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("mostra a falha de rede e mantém o que foi escrito", async () => {
    vi.mocked(updateCard).mockRejectedValue(networkFailure);
    const { result } = renderEditCard();

    await retitleAndSubmit(result, "Lista vazia no filtro");

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(result.current.form.getValues("title")).toBe("Lista vazia no filtro");
    expect(result.current.hasChangedMeanwhile).toBe(false);
    expect(onSaved).not.toHaveBeenCalled();
  });
});
