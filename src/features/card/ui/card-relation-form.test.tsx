import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import type { Card } from "../model/types/card.types";
import { CardRelationForm } from "./card-relation-form";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

type CardListParams = { project_id: string; q?: string };

const stateDto = { card_state_id: "state-1", name: "Novo", category: "to_do", position: 1 };

function cardDto(cardId: string, identifier: string, title: string, projectId = "project-1") {
  return {
    card_id: cardId,
    project_id: projectId,
    identifier,
    card_type: "issue",
    title,
    state: stateDto,
    priority: "medium",
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
    updated_at: "2026-10-17T12:00:00Z",
  };
}

const projectsDto = [
  { project_id: "project-1", name: "Momentum", key: "MOM", role: "member" },
  { project_id: "project-2", name: "Suporte", key: "SUP", role: "member" },
];

const cardsByProject: Record<string, ReturnType<typeof cardDto>[]> = {
  "project-1": [
    cardDto("card-1", "MOM-12", "Pagar a dívida do build"),
    cardDto("card-3", "MOM-13", "Filtro da lista de chamados"),
  ],
  "project-2": [cardDto("card-7", "SUP-7", "Lista de chamados vazia", "project-2")],
};

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
  updatedAt: "2026-10-17T12:00:00Z",
  description: "",
  fields: { type: "tech_debt", impact: "Build lento" },
  createdAt: "2026-10-12T09:00:00Z",
};

const onCreated = vi.fn();

function matches(dto: ReturnType<typeof cardDto>, search?: string) {
  if (!search) {
    return true;
  }

  const term = search.toLowerCase();

  return dto.identifier.toLowerCase() === term || dto.title.toLowerCase().includes(term);
}

function listCardsOf({ project_id, q }: CardListParams, totalCount?: number) {
  const items = (cardsByProject[project_id] ?? []).filter(dto => matches(dto, q));

  return { items, page: 1, page_size: 20, total_count: totalCount ?? items.length };
}

function simulateCore(totalCount?: number) {
  vi.mocked(api.get).mockImplementation((path: string, config?: { params?: unknown }) => {
    if (path === "/api/v1/projects") {
      return Promise.resolve({ data: projectsDto });
    }

    if (path === "/api/v1/cards") {
      return Promise.resolve({ data: listCardsOf(config?.params as CardListParams, totalCount) });
    }

    return Promise.reject(apiError(404, "NotFound", `Sem resposta simulada para ${path}.`));
  });
}

function cardRequests() {
  return vi
    .mocked(api.get)
    .mock.calls.filter(([path]) => path === "/api/v1/cards")
    .map(([, config]) => config?.params);
}

async function renderRelationForm(totalCount?: number) {
  simulateCore(totalCount);
  render(<CardRelationForm card={card} onCreated={onCreated} />, {
    wrapper: createQueryWrapper().wrapper,
  });
  await screen.findByRole("option", { name: "MOM-13 · Filtro da lista de chamados" });

  return userEvent.setup();
}

function cardOptions() {
  return within(screen.getByRole("combobox", { name: "Card" }))
    .getAllByRole("option")
    .map(option => option.textContent);
}

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post)
    .mockReset()
    .mockResolvedValue({
      data: {
        card_relation_id: "relation-1",
        relation: "blocked_by",
        card: {
          card_id: "card-7",
          identifier: "SUP-7",
          card_type: "issue",
          title: "Lista de chamados vazia",
          state_name: "Novo",
        },
      },
    });
  onCreated.mockClear();
});

describe("CardRelationForm — busca do outro card", () => {
  it("começa pelos cards não arquivados do projeto do card, sem o próprio card", async () => {
    await renderRelationForm();

    expect(cardOptions()).toEqual(["Escolha um card", "MOM-13 · Filtro da lista de chamados"]);
    expect(cardRequests()[0]).toEqual({ project_id: "project-1", page: 1, page_size: 20 });
    expect(screen.getByRole("searchbox", { name: "Buscar o outro card" })).toHaveAttribute(
      "maxLength",
      "100"
    );
  });

  it("busca no projeto escolhido pelo texto digitado", async () => {
    const user = await renderRelationForm();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Projeto do outro card" }),
      "project-2"
    );
    await user.type(screen.getByRole("searchbox", { name: "Buscar o outro card" }), "sup-7");

    await waitFor(() =>
      expect(cardRequests()).toContainEqual({
        project_id: "project-2",
        q: "sup-7",
        page: 1,
        page_size: 20,
      })
    );
    await screen.findByRole("option", { name: "SUP-7 · Lista de chamados vazia" });
    expect(cardOptions()).toEqual(["Escolha um card", "SUP-7 · Lista de chamados vazia"]);
  });

  it("diz quando nenhum card combina com a busca", async () => {
    const user = await renderRelationForm();

    await user.type(screen.getByRole("searchbox", { name: "Buscar o outro card" }), "board");

    expect(await screen.findByText("Nenhum card deste projeto combina com a busca.")).toBeVisible();
    expect(cardOptions()).toEqual(["Escolha um card"]);
  });

  it("pede para refinar a busca quando há mais cards do que os mostrados", async () => {
    await renderRelationForm(45);

    expect(
      screen.getByText(
        "Há mais cards do que os mostrados: refine a busca para achar o que procura."
      )
    ).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "Paginação" })).toBeNull();
  });

  it("cria a relação com o card achado pela busca", async () => {
    const user = await renderRelationForm();
    await user.selectOptions(screen.getByRole("combobox", { name: "Relação" }), "blocked_by");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Projeto do outro card" }),
      "project-2"
    );
    await user.type(screen.getByRole("searchbox", { name: "Buscar o outro card" }), "chamados");
    await screen.findByRole("option", { name: "SUP-7 · Lista de chamados vazia" });

    await user.selectOptions(screen.getByRole("combobox", { name: "Card" }), "card-7");
    await user.click(screen.getByRole("button", { name: "Criar relação" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(api.post).toHaveBeenCalledWith("/api/v1/cards/card-1/relations", {
      related_card_id: "card-7",
      relation: "blocked_by",
    });
  });
});
