import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import {
  createCard,
  getCard,
  listCards,
  listCardStates,
  setCardAssignee,
  setCardFeature,
  updateCard,
} from "./card.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const stateDto = { card_state_id: "state-1", name: "Novo", category: "to_do", position: 1 };
const state = { id: "state-1", name: "Novo", category: "to_do", position: 1 };

const summaryDto = {
  card_id: "card-1",
  project_id: "project-1",
  identifier: "MOM-12",
  card_type: "user_story",
  title: "Filtrar cards por responsável",
  state: stateDto,
  priority: "high",
  assignee: { user_id: "user-1", name: "Ana Souza" },
  feature_id: null,
  progress: 40,
  task_count: 5,
  done_task_count: 2,
  subitem_counts: {
    task: { total_count: 3, done_count: 2 },
    bug: { total_count: 1, done_count: 0 },
    impediment: { total_count: 1, done_count: 0 },
  },
  archived: false,
  updated_at: "2026-10-13T12:00:00Z",
};

const summary = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "user_story",
  title: "Filtrar cards por responsável",
  state,
  priority: "high",
  assignee: { userId: "user-1", name: "Ana Souza" },
  featureId: null,
  progress: 40,
  taskCount: 5,
  doneTaskCount: 2,
  subitemCounts: {
    task: { total: 3, done: 2 },
    bug: { total: 1, done: 0 },
    impediment: { total: 1, done: 0 },
  },
  isArchived: false,
  updatedAt: "2026-10-13T12:00:00Z",
};

const cardDto = {
  ...summaryDto,
  description: "Como P.O, quero filtrar a lista.",
  user_story: { acceptance_criteria: ["Mostra só os cards da pessoa"] },
  spike: null,
  issue: null,
  tech_debt: null,
  created_at: "2026-10-12T09:00:00Z",
};

const card = {
  ...summary,
  description: "Como P.O, quero filtrar a lista.",
  fields: { type: "user_story", acceptanceCriteria: ["Mostra só os cards da pessoa"] },
  createdAt: "2026-10-12T09:00:00Z",
};

const issueFields = {
  type: "issue",
  stepsToReproduce: "Abrir a lista",
  expectedBehavior: "Mostrar os cards",
  observedBehavior: "Lista vazia",
  severity: "critical",
  location: "Lista de cards",
} as const;

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: cardDto });
  vi.mocked(api.patch).mockReset().mockResolvedValue({ data: cardDto });
  vi.mocked(api.put).mockReset().mockResolvedValue({ data: null });
  vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null });
});

describe("listCards", () => {
  it("adapta a página de cards do contrato e calcula o total de páginas", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [summaryDto], page: 2, page_size: 20, total_count: 41 },
    });

    await expect(
      listCards({ projectId: "project-1", includesArchived: false, page: 2 })
    ).resolves.toEqual({ cards: [summary], page: 2, totalPages: 3 });
  });

  it("manda o projeto, a página e só os filtros escolhidos", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [], page: 1, page_size: 20, total_count: 0 },
    });

    await listCards({
      projectId: "project-1",
      type: "issue",
      stateId: "state-1",
      assigneeId: "user-1",
      includesArchived: true,
      page: 1,
    });

    expect(api.get).toHaveBeenCalledWith("/api/v1/cards", {
      params: {
        project_id: "project-1",
        card_type: "issue",
        card_state_id: "state-1",
        assignee_id: "user-1",
        archived: true,
        page: 1,
        page_size: 20,
      },
    });
  });

  it("pede só os cards da feature escolhida", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [], page: 1, page_size: 20, total_count: 0 },
    });

    await listCards({
      projectId: "project-1",
      featureId: "feature-1",
      includesArchived: false,
      page: 1,
    });

    expect(api.get).toHaveBeenCalledWith("/api/v1/cards", {
      params: { project_id: "project-1", feature_id: "feature-1", page: 1, page_size: 20 },
    });
  });

  it("busca pelo texto pedido, sem os arquivados", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [], page: 1, page_size: 20, total_count: 0 },
    });

    await listCards({ projectId: "project-1", search: "MOM-12", includesArchived: false, page: 1 });

    expect(api.get).toHaveBeenCalledWith("/api/v1/cards", {
      params: { project_id: "project-1", q: "MOM-12", page: 1, page_size: 20 },
    });
  });

  it("não pede os arquivados quando o filtro está desligado", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [], page: 1, page_size: 20, total_count: 0 },
    });

    await listCards({ projectId: "project-1", includesArchived: false, page: 1 });

    expect(api.get).toHaveBeenCalledWith("/api/v1/cards", {
      params: { project_id: "project-1", page: 1, page_size: 20 },
    });
  });

  it("devolve uma página só quando o projeto ainda não tem card", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [], page: 1, page_size: 20, total_count: 0 },
    });

    await expect(
      listCards({ projectId: "project-1", includesArchived: false, page: 1 })
    ).resolves.toEqual({ cards: [], page: 1, totalPages: 1 });
  });

  it("lê como número os inteiros que o contrato também aceita como texto", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [{ ...summaryDto, progress: "40", task_count: "5", done_task_count: "2" }],
        page: "1",
        page_size: "20",
        total_count: "1",
      },
    });

    await expect(
      listCards({ projectId: "project-1", includesArchived: false, page: 1 })
    ).resolves.toEqual({ cards: [summary], page: 1, totalPages: 1 });
  });
});

describe("getCard", () => {
  it("adapta o card do contrato, com os campos do tipo dele", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: cardDto });

    await expect(getCard("card-1")).resolves.toEqual(card);
    expect(api.get).toHaveBeenCalledWith("/api/v1/cards/card-1");
  });

  it("traz a feature em que o card está", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...cardDto, feature_id: "feature-1" } });

    await expect(getCard("card-1")).resolves.toMatchObject({ featureId: "feature-1" });
  });

  it("deixa o card sem responsável quando o contrato não traz um", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...cardDto, assignee: null } });

    await expect(getCard("card-1")).resolves.toMatchObject({ assignee: null });
  });

  it.each([
    [
      "spike",
      { spike: { question: "Vale usar SSE?", deadline: "2026-10-20", conclusion: null } },
      { type: "spike", question: "Vale usar SSE?", deadline: "2026-10-20", conclusion: "" },
    ],
    [
      "issue",
      {
        issue: {
          steps_to_reproduce: "Abrir a lista",
          expected_behavior: "Mostrar os cards",
          observed_behavior: "Lista vazia",
          severity: "critical",
          location: "Lista de cards",
        },
      },
      issueFields,
    ],
    [
      "tech_debt",
      { tech_debt: { impact: "Build lento" } },
      { type: "tech_debt", impact: "Build lento" },
    ],
  ])("lê os campos do tipo %s", async (cardType, group, fields) => {
    vi.mocked(api.get).mockResolvedValue({
      data: { ...cardDto, user_story: null, card_type: cardType, ...group },
    });

    await expect(getCard("card-1")).resolves.toMatchObject({ type: cardType, fields });
  });

  it("trata como vazio o grupo do tipo que veio nulo", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { ...cardDto, card_type: "issue", user_story: null },
    });

    await expect(getCard("card-1")).resolves.toMatchObject({
      fields: {
        type: "issue",
        stepsToReproduce: "",
        expectedBehavior: "",
        observedBehavior: "",
        severity: null,
        location: "",
      },
    });
  });
});

describe("createCard", () => {
  it("cria o card com o grupo do tipo dele e devolve o card criado", async () => {
    await expect(
      createCard({
        projectId: "project-1",
        title: "Lista vazia",
        description: "",
        cardStateId: "state-1",
        priority: "urgent",
        assigneeId: "user-1",
        featureId: "feature-1",
        fields: issueFields,
      })
    ).resolves.toEqual(card);

    expect(api.post).toHaveBeenCalledWith("/api/v1/cards", {
      project_id: "project-1",
      card_type: "issue",
      title: "Lista vazia",
      description: "",
      card_state_id: "state-1",
      priority: "urgent",
      assignee_id: "user-1",
      feature_id: "feature-1",
      issue: {
        steps_to_reproduce: "Abrir a lista",
        expected_behavior: "Mostrar os cards",
        observed_behavior: "Lista vazia",
        severity: "critical",
        location: "Lista de cards",
      },
    });
  });

  it("deixa o Core escolher o estado e cria sem responsável nem feature quando nada foi escolhido", async () => {
    await createCard({
      projectId: "project-1",
      title: "Pagar a dívida do build",
      description: "",
      cardStateId: null,
      priority: "medium",
      assigneeId: null,
      featureId: null,
      fields: { type: "tech_debt", impact: "Build lento" },
    });

    expect(vi.mocked(api.post).mock.calls[0][1]).toMatchObject({
      card_state_id: null,
      assignee_id: null,
      feature_id: null,
      tech_debt: { impact: "Build lento" },
    });
  });
});

describe("updateCard", () => {
  it("manda nulo no que não muda, para o Core manter o valor", async () => {
    await expect(updateCard({ cardId: "card-1", cardStateId: "state-2" })).resolves.toEqual(card);

    expect(api.patch).toHaveBeenCalledWith("/api/v1/cards/card-1", {
      expected_updated_at: null,
      title: null,
      description: null,
      card_state_id: "state-2",
      archived: null,
    });
  });

  it("manda a versão que a pessoa leu, quando há uma", async () => {
    await updateCard({
      cardId: "card-1",
      title: "Novo título",
      expectedUpdatedAt: "2026-10-17T12:00:00Z",
    });

    expect(vi.mocked(api.patch).mock.calls[0][1]).toMatchObject({
      expected_updated_at: "2026-10-17T12:00:00Z",
      title: "Novo título",
    });
  });

  it("manda a descrição vazia como texto vazio, que é como o Core a apaga", async () => {
    await updateCard({ cardId: "card-1", title: "Novo título", description: "" });

    expect(vi.mocked(api.patch).mock.calls[0][1]).toMatchObject({
      title: "Novo título",
      description: "",
    });
  });

  it("manda o grupo do tipo inteiro, com o prazo nulo para limpar o prazo do spike", async () => {
    await updateCard({
      cardId: "card-1",
      fields: { type: "spike", question: "Vale usar SSE?", deadline: null, conclusion: "" },
    });

    expect(vi.mocked(api.patch).mock.calls[0][1]).toMatchObject({
      spike: { question: "Vale usar SSE?", deadline: null, conclusion: "" },
    });
  });

  it("manda os critérios de aceite da user story como lista", async () => {
    await updateCard({
      cardId: "card-1",
      fields: { type: "user_story", acceptanceCriteria: ["Primeiro", "Segundo"] },
    });

    expect(vi.mocked(api.patch).mock.calls[0][1]).toMatchObject({
      user_story: { acceptance_criteria: ["Primeiro", "Segundo"] },
    });
  });

  it.each([
    [true, "arquiva"],
    [false, "desarquiva"],
  ])("manda archived %j quando %s o card", async isArchived => {
    await updateCard({ cardId: "card-1", isArchived });

    expect(vi.mocked(api.patch).mock.calls[0][1]).toMatchObject({ archived: isArchived });
  });

  it("muda a prioridade sem mandar o grupo do tipo", async () => {
    await updateCard({ cardId: "card-1", priority: "low" });

    const payload = vi.mocked(api.patch).mock.calls[0][1];

    expect(payload).toMatchObject({ priority: "low" });
    expect(payload).not.toHaveProperty("user_story");
    expect(payload).not.toHaveProperty("spike");
    expect(payload).not.toHaveProperty("issue");
    expect(payload).not.toHaveProperty("tech_debt");
  });
});

describe("setCardAssignee", () => {
  it("define o responsável pela rota própria, com a pessoa no corpo", async () => {
    await setCardAssignee({ cardId: "card-1", userId: "user-2" });

    expect(api.put).toHaveBeenCalledWith("/api/v1/cards/card-1/assignee", { user_id: "user-2" });
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("tira o responsável pela rota de exclusão, sem corpo", async () => {
    await setCardAssignee({ cardId: "card-1", userId: null });

    expect(api.delete).toHaveBeenCalledWith("/api/v1/cards/card-1/assignee");
    expect(api.put).not.toHaveBeenCalled();
  });
});

describe("setCardFeature", () => {
  it("põe o card na feature pela rota própria, sem passar pelo PATCH", async () => {
    await setCardFeature({ cardId: "card-1", featureId: "feature-1" });

    expect(api.put).toHaveBeenCalledWith("/api/v1/cards/card-1/feature", {
      feature_id: "feature-1",
    });
    expect(api.patch).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("tira o card da feature pela rota de exclusão, sem corpo", async () => {
    await setCardFeature({ cardId: "card-1", featureId: null });

    expect(api.delete).toHaveBeenCalledWith("/api/v1/cards/card-1/feature");
    expect(api.put).not.toHaveBeenCalled();
  });
});

describe("listCardStates", () => {
  it("adapta os estados do projeto, na ordem do fluxo que o Core devolve", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        stateDto,
        { card_state_id: "state-2", name: "Em andamento", category: "in_progress", position: 2 },
      ],
    });

    await expect(listCardStates("project-1")).resolves.toEqual([
      state,
      { id: "state-2", name: "Em andamento", category: "in_progress", position: 2 },
    ]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/card-states", {
      params: { project_id: "project-1" },
    });
  });
});
