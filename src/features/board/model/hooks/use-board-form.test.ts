import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, networkFailure } from "@/test/api-errors";
import type { BoardFormValues } from "../schemas/board.schema";
import type { Board, BoardDefinition, BoardFilterOptions } from "../types/board.types";
import { useBoardForm } from "./use-board-form";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const options: BoardFilterOptions = {
  team: [{ userId: "user-1", name: "Ana Souza", email: "ana@exemplo.test", role: "member" }],
  features: [
    {
      id: "feature-1",
      projectId: "project-1",
      epicId: null,
      title: "Filtros da lista",
      progress: 0,
      state: "to_do",
      cardCount: 0,
    },
  ],
  epics: [
    {
      id: "epic-1",
      projectId: "project-1",
      title: "Lista de cards",
      progress: 0,
      state: "to_do",
      featureCount: 0,
      cardCount: 0,
    },
  ],
};

const board: Board = {
  id: "board-1",
  projectId: "project-1",
  name: "Issues urgentes",
  filter: {
    cardTypes: ["issue"],
    priorities: ["urgent"],
    assigneeIds: ["user-1"],
    featureIds: ["feature-1"],
    epicIds: ["epic-1"],
  },
};

const validValues: BoardFormValues = { name: " Issues urgentes ", ...board.filter };
const save = vi.fn<(definition: BoardDefinition) => Promise<Board>>();
const onSaved = vi.fn<(saved: Board) => void>();

function renderBoardForm(edited?: Board) {
  return renderHook(() => useBoardForm({ board: edited, options, save, isSaving: false, onSaved }))
    .result;
}

async function submit(result: ReturnType<typeof renderBoardForm>, values: BoardFormValues) {
  await act(async () => {
    result.current.form.reset(values);
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  save.mockReset().mockResolvedValue(board);
  onSaved.mockClear();
  vi.mocked(toast.error).mockClear();
});

describe("useBoardForm", () => {
  it("começa sem nome e sem critério quando o board é novo", () => {
    expect(renderBoardForm().current.form.getValues()).toEqual({
      name: "",
      cardTypes: [],
      priorities: [],
      assigneeIds: [],
      featureIds: [],
      epicIds: [],
    });
  });

  it("começa só com o nome e o filtro do board editado", () => {
    expect(renderBoardForm(board).current.form.getValues()).toEqual({
      name: "Issues urgentes",
      ...board.filter,
    });
  });

  it("grava o nome sem espaços e o filtro com os cinco critérios, e entrega o board gravado", async () => {
    const result = renderBoardForm();

    await submit(result, validValues);

    expect(save).toHaveBeenCalledWith({ name: "Issues urgentes", filter: board.filter });
    expect(onSaved).toHaveBeenCalledWith(board);
  });

  it("deixa fora do filtro o responsável, a feature e o epic que não existem mais no projeto", async () => {
    const result = renderBoardForm();

    await submit(result, {
      ...validValues,
      assigneeIds: ["user-1", "user-9"],
      featureIds: ["feature-9"],
      epicIds: ["epic-9", "epic-1"],
    });

    expect(save).toHaveBeenCalledWith({
      name: "Issues urgentes",
      filter: { ...board.filter, assigneeIds: ["user-1"], featureIds: [], epicIds: ["epic-1"] },
    });
  });

  it("não grava quando o schema recusa o nome", async () => {
    const result = renderBoardForm();

    await submit(result, { ...validValues, name: " " });

    expect(save).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("name").error?.message).toBe(
      "Informe o nome do board."
    );
  });

  it("põe no campo do nome o erro de nome repetido vindo do Core", async () => {
    save.mockRejectedValue(
      apiError(409, "BoardNameAlreadyUsed", "Já existe um board com este nome no projeto.", {
        property: "name",
      })
    );
    const result = renderBoardForm();

    await submit(result, validValues);

    expect(result.current.form.getFieldState("name").error?.message).toBe(
      "Já existe um board com este nome no projeto."
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it.each([
    ["BoardAssigneeOutsideProject", "Um dos responsáveis do filtro não está no time do projeto."],
    ["BoardFeatureInvalid", "Uma das features do filtro não existe neste projeto."],
    ["BoardEpicInvalid", "Um dos epics do filtro não existe neste projeto."],
  ])("devolve à parte o erro %s, que é do filtro inteiro", async (code, details) => {
    save.mockRejectedValue(apiError(422, code, details, { property: "filter" }));
    const result = renderBoardForm();

    await submit(result, validValues);

    expect(result.current.filterError).toBe(details);
    expect(toast.error).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it.each([
    [422, "BoardLimitReached", "O projeto já tem o máximo de 50 boards."],
    [
      403,
      "BoardAdministrationDenied",
      "Só o administrador do projeto cria, altera e exclui boards.",
    ],
  ])("avisa com a mensagem do Core no erro %i %s", async (status, code, details) => {
    save.mockRejectedValue(apiError(status, code, details));
    const result = renderBoardForm();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith(details);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("mostra a falha de rede e mantém o que foi escolhido", async () => {
    save.mockRejectedValue(networkFailure);
    const result = renderBoardForm();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(result.current.form.getValues("cardTypes")).toEqual(["issue"]);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("repassa se a gravação está em curso", () => {
    const { result } = renderHook(() => useBoardForm({ options, save, isSaving: true, onSaved }));

    expect(result.current.isSaving).toBe(true);
  });
});
