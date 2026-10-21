import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListProjectMembers } from "@/features/project";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardKeys } from "../../api/card-api-keys";
import { createCardTask } from "../../api/card-task.service";
import type { CardTaskFormValues } from "../schemas/card-task.schema";
import type { Card, CardTask } from "../types/card.types";
import { useCreateCardTask } from "./use-create-card-task";

vi.mock("../../api/card.service");
vi.mock("../../api/card-task.service");
vi.mock("../../api/card-relation.service");
vi.mock("@/features/project", () => ({ useListProjectMembers: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type TeamResult = ReturnType<typeof useListProjectMembers>;

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
const createdTask: CardTask = {
  id: "task-9",
  cardId: "card-1",
  kind: "task",
  title: "Medir o tempo do build",
  description: "",
  state: "to_do",
  assignee: null,
  updatedAt: "2026-10-13T12:00:00Z",
};
const validValues: CardTaskFormValues = {
  kind: "bug",
  title: " Medir o tempo do build ",
  assigneeId: "user-2",
};
const refetchTeam = vi.fn<TeamResult["refetch"]>();
const refetch: TeamResult["refetch"] = refetchTeam;

function renderCreateTask() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useCreateCardTask(card), { wrapper });

  return { result, invalidateQueries };
}

async function submit(
  result: ReturnType<typeof renderCreateTask>["result"],
  values: CardTaskFormValues
) {
  await act(async () => {
    result.current.form.reset(values, { keepDefaultValues: true });
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(createCardTask).mockReset().mockResolvedValue(createdTask);
  vi.mocked(toast.error).mockClear();
  refetchTeam.mockReset();
  vi.mocked(useListProjectMembers).mockReturnValue({ data: [], refetch } as unknown as TeamResult);
});

describe("useCreateCardTask", () => {
  it("começa como task, sem título e sem responsável", () => {
    const { result } = renderCreateTask();

    expect(result.current.form.getValues()).toEqual({ kind: "task", title: "", assigneeId: "" });
  });

  it("cria a task no card com o título sem espaços e o responsável escolhido", async () => {
    const { result, invalidateQueries } = renderCreateTask();

    await submit(result, validValues);

    expect(vi.mocked(createCardTask).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      kind: "bug",
      title: "Medir o tempo do build",
      assigneeId: "user-2",
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
  });

  it("cria a task sem responsável quando ninguém foi escolhido", async () => {
    const { result } = renderCreateTask();

    await submit(result, { ...validValues, assigneeId: "" });

    expect(vi.mocked(createCardTask).mock.calls[0][0]).toMatchObject({ assigneeId: null });
  });

  it("limpa o título e o responsável depois de criar, e mantém o tipo para o próximo", async () => {
    const { result } = renderCreateTask();

    await submit(result, validValues);

    expect(result.current.form.getValues()).toEqual({ kind: "bug", title: "", assigneeId: "" });
  });

  it("não chama a API quando o schema recusa o título", async () => {
    const { result } = renderCreateTask();

    await submit(result, { ...validValues, title: " " });

    expect(createCardTask).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("title").error?.message).toBe(
      "Informe o título do subitem."
    );
  });

  it("avisa com a mensagem do Core que o card chegou a 100 tasks, e mantém o que foi escrito", async () => {
    vi.mocked(createCardTask).mockRejectedValue(
      apiError(422, "CardTaskLimitReached", "Um card pode ter no máximo 100 tasks.")
    );
    const { result, invalidateQueries } = renderCreateTask();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith("Um card pode ter no máximo 100 tasks.");
    expect(result.current.form.getValues("title")).toBe(" Medir o tempo do build ");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
  });

  it("põe no campo o erro de título vindo do Core", async () => {
    vi.mocked(createCardTask).mockRejectedValue(
      apiError(400, "CardTaskTitleTooLong", "O título da task pode ter no máximo 200 caracteres.", {
        property: "title",
      })
    );
    const { result } = renderCreateTask();

    await submit(result, validValues);

    expect(result.current.form.getFieldState("title").error?.message).toBe(
      "O título da task pode ter no máximo 200 caracteres."
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("mostra no campo, desfaz a escolha e recarrega o time quando o responsável saiu dele", async () => {
    vi.mocked(createCardTask).mockRejectedValue(
      apiError(
        422,
        "CardAssigneeOutsideProject",
        "O responsável precisa fazer parte do time do projeto.",
        { property: "assigneeId" }
      )
    );
    const { result } = renderCreateTask();

    await submit(result, validValues);

    expect(result.current.form.getFieldState("assigneeId").error?.message).toBe(
      "O responsável precisa fazer parte do time do projeto."
    );
    expect(result.current.form.getValues("assigneeId")).toBe("");
    expect(refetchTeam).toHaveBeenCalledTimes(1);
  });

  it("mostra a falha de rede sem recarregar o time", async () => {
    vi.mocked(createCardTask).mockRejectedValue(networkFailure);
    const { result } = renderCreateTask();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(refetchTeam).not.toHaveBeenCalled();
    expect(result.current.form.getValues("assigneeId")).toBe("user-2");
  });
});
