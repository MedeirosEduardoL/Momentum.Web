import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { createCard, setCardAssignee, updateCard } from "../api/card.service";
import type {
  Card,
  CardAssignee,
  CardAssigneeFilter,
  CardState,
  CardStateColumn,
  CardSummary,
  SavedCardFilter,
} from "../model/types/card.types";
import { CardStateColumns } from "./card-state-columns";

vi.mock("../api/card.service");
vi.mock("@/shared/api/client", () => ({ api: { get: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

const fresh: CardState = { id: "state-1", name: "Novo", category: "to_do", position: 1 };
const doing: CardState = {
  id: "state-2",
  name: "Em andamento",
  category: "in_progress",
  position: 2,
};
const done: CardState = { id: "state-3", name: "Concluído", category: "done", position: 3 };

const ana: CardAssignee = { userId: "user-1", name: "Ana Souza" };

function card(number: number, state: CardState, changes: Partial<CardSummary> = {}): CardSummary {
  return {
    id: `card-${number}`,
    projectId: "project-1",
    identifier: `MOM-${number}`,
    type: "issue",
    title: `Card ${number}`,
    state,
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
    ...changes,
  };
}

const columns: CardStateColumn[] = [
  {
    state: fresh,
    totalCount: 2,
    cards: [
      card(12, fresh, {
        assignee: ana,
        progress: 40,
        taskCount: 5,
        doneTaskCount: 2,
        subitemCounts: {
          task: { total: 3, done: 2 },
          bug: { total: 1, done: 0 },
          impediment: { total: 1, done: 0 },
        },
      }),
      card(13, fresh, { type: "spike", priority: "low" }),
    ],
  },
  { state: doing, totalCount: 1, cards: [card(14, doing, { assignee: ana })] },
  { state: done, totalCount: 0, cards: [] },
];

const emptyColumns: CardStateColumn[] = columns.map(shown => ({
  ...shown,
  totalCount: 0,
  cards: [],
}));

const anaMemberDto = {
  user_id: "user-1",
  name: "Ana Souza",
  email: "ana@exemplo.test",
  role: "administrator",
};

const brunoMemberDto = {
  user_id: "user-2",
  name: "Bruno Lima",
  email: "bruno@exemplo.test",
  role: "member",
};

const NOTHING_SAVED: SavedCardFilter = {
  cardTypes: [],
  priorities: [],
  assigneeIds: [],
  featureIds: [],
};

const reload = vi.fn<() => Promise<CardStateColumn[] | undefined>>();
const onOpenCard = vi.fn<(card: Card) => void>();

function simulateTeam(members: unknown[]) {
  vi.mocked(api.get).mockImplementation((path: string) =>
    path === "/api/v1/projects/project-1/members"
      ? Promise.resolve({ data: members })
      : Promise.reject(apiError(404, "NotFound", `Sem resposta simulada para ${path}.`))
  );
}

function columnsElement(
  shown = columns,
  isGroupedByAssignee = false,
  assigneeFilter: CardAssigneeFilter = {},
  savedFilter = NOTHING_SAVED
) {
  return (
    <CardStateColumns
      projectId="project-1"
      columns={shown}
      isGroupedByAssignee={isGroupedByAssignee}
      assigneeFilter={assigneeFilter}
      savedFilter={savedFilter}
      reload={reload}
      onOpenCard={onOpenCard}
      renderCardLink={shownCard => <a href={`/cards/${shownCard.id}`}>{shownCard.title}</a>}
      renderStateCardsLink={state => <a href={`/cards?estado=${state.id}`}>Ver na lista</a>}
    />
  );
}

function renderColumns(
  shown = columns,
  isGroupedByAssignee = false,
  assigneeFilter: CardAssigneeFilter = {},
  savedFilter = NOTHING_SAVED
) {
  render(columnsElement(shown, isGroupedByAssignee, assigneeFilter, savedFilter), {
    wrapper: createQueryWrapper().wrapper,
  });

  return userEvent.setup();
}

function zone(name: string) {
  return screen.getByRole("list", { name });
}

function tile(title: string) {
  const item = screen.getByRole("link", { name: title }).closest("li");

  if (!item) {
    throw new Error(`O cartão ${title} não está na tela.`);
  }

  return item;
}

function dataTransfer() {
  return { effectAllowed: "none", dropEffect: "none", setData: vi.fn() };
}

function neverSettles<TResult>() {
  return new Promise<TResult>(() => {});
}

beforeEach(() => {
  vi.mocked(updateCard)
    .mockReset()
    .mockResolvedValue({} as Card);
  vi.mocked(setCardAssignee).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  vi.mocked(api.get).mockReset();
  simulateTeam([anaMemberDto]);
  reload.mockReset().mockResolvedValue(undefined);
  onOpenCard.mockReset();
  vi.mocked(createCard).mockReset();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.warning).mockClear();
});

describe("CardStateColumns — o que mostra", () => {
  it("mostra uma coluna por estado, na ordem recebida, com o total de cada uma", () => {
    renderColumns();

    expect(
      screen.getAllByRole("heading", { level: 2 }).map(heading => heading.textContent)
    ).toEqual(["Novo", "Em andamento", "Concluído"]);
    expect(screen.getByText("2 cards")).toBeVisible();
    expect(screen.getByText("1 card")).toBeVisible();
    expect(screen.getByText("0 cards")).toBeVisible();
  });

  it("mostra no cartão o identificador, o tipo, o título, a prioridade alta, o responsável e os subitens", () => {
    renderColumns();

    const shown = within(tile("Card 12"));

    expect(shown.getByText("MOM-12")).toBeVisible();
    expect(shown.getByText("Issue")).toBeVisible();
    expect(shown.getByRole("link", { name: "Card 12" })).toHaveAttribute("href", "/cards/card-12");
    expect(shown.getByText("Alta")).toHaveTextContent("Prioridade Alta");
    expect(shown.getByText("Ana Souza")).toBeVisible();
    expect(shown.getByRole("button", { name: "Tasks de MOM-12: 2 de 3 concluídos" })).toBeVisible();
    expect(shown.getByRole("button", { name: "Bugs de MOM-12: 0 de 1 concluídos" })).toBeVisible();
    expect(
      shown.getByRole("button", { name: "Impedimentos de MOM-12: 0 de 1 concluídos" })
    ).toBeVisible();
  });

  it("não destaca a prioridade baixa nem mostra botão de subitem no cartão que não tem nenhum", () => {
    renderColumns();

    const shown = within(tile("Card 13"));

    expect(shown.getByText("Sem responsável")).toBeVisible();
    expect(shown.queryByText(/Prioridade/)).toBeNull();
    expect(shown.queryByRole("button", { name: /de MOM-13:/ })).toBeNull();
  });

  it("pinta o cabeçalho de cada coluna no tom da categoria do estado", () => {
    renderColumns();

    expect(screen.getByRole("heading", { name: "Novo" }).parentElement).toHaveClass(
      "border-t-line-strong"
    );
    expect(screen.getByRole("heading", { name: "Em andamento" }).parentElement).toHaveClass(
      "border-t-info"
    );
    expect(screen.getByRole("heading", { name: "Concluído" }).parentElement).toHaveClass(
      "border-t-success"
    );
  });

  it("põe cada card na coluna do estado dele", () => {
    renderColumns();

    expect(within(zone("Novo")).getAllByRole("listitem")).toHaveLength(2);
    expect(within(zone("Em andamento")).getByRole("link", { name: "Card 14" })).toBeVisible();
    expect(within(zone("Concluído")).queryByRole("listitem")).toBeNull();
  });

  it("avisa quando a coluna vem cortada e leva à lista de cards do estado", () => {
    renderColumns([{ ...columns[0], totalCount: 250 }, columns[1]]);

    expect(screen.getByText("2 de 250 cards")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver na lista" })).toHaveAttribute(
      "href",
      "/cards?estado=state-1"
    );
  });

  it("não mostra o aviso na coluna que traz todos os cards", () => {
    renderColumns();

    expect(screen.queryByRole("link", { name: "Ver na lista" })).toBeNull();
  });

  it("agrupa os cards em raias por responsável, com as colunas em cada uma", () => {
    renderColumns(columns, true);

    expect(
      screen.getAllByRole("heading", { level: 3 }).map(heading => heading.textContent)
    ).toEqual(["Ana Souza", "Sem responsável"]);
    expect(screen.getByRole("heading", { name: "Ana Souza" }).parentElement).toHaveTextContent(
      "2 cards"
    );
    expect(within(zone("Novo de Ana Souza")).getByRole("link", { name: "Card 12" })).toBeVisible();
    expect(
      within(zone("Em andamento de Ana Souza")).getByRole("link", { name: "Card 14" })
    ).toBeVisible();
    expect(
      within(zone("Novo de Sem responsável")).getByRole("link", { name: "Card 13" })
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(3);
  });
});

describe("CardStateColumns — mover pelo seletor do cartão", () => {
  it("oferece no cartão os estados do projeto, com o do card escolhido", () => {
    renderColumns();

    const selector = screen.getByRole("combobox", { name: "Estado de MOM-12" });

    expect(selector).toHaveValue("state-1");
    expect(within(selector).getAllByRole("option")).toHaveLength(3);
  });

  it("muda o estado do card e recarrega as colunas", async () => {
    const user = renderColumns();

    await user.selectOptions(screen.getByRole("combobox", { name: "Estado de MOM-13" }), "state-3");

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({
      cardId: "card-13",
      cardStateId: "state-3",
    });
    expect(setCardAssignee).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mostra o card na coluna nova e trava os cartões enquanto o movimento corre", async () => {
    vi.mocked(updateCard).mockReturnValue(neverSettles());
    const user = renderColumns();

    await user.selectOptions(screen.getByRole("combobox", { name: "Estado de MOM-13" }), "state-3");

    expect(await within(zone("Concluído")).findByRole("link", { name: "Card 13" })).toBeVisible();
    expect(within(zone("Novo")).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getAllByText("1 card")).toHaveLength(3);
    expect(screen.getByRole("combobox", { name: "Estado de MOM-12" })).toBeDisabled();
    expect(tile("Card 12")).toHaveAttribute("draggable", "false");
  });

  it("devolve o card à coluna de origem e avisa quando o Core recusa", async () => {
    vi.mocked(updateCard).mockRejectedValue(
      apiError(409, "CardChangedMeanwhile", "O card foi alterado por outra pessoa. Recarregue.")
    );
    const user = renderColumns();

    await user.selectOptions(screen.getByRole("combobox", { name: "Estado de MOM-13" }), "state-3");

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(toast.error).toHaveBeenCalledWith(
      "O card foi alterado por outra pessoa. O board mostra a versão atual: confira e mova de novo."
    );
    expect(await within(zone("Novo")).findByRole("link", { name: "Card 13" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Estado de MOM-13" })).toBeEnabled();
  });
});

describe("CardStateColumns — concluir card com task aberta", () => {
  it("pergunta antes de concluir, dizendo quantas tasks serão concluídas", async () => {
    const user = renderColumns();

    await user.selectOptions(screen.getByRole("combobox", { name: "Estado de MOM-12" }), "state-3");

    const dialog = within(await screen.findByRole("dialog", { name: "Concluir MOM-12?" }));
    expect(dialog.getByText("O card tem 3 subitens abertos, que serão concluídos.")).toBeVisible();
    expect(updateCard).not.toHaveBeenCalled();
  });

  it("conclui o card depois da confirmação", async () => {
    const user = renderColumns();

    await user.selectOptions(screen.getByRole("combobox", { name: "Estado de MOM-12" }), "state-3");
    await user.click(await screen.findByRole("button", { name: "Concluir" }));

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({
      cardId: "card-12",
      cardStateId: "state-3",
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("deixa o card onde estava quando a pessoa volta atrás", async () => {
    const user = renderColumns();

    await user.selectOptions(screen.getByRole("combobox", { name: "Estado de MOM-12" }), "state-3");
    await user.click(await screen.findByRole("button", { name: "Voltar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(updateCard).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox", { name: "Estado de MOM-12" })).toHaveValue("state-1");
    expect(within(zone("Novo")).getByRole("link", { name: "Card 12" })).toBeVisible();
  });

  it("pergunta também quando o card com task aberta é solto na coluna concluída", async () => {
    renderColumns();

    fireEvent.dragStart(tile("Card 12"), { dataTransfer: dataTransfer() });
    fireEvent.dragOver(zone("Concluído"), { dataTransfer: dataTransfer() });
    fireEvent.drop(zone("Concluído"), { dataTransfer: dataTransfer() });

    expect(await screen.findByRole("dialog", { name: "Concluir MOM-12?" })).toBeVisible();
    expect(updateCard).not.toHaveBeenCalled();
  });

  it("não pergunta ao mover o card com task aberta para um estado que não conclui", async () => {
    const user = renderColumns();

    await user.selectOptions(screen.getByRole("combobox", { name: "Estado de MOM-12" }), "state-2");

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("CardStateColumns — arrastar entre colunas", () => {
  it("deixa arrastar os cartões", () => {
    renderColumns();

    expect(tile("Card 12")).toHaveAttribute("draggable", "true");
  });

  it("muda o estado do card solto na coluna de outro estado", async () => {
    renderColumns();

    fireEvent.dragStart(tile("Card 12"), { dataTransfer: dataTransfer() });
    fireEvent.dragOver(zone("Em andamento"), { dataTransfer: dataTransfer() });
    fireEvent.drop(zone("Em andamento"), { dataTransfer: dataTransfer() });

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({
      cardId: "card-12",
      cardStateId: "state-2",
    });
  });

  it("não chama a API quando o card é solto na coluna em que já está", () => {
    renderColumns();

    fireEvent.dragStart(tile("Card 12"), { dataTransfer: dataTransfer() });
    fireEvent.dragOver(zone("Novo"), { dataTransfer: dataTransfer() });
    fireEvent.drop(zone("Novo"), { dataTransfer: dataTransfer() });

    expect(updateCard).not.toHaveBeenCalled();
  });

  it("muda o estado e o responsável quando o card é solto na raia de outra pessoa", async () => {
    renderColumns(columns, true);

    fireEvent.dragStart(tile("Card 13"), { dataTransfer: dataTransfer() });
    fireEvent.dragOver(zone("Concluído de Ana Souza"), { dataTransfer: dataTransfer() });
    fireEvent.drop(zone("Concluído de Ana Souza"), { dataTransfer: dataTransfer() });

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({
      cardId: "card-13",
      cardStateId: "state-3",
    });
    expect(vi.mocked(setCardAssignee).mock.calls[0][0]).toEqual({
      cardId: "card-13",
      userId: "user-1",
    });
  });

  it("muda só o responsável quando o card é solto na raia de outra pessoa, na mesma coluna", async () => {
    vi.mocked(setCardAssignee).mockReturnValue(neverSettles());
    renderColumns(columns, true);

    fireEvent.dragStart(tile("Card 13"), { dataTransfer: dataTransfer() });
    fireEvent.dragOver(zone("Novo de Ana Souza"), { dataTransfer: dataTransfer() });
    fireEvent.drop(zone("Novo de Ana Souza"), { dataTransfer: dataTransfer() });

    expect(
      await within(zone("Novo de Ana Souza")).findByRole("link", { name: "Card 13" })
    ).toBeVisible();
    expect(vi.mocked(setCardAssignee).mock.calls[0][0]).toEqual({
      cardId: "card-13",
      userId: "user-1",
    });
    expect(updateCard).not.toHaveBeenCalled();
  });

  it("tira o responsável quando o card é solto na raia sem responsável", async () => {
    renderColumns(columns, true);

    fireEvent.dragStart(tile("Card 14"), { dataTransfer: dataTransfer() });
    fireEvent.dragOver(zone("Novo de Sem responsável"), { dataTransfer: dataTransfer() });
    fireEvent.drop(zone("Novo de Sem responsável"), { dataTransfer: dataTransfer() });

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({
      cardId: "card-14",
      cardStateId: "state-1",
    });
    expect(vi.mocked(setCardAssignee).mock.calls[0][0]).toEqual({
      cardId: "card-14",
      userId: null,
    });
  });

  it("não chama a API quando o card é solto na raia e na coluna em que já está", () => {
    renderColumns(columns, true);

    fireEvent.dragStart(tile("Card 12"), { dataTransfer: dataTransfer() });
    fireEvent.dragOver(zone("Novo de Ana Souza"), { dataTransfer: dataTransfer() });
    fireEvent.drop(zone("Novo de Ana Souza"), { dataTransfer: dataTransfer() });

    expect(updateCard).not.toHaveBeenCalled();
    expect(setCardAssignee).not.toHaveBeenCalled();
  });
});

describe("CardStateColumns — raias de todo o time", () => {
  function laneTitles() {
    return screen.getAllByRole("heading", { level: 3 }).map(heading => heading.textContent);
  }

  it("mostra uma raia vazia para quem do time ainda não tem card", async () => {
    simulateTeam([anaMemberDto, brunoMemberDto]);
    renderColumns(columns, true);

    const bruno = await screen.findByRole("heading", { name: "Bruno Lima" });

    expect(laneTitles()).toEqual(["Ana Souza", "Bruno Lima", "Sem responsável"]);
    expect(bruno.parentElement).toHaveTextContent("0 cards");
    expect(within(zone("Novo de Bruno Lima")).queryByRole("listitem")).toBeNull();
  });

  it("mostra a raia de sem responsável vazia quando todo card tem responsável", async () => {
    const assigned = [columns[1], columns[2]];
    renderColumns(assigned, true);

    expect(await screen.findByRole("heading", { name: "Sem responsável" })).toBeVisible();
    expect(laneTitles()).toEqual(["Ana Souza", "Sem responsável"]);
  });

  it("dá o card a quem do time não tinha card quando ele é solto na raia vazia dessa pessoa", async () => {
    simulateTeam([anaMemberDto, brunoMemberDto]);
    renderColumns(columns, true);
    await screen.findByRole("heading", { name: "Bruno Lima" });

    fireEvent.dragStart(tile("Card 13"), { dataTransfer: dataTransfer() });
    fireEvent.dragOver(zone("Novo de Bruno Lima"), { dataTransfer: dataTransfer() });
    fireEvent.drop(zone("Novo de Bruno Lima"), { dataTransfer: dataTransfer() });

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(vi.mocked(setCardAssignee).mock.calls[0][0]).toEqual({
      cardId: "card-13",
      userId: "user-2",
    });
    expect(updateCard).not.toHaveBeenCalled();
  });

  it("com uma pessoa escolhida no filtro, mostra só a raia dela, mesmo sem card", async () => {
    simulateTeam([anaMemberDto, brunoMemberDto]);
    renderColumns(emptyColumns, true, { assigneeId: "user-2" });

    expect(await screen.findByRole("heading", { name: "Bruno Lima" })).toBeVisible();
    expect(laneTitles()).toEqual(["Bruno Lima"]);
  });

  async function renderWithTeamLoaded() {
    simulateTeam([anaMemberDto, brunoMemberDto]);
    const shown = render(columnsElement(emptyColumns, true), {
      wrapper: createQueryWrapper().wrapper,
    });
    await screen.findByRole("heading", { name: "Bruno Lima" });

    return shown;
  }

  it("com sem responsável escolhido no filtro, mostra só essa raia", async () => {
    const { rerender } = await renderWithTeamLoaded();

    rerender(columnsElement(emptyColumns, true, { isUnassigned: true }));

    expect(laneTitles()).toEqual(["Sem responsável"]);
  });

  it("sem agrupar, não cria raia para o time", async () => {
    const { rerender } = await renderWithTeamLoaded();

    rerender(columnsElement(emptyColumns, false));

    expect(screen.queryAllByRole("heading", { level: 3 })).toEqual([]);
  });
});

describe("CardStateColumns — card novo no board", () => {
  const created: Card = {
    ...card(20, fresh, { type: "spike", title: "Avaliar SSE", priority: "high", assignee: ana }),
    description: "",
    fields: { type: "spike", question: "", deadline: null, conclusion: "" },
    createdAt: "2026-10-20T12:00:00Z",
  };

  const columnsWithCreated: CardStateColumn[] = [
    { ...columns[0], totalCount: 3, cards: [created, ...columns[0].cards] },
    columns[1],
    columns[2],
  ];

  async function openQuickCreate(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: "Novo card" }));

    return within(screen.getByRole("form", { name: "Novo card" }));
  }

  it("oferece o card novo só no topo da primeira coluna", () => {
    renderColumns();

    const firstHeader = screen.getByRole("heading", { name: "Novo" }).closest("header");

    expect(screen.getAllByRole("button", { name: "Novo card" })).toHaveLength(1);
    expect(firstHeader).toContainElement(screen.getByRole("button", { name: "Novo card" }));
  });

  it("cria com Enter, no primeiro estado e com os padrões da tela e do filtro salvo, e continua aberto e limpo", async () => {
    vi.mocked(createCard).mockResolvedValue(created);
    reload.mockResolvedValue(columnsWithCreated);
    const user = renderColumns(
      columns,
      false,
      { assigneeId: "user-1" },
      { ...NOTHING_SAVED, cardTypes: ["spike"], priorities: ["high"], assigneeIds: ["user-9"] }
    );
    const form = await openQuickCreate(user);

    expect(form.getByRole("combobox", { name: "Tipo do card novo" })).toHaveValue("spike");
    await user.type(
      form.getByRole("textbox", { name: "Título do card novo" }),
      "Avaliar SSE{Enter}"
    );

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(vi.mocked(createCard).mock.calls[0][0]).toMatchObject({
      projectId: "project-1",
      title: "Avaliar SSE",
      cardStateId: "state-1",
      priority: "high",
      assigneeId: "user-1",
      featureId: null,
      fields: { type: "spike" },
    });
    expect(toast.success).toHaveBeenCalledWith(
      "O card MOM-20 foi criado.",
      expect.objectContaining({ action: expect.objectContaining({ label: "Abrir o card" }) })
    );
    expect(toast.warning).not.toHaveBeenCalled();
    expect(screen.getByRole("form", { name: "Novo card" })).toBeVisible();
    expect(form.getByRole("textbox", { name: "Título do card novo" })).toHaveValue("");
    expect(form.getByRole("textbox", { name: "Título do card novo" })).toHaveFocus();
  });

  it("começa como user story, de prioridade média e sem responsável, sem filtro nem escolha na tela", async () => {
    vi.mocked(createCard).mockResolvedValue(created);
    const user = renderColumns();
    const form = await openQuickCreate(user);

    expect(form.getByRole("combobox", { name: "Tipo do card novo" })).toHaveValue("user_story");
    await user.type(
      form.getByRole("textbox", { name: "Título do card novo" }),
      "Avaliar SSE{Enter}"
    );

    await waitFor(() => expect(createCard).toHaveBeenCalledTimes(1));
    expect(vi.mocked(createCard).mock.calls[0][0]).toMatchObject({
      priority: "medium",
      assigneeId: null,
      featureId: null,
      fields: { type: "user_story" },
    });
  });

  it("fecha com Esc sem criar nada e devolve o foco ao botão", async () => {
    const user = renderColumns();
    const form = await openQuickCreate(user);

    await user.type(form.getByRole("textbox", { name: "Título do card novo" }), "Rascunho{Escape}");

    expect(screen.queryByRole("form", { name: "Novo card" })).toBeNull();
    expect(screen.getByRole("button", { name: "Novo card" })).toHaveFocus();
    expect(createCard).not.toHaveBeenCalled();
  });

  it("avisa, com a ação de abrir, quando o card criado não volta nas colunas do board", async () => {
    vi.mocked(createCard).mockResolvedValue(created);
    reload.mockResolvedValue(columns);
    const user = renderColumns();
    const form = await openQuickCreate(user);

    await user.type(
      form.getByRole("textbox", { name: "Título do card novo" }),
      "Avaliar SSE{Enter}"
    );

    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(
        "O card MOM-20 foi criado, mas não casa com o filtro deste board.",
        expect.objectContaining({ action: expect.objectContaining({ label: "Abrir o card" }) })
      )
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("não cria o card sem título", async () => {
    const user = renderColumns();
    const form = await openQuickCreate(user);

    await user.click(form.getByRole("button", { name: "Criar card" }));

    expect(await form.findByText("Informe o título do card.")).toBeVisible();
    expect(createCard).not.toHaveBeenCalled();
  });
});
