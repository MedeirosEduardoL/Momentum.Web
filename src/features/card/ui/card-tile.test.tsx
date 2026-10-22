import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListProjectMembers } from "@/features/project";
import { createQueryWrapper } from "@/test/query-wrapper";
import { createCardTask, listCardTasks, updateCardTask } from "../api/card-task.service";
import type { CardState, CardSummary, CardTask } from "../model/types/card.types";
import { CardTile } from "./card-tile";

vi.mock("../api/card.service");
vi.mock("../api/card-task.service");
vi.mock("../api/card-relation.service");
vi.mock("@/features/project", () => ({ useListProjectMembers: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const fresh: CardState = { id: "state-1", name: "Novo", category: "to_do", position: 1 };
const card: CardSummary = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "user_story",
  title: "Importar os chamados",
  state: fresh,
  priority: "medium",
  assignee: null,
  featureId: null,
  progress: 33,
  taskCount: 3,
  doneTaskCount: 1,
  subitemCounts: {
    task: { total: 2, done: 1 },
    bug: { total: 0, done: 0 },
    impediment: { total: 1, done: 0 },
  },
  isArchived: false,
  updatedAt: "2026-10-21T10:00:00Z",
};
const subitem: CardTask = {
  id: "task-1",
  cardId: "card-1",
  kind: "task",
  title: "Mapear os campos",
  description: "",
  state: "done",
  assignee: null,
  updatedAt: "2026-10-21T10:00:00Z",
};
const tasks: CardTask[] = [
  subitem,
  { ...subitem, id: "task-2", title: "Criar a tela", state: "to_do" },
  { ...subitem, id: "task-3", kind: "impediment", title: "Aguardando a chave", state: "to_do" },
];
const onSubitemsChanged = vi.fn();

function renderTile() {
  render(
    <ul>
      <CardTile
        card={card}
        titleLink={<a href="/cards/card-1">{card.title}</a>}
        stateOptions={[{ value: fresh.id, label: fresh.name }]}
        assigneeOptions={[{ value: "", label: "Sem responsável" }]}
        isLocked={false}
        isDragged={false}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onMove={vi.fn()}
        onSubitemsChanged={onSubitemsChanged}
      />
    </ul>,
    { wrapper: createQueryWrapper().wrapper }
  );

  return userEvent.setup();
}

beforeEach(() => {
  vi.mocked(useListProjectMembers).mockReturnValue({
    data: [],
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useListProjectMembers>);
  vi.mocked(listCardTasks).mockReset().mockResolvedValue(tasks);
  vi.mocked(updateCardTask).mockReset().mockResolvedValue(subitem);
  vi.mocked(createCardTask).mockReset().mockResolvedValue(subitem);
  onSubitemsChanged.mockClear();
});

describe("CardTile — subitens", () => {
  it("mostra um botão por tipo presente, com os concluídos sobre o total", () => {
    renderTile();

    expect(
      screen.getByRole("button", { name: "Tasks de MOM-12: 1 de 2 concluídos" })
    ).toHaveTextContent("Tasks 1/2");
    expect(screen.queryByRole("button", { name: /^Bugs de MOM-12/ })).toBeNull();
  });

  it("destaca o impedimento em aberto", () => {
    renderTile();

    expect(
      screen.getByRole("button", { name: "Impedimentos de MOM-12: 0 de 1 concluídos" })
    ).toHaveClass("text-danger");
  });

  it("lista no cartão só os subitens do tipo escolhido e deixa de arrastar enquanto ele está aberto", async () => {
    const user = renderTile();

    await user.click(screen.getByRole("button", { name: /^Tasks de MOM-12/ }));

    const list = within(await screen.findByRole("group", { name: "Tasks de MOM-12" }));
    expect(await list.findByRole("checkbox", { name: "Concluir Mapear os campos" })).toBeChecked();
    expect(list.getByRole("checkbox", { name: "Concluir Criar a tela" })).not.toBeChecked();
    expect(list.queryByText("Aguardando a chave")).toBeNull();
    expect(screen.getByRole("link", { name: card.title }).closest("li")).toHaveAttribute(
      "draggable",
      "false"
    );
  });

  it("conclui o subitem pela caixa e relê as colunas", async () => {
    const user = renderTile();
    await user.click(screen.getByRole("button", { name: /^Tasks de MOM-12/ }));

    await user.click(await screen.findByRole("checkbox", { name: "Concluir Criar a tela" }));

    expect(vi.mocked(updateCardTask).mock.calls[0][0]).toEqual({
      cardTaskId: "task-2",
      state: "done",
    });
    await waitFor(() => expect(onSubitemsChanged).toHaveBeenCalledTimes(1));
  });

  it("adiciona outro subitem do mesmo tipo pelo campo do cartão", async () => {
    const user = renderTile();
    await user.click(screen.getByRole("button", { name: /^Impedimentos de MOM-12/ }));

    await user.type(
      screen.getByRole("textbox", { name: "Novo impedimento em MOM-12" }),
      "Esperando o acesso{Enter}"
    );

    expect(vi.mocked(createCardTask).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      kind: "impediment",
      title: "Esperando o acesso",
      assigneeId: null,
    });
    await waitFor(() => expect(onSubitemsChanged).toHaveBeenCalledTimes(1));
  });

  it("cria com o tipo do botão aberto agora, mesmo depois de trocar de tipo", async () => {
    const user = renderTile();
    await user.click(screen.getByRole("button", { name: /^Impedimentos de MOM-12/ }));
    await user.click(screen.getByRole("button", { name: /^Tasks de MOM-12/ }));

    await user.type(
      screen.getByRole("textbox", { name: "Nova task em MOM-12" }),
      "Criar a API{Enter}"
    );

    expect(vi.mocked(createCardTask).mock.calls[0][0]).toMatchObject({
      kind: "task",
      title: "Criar a API",
    });
  });

  it("abre o subitem como mini card pelo título", async () => {
    const user = renderTile();
    await user.click(screen.getByRole("button", { name: /^Impedimentos de MOM-12/ }));

    await user.click(await screen.findByRole("button", { name: "Aguardando a chave" }));

    const dialog = screen.getByRole("dialog", { name: "Aguardando a chave" });
    expect(within(dialog).getByText("Impedimento de MOM-12")).toBeVisible();
    expect(within(dialog).getByRole("heading", { name: "O que está travando" })).toBeVisible();
  });
});

describe("CardTile — menu de três pontos", () => {
  it("oferece adicionar task, bug e impedimento, mesmo sem nenhum subitem do tipo", async () => {
    const user = renderTile();

    await user.click(screen.getByRole("button", { name: "Ações de MOM-12" }));

    expect(screen.getAllByRole("menuitem").map(item => item.textContent)).toEqual([
      "Adicionar task",
      "Adicionar bug",
      "Adicionar impedimento",
    ]);
  });

  it("abre o campo do tipo escolhido com o foco nele e cria o primeiro bug do card", async () => {
    const user = renderTile();

    await user.click(screen.getByRole("button", { name: "Ações de MOM-12" }));
    await user.click(screen.getByRole("menuitem", { name: "Adicionar bug" }));
    const field = await screen.findByRole("textbox", { name: "Novo bug em MOM-12" });
    await waitFor(() => expect(field).toHaveFocus());
    await user.type(field, "Botão some no celular{Enter}");

    await waitFor(() => expect(createCardTask).toHaveBeenCalledOnce());
    expect(vi.mocked(createCardTask).mock.calls[0][0]).toMatchObject({
      cardId: "card-1",
      kind: "bug",
      title: "Botão some no celular",
    });
  });
});
