import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListProjectMembers } from "@/features/project";
import { createQueryWrapper } from "@/test/query-wrapper";
import { createCardTask, listCardTasks, updateCardTask } from "../api/card-task.service";
import type { Card, CardTask } from "../model/types/card.types";
import { CardTaskList } from "./card-task-list";

vi.mock("../api/card.service");
vi.mock("../api/card-task.service");
vi.mock("../api/card-relation.service");
vi.mock("@/features/project", () => ({ useListProjectMembers: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const card: Card = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "user_story",
  title: "Filtrar chamados",
  state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  priority: "medium",
  assignee: null,
  featureId: null,
  progress: 0,
  taskCount: 2,
  doneTaskCount: 0,
  subitemCounts: {
    task: { total: 0, done: 0 },
    bug: { total: 0, done: 0 },
    impediment: { total: 0, done: 0 },
  },
  isArchived: false,
  updatedAt: "2026-10-20T10:00:00Z",
  description: "",
  fields: { type: "user_story", acceptanceCriteria: [] },
  createdAt: "2026-10-20T09:00:00Z",
};
const task: CardTask = {
  id: "task-1",
  cardId: "card-1",
  kind: "task",
  title: "Escrever o teste do filtro",
  description: "",
  state: "to_do",
  assignee: null,
  updatedAt: "2026-10-20T10:00:00Z",
};
const bug: CardTask = {
  ...task,
  id: "task-2",
  kind: "bug",
  title: "Filtro ignora acento",
  description: "1. Buscar por **São**",
};

function renderList() {
  render(<CardTaskList card={card} tasks={[task, bug]} team={[]} />, {
    wrapper: createQueryWrapper().wrapper,
  });

  return userEvent.setup();
}

beforeEach(() => {
  vi.mocked(useListProjectMembers).mockReturnValue({
    data: [],
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useListProjectMembers>);
  vi.mocked(listCardTasks).mockReset().mockResolvedValue([task, bug]);
  vi.mocked(updateCardTask).mockReset().mockResolvedValue(bug);
});

describe("CardTaskList", () => {
  it("mostra o tipo de cada subitem ao lado do título", () => {
    renderList();

    expect(
      screen.getByRole("button", { name: "Filtro ignora acento" }).parentElement
    ).toHaveTextContent("Bug");
    expect(
      screen.getByRole("button", { name: "Escrever o teste do filtro" }).parentElement
    ).toHaveTextContent("Task");
  });

  it("abre o bug como mini card, com os passos para reproduzir em markdown", async () => {
    const user = renderList();

    await user.click(screen.getByRole("button", { name: "Filtro ignora acento" }));

    const dialog = screen.getByRole("dialog", { name: "Filtro ignora acento" });
    expect(within(dialog).getByText("Bug de MOM-12")).toBeVisible();
    expect(within(dialog).getByRole("heading", { name: "Passos para reproduzir" })).toBeVisible();
    expect(within(dialog).getByText("São").tagName).toBe("STRONG");
    expect(within(dialog).getByRole("combobox", { name: "Estado" })).toHaveValue("to_do");
  });

  it("edita o título e a descrição no diálogo e grava com a versão lida", async () => {
    const user = renderList();
    await user.click(screen.getByRole("button", { name: "Escrever o teste do filtro" }));
    const dialog = screen.getByRole("dialog", { name: "Escrever o teste do filtro" });

    await user.click(within(dialog).getByRole("button", { name: "Editar" }));
    await user.type(within(dialog).getByRole("textbox", { name: "Descrição" }), "Cobrir o acento.");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    expect(vi.mocked(updateCardTask).mock.calls[0][0]).toEqual({
      cardTaskId: "task-1",
      title: "Escrever o teste do filtro",
      description: "Cobrir o acento.",
      expectedUpdatedAt: "2026-10-20T10:00:00Z",
    });
    expect(within(dialog).getByRole("button", { name: "Editar" })).toBeVisible();
  });

  it("oferece criar task, bug ou impedimento pelo mesmo formulário", () => {
    renderList();

    expect(screen.getByRole("combobox", { name: "Tipo" })).toHaveValue("task");
    expect(screen.getByRole("option", { name: "Bug" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Impedimento" })).toBeInTheDocument();
  });

  it("diz no campo e no botão o tipo que vai ser criado, e o mantém depois de criar", async () => {
    vi.mocked(createCardTask).mockResolvedValue(bug);
    const user = renderList();

    await user.selectOptions(screen.getByRole("combobox", { name: "Tipo" }), "bug");
    await user.type(screen.getByRole("textbox", { name: "Novo bug" }), "Filtro some{Enter}");

    expect(vi.mocked(createCardTask).mock.calls[0][0]).toMatchObject({
      kind: "bug",
      title: "Filtro some",
    });
    expect(await screen.findByRole("button", { name: "Adicionar bug" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Novo bug" })).toHaveValue("");
  });
});
