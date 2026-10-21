import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardKeys } from "../../api/card-api-keys";
import { createCard } from "../../api/card.service";
import type { QuickCardFormValues } from "../schemas/card.schema";
import type { Card, CardStateColumn, QuickCardDefaults } from "../types/card.types";
import { useQuickCreateCard } from "./use-quick-create-card";

vi.mock("../../api/card.service");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));

const defaults: QuickCardDefaults = {
  cardType: "issue",
  cardStateId: "state-1",
  priority: "urgent",
  assigneeId: "user-1",
  featureId: "",
};

const createdCard: Card = {
  id: "card-9",
  projectId: "project-1",
  identifier: "MOM-9",
  type: "issue",
  title: "Lista de chamados vazia",
  state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  priority: "urgent",
  assignee: { userId: "user-1", name: "Ana Souza" },
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
  updatedAt: "2026-10-20T12:00:00Z",
  description: "",
  fields: {
    type: "issue",
    stepsToReproduce: "",
    expectedBehavior: "",
    observedBehavior: "",
    severity: null,
    location: "",
  },
  createdAt: "2026-10-20T12:00:00Z",
};

const columnsWithCard: CardStateColumn[] = [
  { state: createdCard.state, totalCount: 1, cards: [createdCard] },
];
const columnsWithoutCard: CardStateColumn[] = [
  { state: createdCard.state, totalCount: 0, cards: [] },
];

const validValues: QuickCardFormValues = { cardType: "spike", title: " Avaliar SSE " };
const reload = vi.fn<() => Promise<CardStateColumn[] | undefined>>();
const onOpenCard = vi.fn<(card: Card) => void>();

function renderQuickCreate() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(
    () => useQuickCreateCard({ projectId: "project-1", defaults, reload, onOpenCard }),
    { wrapper }
  );

  return { result, invalidateQueries };
}

async function submit(
  result: ReturnType<typeof renderQuickCreate>["result"],
  values: QuickCardFormValues
) {
  await act(async () => {
    result.current.form.reset(values, { keepDefaultValues: true });
    await result.current.onSubmit();
  });
}

type ToastAction = {
  label: unknown;
  onClick: () => void;
};

function isToastAction(action: unknown): action is ToastAction {
  return typeof action === "object" && action !== null && "onClick" in action;
}

function toastAction(mock: typeof toast.success) {
  const action = vi.mocked(mock).mock.calls[0][1]?.action;

  if (!isToastAction(action)) {
    throw new Error("O toast não trouxe a ação de abrir o card.");
  }

  return action;
}

beforeEach(() => {
  vi.mocked(createCard).mockReset().mockResolvedValue(createdCard);
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.warning).mockClear();
  vi.mocked(toast.error).mockClear();
  reload.mockReset().mockResolvedValue(columnsWithCard);
  onOpenCard.mockReset();
});

describe("useQuickCreateCard", () => {
  it("começa com o tipo dos padrões do board e sem título", () => {
    const { result } = renderQuickCreate();

    expect(result.current.form.getValues()).toEqual({ cardType: "issue", title: "" });
  });

  it("cria o card no estado, na prioridade e no responsável dos padrões, com o tipo e o título digitados", async () => {
    const { result, invalidateQueries } = renderQuickCreate();

    await submit(result, validValues);

    expect(vi.mocked(createCard).mock.calls[0][0]).toEqual({
      projectId: "project-1",
      title: "Avaliar SSE",
      description: "",
      cardStateId: "state-1",
      priority: "urgent",
      assigneeId: "user-1",
      featureId: null,
      fields: { type: "spike", question: "", deadline: null, conclusion: "" },
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("limpa o título e mantém o tipo escolhido, para o próximo card", async () => {
    const { result } = renderQuickCreate();

    await submit(result, validValues);

    expect(result.current.form.getValues()).toEqual({ cardType: "spike", title: "" });
  });

  it("avisa que o card foi criado, com a ação de abri-lo", async () => {
    const { result } = renderQuickCreate();

    await submit(result, validValues);

    expect(vi.mocked(toast.success).mock.calls[0][0]).toBe("O card MOM-9 foi criado.");
    expect(toast.warning).not.toHaveBeenCalled();

    const action = toastAction(toast.success);
    expect(action.label).toBe("Abrir o card");
    act(() => action.onClick());
    expect(onOpenCard).toHaveBeenCalledWith(createdCard);
  });

  it("avisa que o card criado não casa com o filtro quando ele não volta nas colunas relidas", async () => {
    reload.mockResolvedValue(columnsWithoutCard);
    const { result } = renderQuickCreate();

    await submit(result, validValues);

    expect(vi.mocked(toast.warning).mock.calls[0][0]).toBe(
      "O card MOM-9 foi criado, mas não casa com o filtro deste board."
    );
    expect(toastAction(toast.warning).label).toBe("Abrir o card");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("não diz que o card ficou fora do filtro quando as colunas não puderam ser relidas", async () => {
    reload.mockResolvedValue(undefined);
    const { result } = renderQuickCreate();

    await submit(result, validValues);

    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("não chama a API quando o schema recusa o título", async () => {
    const { result } = renderQuickCreate();

    await submit(result, { ...validValues, title: "  " });

    expect(createCard).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("title").error?.message).toBe(
      "Informe o título do card."
    );
  });

  it("mostra embaixo do formulário a recusa de um padrão do board, sem toast", async () => {
    vi.mocked(createCard).mockRejectedValue(
      apiError(
        422,
        "CardAssigneeOutsideProject",
        "O responsável precisa fazer parte do time do projeto.",
        { property: "assigneeId" }
      )
    );
    const { result } = renderQuickCreate();

    await submit(result, validValues);

    expect(result.current.defaultsError).toBe(
      "O responsável precisa fazer parte do time do projeto."
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(result.current.form.getValues("title")).toBe(" Avaliar SSE ");
  });

  it("põe no campo o erro de título vindo do Core", async () => {
    vi.mocked(createCard).mockRejectedValue(
      apiError(400, "CardTitleTooLong", "O título do card pode ter no máximo 200 caracteres.", {
        property: "title",
      })
    );
    const { result } = renderQuickCreate();

    await submit(result, validValues);

    expect(result.current.form.getFieldState("title").error?.message).toBe(
      "O título do card pode ter no máximo 200 caracteres."
    );
  });

  it("mostra a falha de rede num toast e mantém o que foi digitado", async () => {
    vi.mocked(createCard).mockRejectedValue(networkFailure);
    const { result } = renderQuickCreate();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(result.current.form.getValues("title")).toBe(" Avaliar SSE ");
  });
});
