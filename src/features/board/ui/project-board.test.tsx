import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import type { BoardView } from "../model/types/board.types";
import { ProjectBoard } from "./project-board";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

type Role = "administrator" | "member";

const NO_CRITERIA = {
  card_types: [],
  priorities: [],
  assignee_ids: [],
  feature_ids: [],
  epic_ids: [],
};

const allCardsDto = {
  board_id: "board-1",
  project_id: "project-1",
  name: "Todos os cards",
  filter: NO_CRITERIA,
  created_at: "2026-10-12T09:00:00Z",
  updated_at: "2026-10-12T09:00:00Z",
};

const issuesDto = {
  ...allCardsDto,
  board_id: "board-2",
  name: "Issues da Ana",
  filter: { ...NO_CRITERIA, card_types: ["issue"], assignee_ids: ["user-1", "user-9"] },
};

const freshDto = { card_state_id: "state-1", name: "Novo", category: "to_do", position: 1 };
const doneDto = { card_state_id: "state-2", name: "Concluído", category: "done", position: 2 };

const cardDto = {
  card_id: "card-1",
  project_id: "project-1",
  identifier: "MOM-12",
  card_type: "issue",
  title: "Lista de chamados vazia",
  state: freshDto,
  priority: "high",
  assignee: null,
  feature_id: null,
  progress: 0,
  task_count: 0,
  done_task_count: 0,
  subitem_counts: {
    task: { total_count: 0, done_count: 0 },
    bug: { total_count: 0, done_count: 0 },
    impediment: { total_count: 0, done_count: 0 },
  },
  archived: false,
  updated_at: "2026-10-13T12:00:00Z",
};

const columnsDto = [
  { state: freshDto, total_count: 1, cards: [cardDto] },
  { state: doneDto, total_count: 0, cards: [] },
];

const emptyColumnsDto = columnsDto.map(column => ({ ...column, total_count: 0, cards: [] }));

const membersDto = [
  { user_id: "user-1", name: "Ana Souza", email: "ana@exemplo.test", role: "administrator" },
  { user_id: "user-2", name: "Bruno Lima", email: "bruno@exemplo.test", role: "member" },
];

const featuresDto = [
  {
    feature_id: "feature-1",
    project_id: "project-1",
    epic_id: null,
    title: "Filtros da lista",
    progress: 0,
    state: "to_do",
    card_count: 0,
  },
];

const epicsDto = [
  {
    epic_id: "epic-1",
    project_id: "project-1",
    title: "Lista de cards",
    progress: 0,
    state: "to_do",
    feature_count: 0,
    card_count: 0,
  },
];

type Scenario = {
  role?: Role;
  boards?: unknown[];
  columns?: unknown[];
};

function simulateCore({ role = "administrator", boards = [], columns = columnsDto }: Scenario) {
  const responses: Record<string, unknown> = {
    "/api/v1/projects": [{ project_id: "project-1", name: "Momentum", key: "MOM", role }],
    "/api/v1/boards": boards,
    "/api/v1/boards/board-1/columns": columns,
    "/api/v1/boards/board-2/columns": columns,
    "/api/v1/projects/project-1/members": membersDto,
    "/api/v1/features": featuresDto,
    "/api/v1/epics": epicsDto,
    "/api/v1/boards/board-1/members": [],
  };

  vi.mocked(api.get).mockImplementation((path: string) =>
    path in responses
      ? Promise.resolve({ data: responses[path] })
      : Promise.reject(apiError(404, "NotFound", `Sem resposta simulada para ${path}.`))
  );
}

const DEFAULT_VIEW: BoardView = { level: "cards", isList: false, isGroupedByAssignee: false };
const MISSING_BOARD_NOTICE =
  "O board deste endereço não existe mais: a tela mostra o primeiro board do projeto.";
const onViewChange = vi.fn<(view: BoardView) => void>();
const reloadedColumns: unknown[] = [];

function renderBoard(scenario: Scenario, view = DEFAULT_VIEW, projectId = "project-1") {
  simulateCore(scenario);

  render(
    <ProjectBoard
      projectId={projectId}
      view={view}
      onViewChange={onViewChange}
      renderColumnsEditor={project => <p>Estados de {project.name} para editar</p>}
      renderColumns={({ columns, savedFilter, reload }) => (
        <>
          <button
            type="button"
            onClick={() => void reload().then(reloaded => reloadedColumns.push(reloaded))}
          >
            Reler as colunas
          </button>
          <ul aria-label="Colunas">
            {columns.map(column => (
              <li key={column.state.id}>
                {column.state.name}: {column.cards.map(card => card.identifier).join(", ")}
              </li>
            ))}
          </ul>
          <p>Responsáveis salvos: {savedFilter.assigneeIds.join(", ") || "nenhum"}</p>
          <p>Tipos salvos: {savedFilter.cardTypes.join(", ") || "nenhum"}</p>
        </>
      )}
      renderCardList={board => <p>Lista de cards de {board.name}</p>}
      renderGroups={({ board, level, isList }) => (
        <p>
          {isList ? "Lista" : "Board"} de {level} de {board.name}
        </p>
      )}
    />,
    { wrapper: createQueryWrapper().wrapper }
  );

  return userEvent.setup();
}

async function chooseBoardAction(user: ReturnType<typeof userEvent.setup>, action: string) {
  await user.click(await screen.findByRole("button", { name: /^Ações do board/ }));
  await user.click(screen.getByRole("menuitem", { name: action }));
}

function columnsRequests() {
  return vi
    .mocked(api.get)
    .mock.calls.filter(([path]) => path.endsWith("/columns"))
    .map(([path, config]) => [path, config?.params]);
}

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: issuesDto });
  vi.mocked(api.patch).mockReset().mockResolvedValue({ data: issuesDto });
  vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null });
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
  onViewChange.mockClear();
  reloadedColumns.length = 0;
});

describe("ProjectBoard — projeto sem board", () => {
  it("oferece criar o primeiro board a quem administra o projeto", async () => {
    const user = renderBoard({ role: "administrator" });

    expect(
      await screen.findByRole("heading", { name: "Este projeto ainda não tem board" })
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Criar o primeiro board" }));

    expect(await screen.findByRole("dialog", { name: "Novo board" })).toBeVisible();
  });

  it("explica a quem não administra, sem oferecer a criação", async () => {
    renderBoard({ role: "member" });

    expect(
      await screen.findByText(/Só o administrador do projeto cria boards: peça a ele o primeiro/)
    ).toBeVisible();
    expect(screen.queryByRole("link", { name: "Abrir a lista de cards" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Criar o primeiro board" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Novo board" })).toBeNull();
  });

  it("diz que o projeto não existe para quem não o enxerga", async () => {
    renderBoard({}, DEFAULT_VIEW, "project-9");

    expect(await screen.findByRole("heading", { name: "Projeto não encontrado" })).toBeVisible();
  });
});

describe("ProjectBoard — board escolhido", () => {
  it("mostra o primeiro board do projeto quando a URL não pede nenhum", async () => {
    renderBoard({ boards: [allCardsDto, issuesDto] });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Boards de Momentum" })
    ).toBeVisible();
    expect(await screen.findByRole("combobox", { name: "Board" })).toHaveValue("board-1");
    expect(await screen.findByText("Novo: MOM-12")).toBeVisible();
    expect(columnsRequests()).toEqual([
      ["/api/v1/boards/board-1/columns", { assignee_id: undefined }],
    ]);
  });

  it("mostra o board e o responsável pedidos na URL", async () => {
    renderBoard(
      { boards: [allCardsDto, issuesDto] },
      { ...DEFAULT_VIEW, boardId: "board-2", assigneeId: "user-2", isGroupedByAssignee: true }
    );

    expect(await screen.findByRole("combobox", { name: "Board" })).toHaveValue("board-2");
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Responsável" })).toHaveValue("user-2")
    );
    expect(screen.getByRole("combobox", { name: "Agrupar por" })).toHaveValue("assignee");
    expect(columnsRequests()).toEqual([
      ["/api/v1/boards/board-2/columns", { assignee_id: "user-2" }],
    ]);
  });

  it("mostra o primeiro board, com um aviso, quando o da URL não existe mais", async () => {
    renderBoard({ boards: [allCardsDto, issuesDto] }, { ...DEFAULT_VIEW, boardId: "board-9" });

    expect(await screen.findByRole("combobox", { name: "Board" })).toHaveValue("board-1");
    expect(screen.getByText(MISSING_BOARD_NOTICE)).toBeVisible();
  });

  it("entrega às colunas o filtro salvo do board", async () => {
    renderBoard({ boards: [allCardsDto, issuesDto] }, { ...DEFAULT_VIEW, boardId: "board-2" });

    expect(await screen.findByText("Responsáveis salvos: user-1, user-9")).toBeVisible();
    expect(screen.getByText("Tipos salvos: issue")).toBeVisible();
  });

  it("entrega às colunas a releitura, que devolve as colunas relidas", async () => {
    const user = renderBoard({ boards: [allCardsDto] });

    await user.click(await screen.findByRole("button", { name: "Reler as colunas" }));

    await waitFor(() => expect(reloadedColumns).toHaveLength(1));
    expect(reloadedColumns[0]).toEqual([
      expect.objectContaining({
        totalCount: 1,
        cards: [expect.objectContaining({ id: "card-1" })],
      }),
      expect.objectContaining({ totalCount: 0, cards: [] }),
    ]);
  });

  it("devolve nada na releitura quando as colunas não puderam ser relidas", async () => {
    const user = renderBoard({ boards: [allCardsDto] });
    await screen.findByRole("button", { name: "Reler as colunas" });
    vi.mocked(api.get).mockRejectedValue(apiError(503, "Unavailable", "Serviço indisponível."));

    await user.click(screen.getByRole("button", { name: "Reler as colunas" }));

    await waitFor(() => expect(reloadedColumns).toEqual([undefined]));
  });

  it("não avisa nada quando o board da URL existe ou a URL não pede nenhum", async () => {
    renderBoard({ boards: [allCardsDto, issuesDto] }, { ...DEFAULT_VIEW, boardId: "board-2" });

    expect(await screen.findByRole("combobox", { name: "Board" })).toHaveValue("board-2");
    expect(screen.queryByText(MISSING_BOARD_NOTICE)).toBeNull();
  });

  it("oferece só os cards sem responsável no seletor de responsável", async () => {
    const user = renderBoard({ boards: [allCardsDto] });
    await screen.findByRole("option", { name: "Bruno Lima" });

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Responsável" }),
      "Sem responsável"
    );

    expect(onViewChange).toHaveBeenCalledWith({
      ...DEFAULT_VIEW,
      assigneeId: undefined,
      isUnassigned: true,
      isGroupedByAssignee: false,
    });
  });

  it("mostra só os cards sem responsável quando a URL pede", async () => {
    renderBoard(
      { boards: [allCardsDto], columns: emptyColumnsDto },
      { ...DEFAULT_VIEW, isUnassigned: true, isGroupedByAssignee: false }
    );

    expect(
      await screen.findByText("Nenhum card sem responsável casa com o filtro do board.")
    ).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Responsável" })).toHaveValue("unassigned");
    expect(columnsRequests()).toEqual([
      ["/api/v1/boards/board-1/columns", { assignee_id: undefined, unassigned: true }],
    ]);
  });

  it("troca sem responsável por uma pessoa sem misturar os dois", async () => {
    const user = renderBoard(
      { boards: [allCardsDto] },
      { ...DEFAULT_VIEW, isUnassigned: true, isGroupedByAssignee: false }
    );
    await screen.findByRole("option", { name: "Bruno Lima" });

    await user.selectOptions(screen.getByRole("combobox", { name: "Responsável" }), "Bruno Lima");

    expect(onViewChange).toHaveBeenCalledWith({
      ...DEFAULT_VIEW,
      assigneeId: "user-2",
      isUnassigned: undefined,
      isGroupedByAssignee: false,
    });
  });

  it("pede a troca de board, de responsável e de agrupamento a quem cuida da URL", async () => {
    const user = renderBoard({ boards: [allCardsDto, issuesDto] });
    await screen.findByRole("option", { name: "Bruno Lima" });

    await user.selectOptions(screen.getByRole("combobox", { name: "Board" }), "Issues da Ana");
    await user.selectOptions(screen.getByRole("combobox", { name: "Responsável" }), "Bruno Lima");
    await user.selectOptions(screen.getByRole("combobox", { name: "Agrupar por" }), "Responsável");

    expect(onViewChange.mock.calls).toEqual([
      [{ ...DEFAULT_VIEW, boardId: "board-2", isGroupedByAssignee: false }],
      [{ ...DEFAULT_VIEW, assigneeId: "user-2", isGroupedByAssignee: false }],
      [{ ...DEFAULT_VIEW, isGroupedByAssignee: true }],
    ]);
  });

  it("troca a visão do board entre cards, features e epics, e entre board e lista", async () => {
    const user = renderBoard({ boards: [allCardsDto] });
    await screen.findByRole("list", { name: "Colunas" });

    await user.selectOptions(screen.getByRole("combobox", { name: "Visão" }), "Features");
    await user.click(screen.getByRole("button", { name: "Ver como lista" }));

    expect(onViewChange.mock.calls).toEqual([
      [{ ...DEFAULT_VIEW, level: "features" }],
      [{ ...DEFAULT_VIEW, isList: true }],
    ]);
  });

  it("mostra a lista de cards do board, sem o agrupamento das colunas", async () => {
    renderBoard({ boards: [allCardsDto] }, { ...DEFAULT_VIEW, isList: true });

    expect(await screen.findByText("Lista de cards de Todos os cards")).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Responsável" })).toBeVisible();
    expect(screen.queryByRole("combobox", { name: "Agrupar por" })).toBeNull();
    expect(screen.getByRole("button", { name: "Ver como board" })).toBeVisible();
    expect(columnsRequests()).toEqual([]);
  });

  it("mostra as features e os epics do board escolhido, sem os filtros de cards", async () => {
    renderBoard({ boards: [allCardsDto] }, { ...DEFAULT_VIEW, level: "epics" });

    expect(await screen.findByText("Board de epics de Todos os cards")).toBeVisible();
    expect(screen.queryByRole("combobox", { name: "Responsável" })).toBeNull();
    expect(screen.getByRole("combobox", { name: "Visão" })).toHaveValue("epics");
    expect(columnsRequests()).toEqual([]);
  });

  it("volta a todos os responsáveis", async () => {
    const user = renderBoard(
      { boards: [allCardsDto] },
      { ...DEFAULT_VIEW, assigneeId: "user-2", isGroupedByAssignee: false }
    );
    await screen.findByRole("option", { name: "Bruno Lima" });

    await user.selectOptions(screen.getByRole("combobox", { name: "Responsável" }), "Todos");

    expect(onViewChange).toHaveBeenCalledWith({
      ...DEFAULT_VIEW,
      assigneeId: undefined,
      isGroupedByAssignee: false,
    });
  });

  it("avisa quando nenhum card casa com o filtro do board", async () => {
    renderBoard({ boards: [allCardsDto], columns: emptyColumnsDto });

    expect(await screen.findByText("Nenhum card casa com o filtro deste board.")).toBeVisible();
    expect(screen.getByRole("list", { name: "Colunas" })).toBeVisible();
  });

  it("avisa quando o responsável escolhido não tem card no board", async () => {
    renderBoard(
      { boards: [allCardsDto], columns: emptyColumnsDto },
      { ...DEFAULT_VIEW, assigneeId: "user-2", isGroupedByAssignee: false }
    );

    expect(
      await screen.findByText("Nenhum card deste responsável casa com o filtro do board.")
    ).toBeVisible();
  });

  it("mostra a mensagem do Core quando as colunas não carregam", async () => {
    renderBoard({ boards: [{ ...allCardsDto, board_id: "board-7" }] });

    expect(
      await screen.findByRole("heading", { name: "Não foi possível carregar o board" })
    ).toBeVisible();
    expect(
      screen.getByText("Sem resposta simulada para /api/v1/boards/board-7/columns.")
    ).toBeVisible();
  });

  it("não mostra criar, editar nem excluir a quem não administra o projeto", async () => {
    renderBoard({ role: "member", boards: [allCardsDto] });

    expect(await screen.findByText("Novo: MOM-12")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Novo board" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Ações do board/ })).toBeNull();
  });
});

describe("ProjectBoard — administração do board", () => {
  it("guarda editar, editar colunas, acesso e excluir no menu do board", async () => {
    const user = renderBoard({ boards: [allCardsDto] });

    await user.click(await screen.findByRole("button", { name: "Ações do board Todos os cards" }));

    expect(screen.getAllByRole("menuitem").map(item => item.textContent)).toEqual([
      "Editar board",
      "Editar colunas",
      "Acesso ao board",
      "Excluir",
    ]);
    expect(screen.queryByRole("button", { name: "Editar board" })).toBeNull();
  });

  it("mostra o selo de acesso restrito no board que só pessoas escolhidas veem", async () => {
    renderBoard({ boards: [{ ...allCardsDto, visibility: "members" }] });

    expect(await screen.findByText("Acesso restrito")).toBeVisible();
  });

  it("restringe o board às pessoas escolhidas pelo menu de acesso", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { ...allCardsDto, visibility: "members" } });
    const user = renderBoard({ boards: [{ ...allCardsDto, visibility: "team" }] });

    await chooseBoardAction(user, "Acesso ao board");
    const dialog = within(
      await screen.findByRole("dialog", { name: "Acesso ao board Todos os cards" })
    );
    expect(await dialog.findByText("Todo o time vê este board")).toBeVisible();
    expect(dialog.getByText("Bruno Lima")).toBeVisible();
    await user.click(dialog.getByRole("radio", { name: /Só as pessoas escolhidas/ }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/api/v1/boards/board-1", { visibility: "members" })
    );
  });

  it("dá acesso a alguém do time num board restrito e mostra os administradores que sempre veem", async () => {
    const user = renderBoard({ boards: [{ ...allCardsDto, visibility: "members" }] });

    await chooseBoardAction(user, "Acesso ao board");
    const dialog = within(
      await screen.findByRole("dialog", { name: "Acesso ao board Todos os cards" })
    );
    const people = within(await dialog.findByRole("list", { name: "Quem vê este board" }));
    expect(people.getByText("Ana Souza")).toBeVisible();
    expect(people.getByText("Administrador")).toBeVisible();
    await user.selectOptions(dialog.getByLabelText("Dar acesso a"), "user-2");
    await user.click(dialog.getByRole("button", { name: "Dar acesso" }));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("/api/v1/boards/board-1/members/user-2")
    );
  });

  it("abre a edição das colunas, que são os estados do projeto", async () => {
    const user = renderBoard({ boards: [allCardsDto] });

    await chooseBoardAction(user, "Editar colunas");

    const dialog = within(await screen.findByRole("dialog", { name: "Editar colunas" }));
    expect(dialog.getByText("Estados de Momentum para editar")).toBeVisible();
    expect(
      dialog.getByText(
        "Cada coluna é um estado do projeto, na ordem do fluxo, e vale para todos os boards dele."
      )
    ).toBeVisible();
  });

  it("cria o board com o nome e os critérios marcados, e passa a mostrá-lo", async () => {
    const user = renderBoard({ boards: [allCardsDto] });

    await user.click(await screen.findByRole("button", { name: "Novo board" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Novo board" }));
    await user.type(await dialog.findByRole("textbox", { name: "Nome" }), "Issues da Ana");
    await user.click(dialog.getByRole("checkbox", { name: "Issue" }));
    await user.click(dialog.getByRole("checkbox", { name: "Ana Souza" }));
    await user.click(dialog.getByRole("checkbox", { name: "Filtros da lista" }));
    await user.click(dialog.getByRole("checkbox", { name: "Lista de cards" }));
    await user.click(dialog.getByRole("button", { name: "Criar board" }));

    await waitFor(() =>
      expect(onViewChange).toHaveBeenCalledWith({
        ...DEFAULT_VIEW,
        boardId: "board-2",
        isGroupedByAssignee: false,
      })
    );
    expect(api.post).toHaveBeenCalledWith("/api/v1/boards", {
      project_id: "project-1",
      name: "Issues da Ana",
      filter: {
        card_types: ["issue"],
        priorities: [],
        assignee_ids: ["user-1"],
        feature_ids: ["feature-1"],
        epic_ids: ["epic-1"],
      },
    });
    expect(screen.queryByRole("dialog", { name: "Novo board" })).toBeNull();
  });

  it("mostra no campo o nome repetido e mantém o diálogo aberto", async () => {
    vi.mocked(api.post).mockRejectedValue(
      apiError(409, "BoardNameAlreadyUsed", "Já existe um board com este nome no projeto.", {
        property: "name",
      })
    );
    const user = renderBoard({ boards: [allCardsDto] });

    await user.click(await screen.findByRole("button", { name: "Novo board" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Novo board" }));
    await user.type(await dialog.findByRole("textbox", { name: "Nome" }), "Todos os cards");
    await user.click(dialog.getByRole("button", { name: "Criar board" }));

    expect(await dialog.findByText("Já existe um board com este nome no projeto.")).toBeVisible();
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it("abre a edição com o nome e o filtro do board, e avisa do que não existe mais", async () => {
    const user = renderBoard(
      { boards: [allCardsDto, issuesDto] },
      { ...DEFAULT_VIEW, boardId: "board-2" }
    );

    await chooseBoardAction(user, "Editar board");
    const dialog = within(await screen.findByRole("dialog", { name: "Editar board" }));

    expect(await dialog.findByRole("textbox", { name: "Nome" })).toHaveValue("Issues da Ana");
    expect(dialog.getByRole("checkbox", { name: "Issue" })).toBeChecked();
    expect(dialog.getByRole("checkbox", { name: "Spike" })).not.toBeChecked();
    expect(dialog.getByRole("checkbox", { name: "Ana Souza" })).toBeChecked();
    expect(dialog.getByRole("checkbox", { name: "Bruno Lima" })).not.toBeChecked();
    expect(dialog.getByText(/Ao salvar, o que não existe mais sai do filtro/)).toBeVisible();
  });

  it("grava o nome novo e o filtro inteiro, sem o que não existe mais", async () => {
    const user = renderBoard(
      { boards: [allCardsDto, issuesDto] },
      { ...DEFAULT_VIEW, boardId: "board-2" }
    );

    await chooseBoardAction(user, "Editar board");
    const dialog = within(await screen.findByRole("dialog", { name: "Editar board" }));
    const name = await dialog.findByRole("textbox", { name: "Nome" });
    await user.clear(name);
    await user.type(name, "Issues urgentes");
    await user.click(dialog.getByRole("checkbox", { name: "Urgente" }));
    await user.click(dialog.getByRole("button", { name: "Salvar board" }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/api/v1/boards/board-2", {
        name: "Issues urgentes",
        filter: {
          card_types: ["issue"],
          priorities: ["urgent"],
          assignee_ids: ["user-1"],
          feature_ids: [],
          epic_ids: [],
        },
      })
    );
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Editar board" })).toBeNull());
  });

  it("não avisa de filtro velho no board cujo filtro está em dia", async () => {
    const user = renderBoard({ boards: [allCardsDto] });

    await chooseBoardAction(user, "Editar board");
    const dialog = within(await screen.findByRole("dialog", { name: "Editar board" }));
    await dialog.findByRole("textbox", { name: "Nome" });

    expect(dialog.queryByText(/sai do filtro/)).toBeNull();
  });

  it("só exclui o board depois da confirmação, e volta ao primeiro board", async () => {
    const user = renderBoard(
      { boards: [allCardsDto, issuesDto] },
      { ...DEFAULT_VIEW, boardId: "board-2" }
    );

    await chooseBoardAction(user, "Excluir");
    const dialog = within(
      await screen.findByRole("dialog", { name: "Excluir o board Issues da Ana?" })
    );

    expect(api.delete).not.toHaveBeenCalled();

    await user.click(dialog.getByRole("button", { name: "Excluir board" }));

    await waitFor(() =>
      expect(onViewChange).toHaveBeenCalledWith({
        ...DEFAULT_VIEW,
        boardId: undefined,
        isGroupedByAssignee: false,
      })
    );
    expect(api.delete).toHaveBeenCalledWith("/api/v1/boards/board-2");
    expect(toast.success).toHaveBeenCalledWith("O board Issues da Ana foi excluído.");
  });

  it("não avisa que o board não existe mais quando quem o excluiu foi a própria tela", async () => {
    const user = renderBoard(
      { boards: [allCardsDto, issuesDto] },
      { ...DEFAULT_VIEW, boardId: "board-2" }
    );

    await chooseBoardAction(user, "Excluir");
    simulateCore({ boards: [allCardsDto] });
    await user.click(await screen.findByRole("button", { name: "Excluir board" }));

    await waitFor(() => expect(onViewChange).toHaveBeenCalled());
    expect(await screen.findByRole("combobox", { name: "Board" })).toHaveValue("board-1");
    expect(screen.queryByText(MISSING_BOARD_NOTICE)).toBeNull();
  });

  it("mostra a recusa do Core quando quem exclui deixou de administrar o projeto", async () => {
    vi.mocked(api.delete).mockRejectedValue(
      apiError(
        403,
        "BoardAdministrationDenied",
        "Só o administrador do projeto cria, altera e exclui boards."
      )
    );
    const user = renderBoard({ boards: [allCardsDto] });

    await chooseBoardAction(user, "Excluir");
    await user.click(await screen.findByRole("button", { name: "Excluir board" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Só o administrador do projeto cria, altera e exclui boards."
      )
    );
    expect(onViewChange).not.toHaveBeenCalled();
  });
});
