import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListProjects } from "@/features/project";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardKeys } from "../../api/card-api-keys";
import { createCardRelation } from "../../api/card-relation.service";
import { listCards } from "../../api/card.service";
import type { CardRelationFormValues } from "../schemas/card-relation.schema";
import type { Card, CardRelation } from "../types/card.types";
import { useCreateCardRelation } from "./use-create-card-relation";

vi.mock("../../api/card.service");
vi.mock("../../api/card-task.service");
vi.mock("../../api/card-relation.service");
vi.mock("@/features/project", () => ({ useListProjects: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type ProjectsResult = ReturnType<typeof useListProjects>;

const card: Card = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "tech_debt",
  title: "Pagar a dívida do build",
  state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  priority: "medium",
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
  description: "",
  fields: { type: "tech_debt", impact: "Build lento" },
  createdAt: "2026-10-12T09:00:00Z",
};
const createdRelation: CardRelation = {
  id: "relation-1",
  relation: "blocked_by",
  card: {
    id: "card-2",
    identifier: "SUP-7",
    type: "issue",
    title: "Lista de chamados vazia",
    stateName: "Novo",
  },
};
const validValues: CardRelationFormValues = { relation: "blocked_by", relatedCardId: "card-2" };
const projects = { data: [] } as unknown as ProjectsResult;
const onCreated = vi.fn();

function renderCreateRelation() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useCreateCardRelation({ card, onCreated }), { wrapper });

  return { result, invalidateQueries };
}

async function submit(
  result: ReturnType<typeof renderCreateRelation>["result"],
  values: CardRelationFormValues
) {
  await act(async () => {
    result.current.form.reset(values);
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(listCards).mockReset().mockResolvedValue({ cards: [], page: 1, totalPages: 1 });
  vi.mocked(createCardRelation).mockReset().mockResolvedValue(createdRelation);
  vi.mocked(toast.error).mockClear();
  vi.mocked(useListProjects).mockReturnValue(projects);
  onCreated.mockClear();
});

describe("useCreateCardRelation — onde procurar o outro card", () => {
  it("começa pelos cards não arquivados do projeto do card, sem busca", async () => {
    const { result } = renderCreateRelation();

    await waitFor(() => expect(result.current.candidates.data).toBeDefined());
    expect(vi.mocked(listCards).mock.calls[0][0]).toEqual({
      projectId: "project-1",
      search: undefined,
      page: 1,
      includesArchived: false,
    });
    expect(result.current.candidateProjectId).toBe("project-1");
    expect(result.current.searchTerm).toBe("");
    expect(result.current.projects).toBe(projects);
    expect(result.current.form.getValues()).toEqual({ relation: "related", relatedCardId: "" });
  });

  it("busca pelo texto sem os espaços das pontas, sem arquivados, e desfaz a escolha do card", async () => {
    const { result } = renderCreateRelation();
    act(() => result.current.form.setValue("relatedCardId", "card-2"));

    act(() => result.current.changeSearch("  SUP-7 "));

    await waitFor(() =>
      expect(listCards).toHaveBeenCalledWith({
        projectId: "project-1",
        search: "SUP-7",
        page: 1,
        includesArchived: false,
      })
    );
    expect(result.current.searchTerm).toBe("SUP-7");
    expect(result.current.form.getValues("relatedCardId")).toBe("");
  });

  it("volta a listar sem busca quando o texto fica em branco", async () => {
    const { result } = renderCreateRelation();
    act(() => result.current.changeSearch("chamados"));
    await waitFor(() => expect(listCards).toHaveBeenCalledTimes(2));

    act(() => result.current.changeSearch("   "));

    expect(result.current.searchTerm).toBe("");
    await waitFor(() => expect(result.current.candidates.isPlaceholderData).toBe(false));
    expect(vi.mocked(listCards).mock.calls.at(-1)?.[0]).toMatchObject({ search: undefined });
  });

  it("troca de projeto mantendo a busca e desfaz a escolha do card", async () => {
    const { result } = renderCreateRelation();
    act(() => result.current.changeSearch("chamados"));
    act(() => result.current.form.setValue("relatedCardId", "card-2"));

    act(() => result.current.changeProject("project-2"));

    await waitFor(() =>
      expect(listCards).toHaveBeenCalledWith({
        projectId: "project-2",
        search: "chamados",
        page: 1,
        includesArchived: false,
      })
    );
    expect(result.current.candidateProjectId).toBe("project-2");
    expect(result.current.form.getValues("relatedCardId")).toBe("");
  });
});

describe("useCreateCardRelation — criar", () => {
  it("cria a relação a partir do card consultado e recarrega as consultas de card", async () => {
    const { result, invalidateQueries } = renderCreateRelation();

    await submit(result, validValues);

    expect(vi.mocked(createCardRelation).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      relation: "blocked_by",
      relatedCardId: "card-2",
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
    expect(onCreated).toHaveBeenCalledTimes(1);
  });

  it("não chama a API enquanto o outro card não foi escolhido", async () => {
    const { result } = renderCreateRelation();

    await submit(result, { ...validValues, relatedCardId: "" });

    expect(createCardRelation).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("relatedCardId").error?.message).toBe(
      "Escolha o card."
    );
  });

  it.each([
    [409, "CardRelationAlreadyExists", "Estes cards já têm esta relação."],
    [422, "CardRelationLimitReached", "Um dos dois cards já tem o máximo de 100 relações."],
  ])(
    "avisa com a mensagem do Core e mantém o formulário aberto (%i %s)",
    async (status, code, details) => {
      vi.mocked(createCardRelation).mockRejectedValue(apiError(status, code, details));
      const { result } = renderCreateRelation();

      await submit(result, validValues);

      expect(toast.error).toHaveBeenCalledWith(details);
      expect(result.current.form.getValues("relatedCardId")).toBe("card-2");
      expect(onCreated).not.toHaveBeenCalled();
    }
  );

  it("põe no campo do card o 422 de card que não pode ser relacionado, com a lista recarregada", async () => {
    vi.mocked(createCardRelation).mockRejectedValue(
      apiError(422, "CardRelationTargetInvalid", "O card relacionado não foi encontrado.", {
        property: "relatedCardId",
      })
    );
    const { result, invalidateQueries } = renderCreateRelation();

    await submit(result, validValues);

    expect(result.current.form.getFieldState("relatedCardId").error?.message).toBe(
      "O card relacionado não foi encontrado."
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("mostra a falha de rede sem fechar o formulário", async () => {
    vi.mocked(createCardRelation).mockRejectedValue(networkFailure);
    const { result } = renderCreateRelation();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(onCreated).not.toHaveBeenCalled();
  });
});
