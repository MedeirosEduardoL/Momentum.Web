import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Card } from "@/features/card";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { CardInterviews } from "./card-interviews";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
  REQUESTED_WITH_HEADER: { "X-Requested-With": "XMLHttpRequest" },
  session: { renewAfter: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const ROUNDS_PATH = "/api/v1/card-interviews/interview-1/rounds";
const PROPOSALS_PATH = "/api/v1/card-interviews/interview-1/proposals";
const encoder = new TextEncoder();
const fetchMock = vi.fn<typeof fetch>();

const card: Card = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "user_story",
  title: "Filtrar a lista de cards",
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
  description: "A lista precisa de filtro.",
  fields: { type: "user_story", acceptanceCriteria: ["O filtro fica na URL."] },
  createdAt: "2026-10-12T09:00:00Z",
};

const firstRoundDto = {
  number: 1,
  questions: [
    {
      title: "Quem usa o filtro?",
      body: "O card não diz **quem** filtra. Veja [o guia](https://atacante.exemplo.test/guia).<script>window.hacked = true</script>",
      recommended_answer: "O P.O, ao revisar o backlog.",
    },
    {
      title: "O filtro fica na URL?",
      body: "",
      recommended_answer: "Sim, para o endereço poder ser copiado.",
    },
  ],
  answers: null as { question: number; answer: string }[] | null,
  created_at: "2026-10-13T15:00:00Z",
  answered_at: null as string | null,
};

const firstRoundAnsweredDto = {
  ...firstRoundDto,
  answers: [{ question: 1, answer: "Só o **P.O**." }],
  answered_at: "2026-10-13T15:05:00Z",
};

const secondRoundDto = {
  number: 2,
  questions: [{ title: "E quem não é do time?", body: "", recommended_answer: "Não vê o card." }],
  answers: null,
  created_at: "2026-10-13T15:06:00Z",
  answered_at: null,
};

const proposalDto = {
  card_interview_proposal_id: "proposal-1",
  card_interview_id: "interview-1",
  status: "pending",
  summary: "Deixei **explícito** quem usa o filtro.",
  changes: [
    { field: "description", text: "O P.O filtra a lista por responsável.", items: null },
    {
      field: "acceptance_criteria",
      text: null,
      items: ["O filtro fica na URL.", "A lista volta para a primeira página."],
    },
  ],
  applied_fields: [] as string[],
  created_at: "2026-10-13T15:10:00Z",
  decided_at: null as string | null,
};

type Viewer = {
  userId?: string;
  isAiEnabled?: boolean;
  projectRole?: "administrator" | "member";
};

type CoreState = {
  status: "open" | "closed" | null;
  rounds: object[];
  proposals: (typeof proposalDto)[];
  isFinished: boolean;
};

let core: CoreState;

function interviewDto() {
  return {
    card_interview_id: "interview-1",
    card_id: "card-1",
    status: core.status,
    started_by: { user_id: "user-1", name: "Ana Souza" },
    finished: core.isFinished,
    rounds: core.rounds,
    created_at: "2026-10-13T15:00:00Z",
    closed_at: core.status === "closed" ? "2026-10-13T18:00:00Z" : null,
  };
}

function summariesDto() {
  const { rounds, finished: _finished, ...summary } = interviewDto();

  return core.status === null ? [] : [{ ...summary, round_count: rounds.length }];
}

function simulateCore({ userId = "user-1", isAiEnabled = true, projectRole }: Viewer) {
  const answer = (path: string): unknown => {
    switch (path) {
      case "/api/v1/accounts/me":
        return { user_id: userId, name: "Pessoa Sintética", email: "pessoa@exemplo.test" };
      case "/api/v1/organizations/me":
        return {
          organization_id: "org-1",
          name: "Lua Nova",
          role: "member",
          ai_enabled: isAiEnabled,
        };
      case "/api/v1/projects":
        return [
          { project_id: "project-1", name: "Momentum", key: "MOM", role: projectRole ?? "member" },
        ];
      case "/api/v1/card-interviews":
        return summariesDto();
      case "/api/v1/card-interviews/interview-1":
        return interviewDto();
      case PROPOSALS_PATH:
        return core.proposals;
      default:
        throw apiError(404, "NotFound", `Sem resposta simulada para ${path}.`);
    }
  };

  vi.mocked(api.get).mockImplementation(async (path: string) => ({ data: answer(path) }));
}

function renderInterviews(viewer: Viewer = {}, shownCard = card) {
  simulateCore(viewer);
  const { container } = render(<CardInterviews card={shownCard} />, {
    wrapper: createQueryWrapper().wrapper,
  });

  return { user: userEvent.setup(), container };
}

function openStream() {
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  const body = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;
    },
  });

  fetchMock.mockImplementation(async (_path, request) => {
    request?.signal?.addEventListener("abort", () =>
      controller?.error(new DOMException("The operation was aborted.", "AbortError"))
    );

    return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
  });

  return {
    send: (event: string, payload: object) =>
      act(() =>
        controller?.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`))
      ),
  };
}

function sentAnswers() {
  return JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
}

function coreStartsInterview() {
  core.status = null;
  vi.mocked(api.post).mockImplementation(async () => {
    core.status = "open";
    return { data: interviewDto() };
  });
}

function streamReadsEverythingSent() {
  return act(() => new Promise(resolve => setTimeout(resolve, 0)));
}

beforeEach(() => {
  core = { status: "open", rounds: [], proposals: [], isFinished: false };
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset();
  vi.mocked(api.patch).mockReset();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CardInterviews — leitura pelo time", () => {
  it("mostra as rodadas, a recomendação marcada como texto da IA e as respostas, sem ações", async () => {
    core.rounds = [firstRoundAnsweredDto, secondRoundDto];
    renderInterviews({ userId: "user-2", isAiEnabled: false });

    expect(await screen.findByRole("heading", { name: "1. Quem usa o filtro?" })).toBeVisible();
    expect(screen.getByText("Entrevista aberta")).toBeVisible();
    expect(screen.getByText("Iniciada por Ana Souza em 13/10/2026 · 2 rodadas")).toBeVisible();
    expect(screen.getAllByText("Recomendação da IA")).toHaveLength(3);
    expect(screen.getByText("O P.O, ao revisar o backlog.")).toBeVisible();
    expect(screen.getByText("P.O").tagName).toBe("STRONG");
    expect(screen.getByText("Sem resposta.")).toBeVisible();
    expect(screen.getByText("Aguardando a resposta.")).toBeVisible();
    expect(
      screen.getByText(
        "Só Ana Souza conduz esta entrevista. Você acompanha as perguntas e as respostas."
      )
    ).toBeVisible();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /Iniciar|Pedir|Enviar|Encerrar/ })).toBeNull();
  });

  it("passa o texto da IA pelo sanitizador e deixa o destino do link à vista", async () => {
    core.rounds = [firstRoundAnsweredDto];
    const { container } = renderInterviews({ userId: "user-2" });

    const link = await screen.findByRole("link", {
      name: "o guia (https://atacante.exemplo.test/guia)",
    });

    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("quem").tagName).toBe("STRONG");
  });

  it("deixa o histórico da entrevista encerrada recolhido até alguém pedir", async () => {
    core.status = "closed";
    core.rounds = [firstRoundAnsweredDto];
    const { user } = renderInterviews({ userId: "user-2" });

    expect(await screen.findByText("Entrevista encerrada")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "1. Quem usa o filtro?" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Ver a conversa" }));

    expect(await screen.findByRole("heading", { name: "1. Quem usa o filtro?" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Encerrar entrevista" })).toBeNull();
  });

  it("diz que não há entrevista e quem pode iniciar, a quem não tem a permissão de IA", async () => {
    core.status = null;
    renderInterviews({ userId: "user-2", isAiEnabled: false });

    expect(await screen.findByText("Nenhuma entrevista neste card.")).toBeVisible();
    expect(
      screen.getByText(
        "Só inicia entrevista quem o administrador da organização marcou como “Pode usar a IA” na lista de membros."
      )
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Iniciar entrevista" })).toBeNull();
  });
});

describe("CardInterviews — iniciar e encerrar", () => {
  it("inicia a entrevista e já pede a primeira rodada, no mesmo clique", async () => {
    coreStartsInterview();
    const stream = openStream();
    const { user } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Iniciar entrevista" }));

    expect(await screen.findByText("A IA está escrevendo a rodada…")).toBeVisible();
    expect(api.post).toHaveBeenCalledWith("/api/v1/card-interviews", { card_id: "card-1" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(ROUNDS_PATH);
    expect(sentAnswers()).toEqual({});
    expect(screen.queryByRole("button", { name: "Iniciar entrevista" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Pedir a primeira rodada" })).toBeNull();

    core.rounds = [firstRoundDto];
    await stream.send("round", { event_type: "round", round: firstRoundDto });

    expect(await screen.findByRole("heading", { name: "1. Quem usa o filtro?" })).toBeVisible();
    expect(screen.queryByText("A IA está escrevendo a rodada…")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("deixa a entrevista aberta, com o pedido da primeira rodada, quando a rodada falha ao iniciar", async () => {
    coreStartsInterview();
    const stream = openStream();
    const { user } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Iniciar entrevista" }));
    expect(await screen.findByText("A IA está escrevendo a rodada…")).toBeVisible();

    await stream.send("error", {
      event_type: "error",
      errors: [
        {
          code: "LlmProviderFailed",
          details: "O provedor de IA falhou ao escrever a rodada. Tente de novo.",
          error_type: "dependency_error",
          property: null,
          metadata: null,
        },
      ],
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O provedor de IA falhou ao escrever a rodada. Tente de novo."
    );
    expect(screen.getByText("Entrevista aberta")).toBeVisible();
    expect(screen.getByRole("button", { name: "Pedir a primeira rodada" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Iniciar entrevista" })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("não pede rodada quando o Core recusa o início", async () => {
    core.status = null;
    vi.mocked(api.post).mockRejectedValue(
      apiError(409, "InterviewAlreadyOpen", "Este card já tem uma entrevista aberta.")
    );
    const { user } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Iniciar entrevista" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Este card já tem uma entrevista aberta.")
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("não oferece iniciar em card arquivado nem quando já há uma entrevista aberta", async () => {
    renderInterviews({}, { ...card, isArchived: true });

    expect(await screen.findByText("Entrevista aberta")).toBeVisible();
    expect(screen.getByText("Card arquivado não recebe entrevista.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Iniciar entrevista" })).toBeNull();
  });

  it("encerra a entrevista só depois da confirmação, também pelo administrador do projeto", async () => {
    vi.mocked(api.patch).mockImplementation(async () => {
      core.status = "closed";
      return { data: interviewDto() };
    });
    const { user } = renderInterviews({
      userId: "user-3",
      isAiEnabled: false,
      projectRole: "administrator",
    });

    await user.click(await screen.findByRole("button", { name: "Encerrar entrevista" }));

    expect(api.patch).not.toHaveBeenCalled();

    const dialog = await screen.findByRole("dialog", { name: "Encerrar a entrevista?" });
    await user.click(within(dialog).getByRole("button", { name: "Encerrar entrevista" }));

    expect(await screen.findByText("Entrevista encerrada")).toBeVisible();
    expect(api.patch).toHaveBeenCalledWith("/api/v1/card-interviews/interview-1", {
      status: "closed",
    });
    expect(toast.success).toHaveBeenCalledWith("A entrevista foi encerrada.");
  });
});

describe("CardInterviews — rodada em stream", () => {
  it("enquanto a IA escreve, mostra só a espera, sem o texto do stream, e a rodada só no evento round", async () => {
    const stream = openStream();
    const { user, container } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Pedir a primeira rodada" }));

    expect(await screen.findByText("A IA está escrevendo a rodada…")).toBeVisible();

    await stream.send("delta", { event_type: "delta", delta: '{"questions":[{"title":"Quem usa' });
    await streamReadsEverythingSent();

    expect(container).not.toHaveTextContent("questions");
    expect(screen.getByText("A IA está escrevendo a rodada…")).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: /Quem usa o filtro/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Pedir a primeira rodada" })).toBeNull();

    core.rounds = [firstRoundDto];
    await stream.send("round", { event_type: "round", round: firstRoundDto });

    expect(await screen.findByRole("heading", { name: "1. Quem usa o filtro?" })).toBeVisible();
    expect(screen.queryByText("A IA está escrevendo a rodada…")).toBeNull();
    expect(fetchMock.mock.calls[0][0]).toBe(ROUNDS_PATH);
    expect(sentAnswers()).toEqual({});
  });

  it("mostra a falha do evento error e deixa a pessoa decidir se tenta de novo", async () => {
    const stream = openStream();
    const { user, container } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Pedir a primeira rodada" }));
    await stream.send("delta", { event_type: "delta", delta: '{"questions":[' });

    await stream.send("error", {
      event_type: "error",
      errors: [
        {
          code: "AiRequesterLimitReached",
          details: "Você tem chamadas de IA demais em andamento ou recentes.",
          error_type: "rate_limit_error",
          property: null,
          metadata: { retry_after_seconds: 60 },
        },
      ],
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Você tem chamadas de IA demais em andamento ou recentes. Disponível de novo em 1 minuto."
    );
    expect(container).not.toHaveTextContent("questions");
    expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
    expect(screen.getByRole("button", { name: "Pedir a primeira rodada" })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mostra a recusa que o Core devolve antes do stream, como erro HTTP comum", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          title: "Operação não permitida",
          status: 422,
          errors: [
            {
              code: "InterviewRoundAttemptsExhausted",
              details: "Esta rodada falhou vezes demais. Encerre a entrevista e inicie outra.",
            },
          ],
        }),
        { status: 422, headers: { "Content-Type": "application/problem+json" } }
      )
    );
    const { user } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Pedir a primeira rodada" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Esta rodada falhou vezes demais. Encerre a entrevista e inicie outra."
    );
    expect(screen.queryByRole("button", { name: "Pedir a primeira rodada" })).toBeNull();
    expect(screen.getByRole("button", { name: "Encerrar entrevista" })).toBeVisible();
  });

  it("cancela o stream a pedido da pessoa e volta a oferecer a rodada", async () => {
    openStream();
    const { user } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Pedir a primeira rodada" }));
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(await screen.findByRole("button", { name: "Pedir a primeira rodada" })).toBeVisible();
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("CardInterviews — respostas", () => {
  it("responde com o próprio texto ou com a recomendação e pede a rodada seguinte", async () => {
    core.rounds = [firstRoundDto];
    const stream = openStream();
    const { user } = renderInterviews();

    await user.type(
      await screen.findByRole("textbox", { name: "Sua resposta à pergunta 1" }),
      "Só o P.O."
    );
    await user.click(screen.getAllByRole("button", { name: "Usar a recomendação" })[1]);

    expect(screen.getByRole("textbox", { name: "Sua resposta à pergunta 2" })).toHaveValue(
      "Sim, para o endereço poder ser copiado."
    );

    await user.click(
      screen.getByRole("button", { name: "Enviar respostas e pedir a próxima rodada" })
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(sentAnswers()).toEqual({
      answers: [
        { question: 1, answer: "Só o P.O." },
        { question: 2, answer: "Sim, para o endereço poder ser copiado." },
      ],
    });

    core.rounds = [firstRoundAnsweredDto, secondRoundDto];
    await stream.send("round", { event_type: "round", round: secondRoundDto });

    expect(await screen.findByRole("heading", { name: "1. E quem não é do time?" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Sua resposta à pergunta 1" })).toHaveValue("");
  });

  it("não pede a rodada sem nenhuma resposta", async () => {
    core.rounds = [firstRoundDto];
    const { user } = renderInterviews();

    await user.click(
      await screen.findByRole("button", { name: "Enviar respostas e pedir a próxima rodada" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Responda a pelo menos uma pergunta da rodada."
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mantém o que a pessoa escreveu quando o pedido falha antes de as respostas serem gravadas", async () => {
    core.rounds = [firstRoundDto];
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { user } = renderInterviews();

    await user.type(
      await screen.findByRole("textbox", { name: "Sua resposta à pergunta 1" }),
      "Só o P.O."
    );
    await user.click(
      screen.getByRole("button", { name: "Enviar respostas e pedir a próxima rodada" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(screen.getByRole("textbox", { name: "Sua resposta à pergunta 1" })).toHaveValue(
      "Só o P.O."
    );
  });

  it("pede a proposta sozinha quando a IA termina depois de uma rodada respondida", async () => {
    core.rounds = [firstRoundDto];
    core.proposals = [];
    const stream = openStream();
    vi.mocked(api.post).mockImplementation(async () => {
      core.proposals = [proposalDto];
      return { data: proposalDto };
    });
    const { user } = renderInterviews();

    await user.click((await screen.findAllByRole("button", { name: "Usar a recomendação" }))[0]);
    await user.click(
      screen.getByRole("button", { name: "Enviar respostas e pedir a próxima rodada" })
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const finishingRound = { ...secondRoundDto, questions: [] };
    core.rounds = [firstRoundAnsweredDto, finishingRound];
    core.isFinished = true;
    await stream.send("round", { event_type: "round", round: finishingRound });

    expect(await screen.findByText("A IA não tem mais perguntas para este card.")).toBeVisible();
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(PROPOSALS_PATH, undefined, expect.anything())
    );
    expect(await screen.findByRole("checkbox", { name: "Descrição" })).toBeChecked();
  });

  it("não pede a proposta sozinha quando a IA termina sem nenhuma resposta", async () => {
    core.rounds = [];
    const stream = openStream();
    const { user } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Pedir a primeira rodada" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const finishingRound = { ...firstRoundDto, questions: [] };
    core.rounds = [finishingRound];
    core.isFinished = true;
    await stream.send("round", { event_type: "round", round: finishingRound });

    expect(await screen.findByText("A IA não tem mais perguntas para este card.")).toBeVisible();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("no limite de rodadas, aponta para a proposta", async () => {
    core.rounds = Array.from({ length: 10 }, (_, index) => ({
      ...firstRoundAnsweredDto,
      number: index + 1,
    }));
    renderInterviews();

    expect(
      await screen.findByText(
        "A entrevista chegou ao limite de 10 rodadas. Peça a proposta de mudança logo abaixo."
      )
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Pedir proposta de mudança" })).toBeVisible();
  });

  it("diz que a IA terminou quando a rodada vem sem pergunta, e ainda oferece a proposta", async () => {
    core.rounds = [firstRoundAnsweredDto, { ...secondRoundDto, questions: [] }];
    core.isFinished = true;
    renderInterviews();

    expect(await screen.findByText("A IA não tem mais perguntas para este card.")).toBeVisible();
    expect(screen.queryByRole("button", { name: /rodada/ })).toBeNull();
    expect(await screen.findByRole("button", { name: "Pedir proposta de mudança" })).toBeVisible();
  });
});

describe("CardInterviews — proposta", () => {
  beforeEach(() => {
    core.rounds = [firstRoundAnsweredDto];
  });

  it("só oferece a proposta depois de uma rodada respondida", async () => {
    core.rounds = [firstRoundDto];
    renderInterviews();

    expect(
      await screen.findByText("Responda a pelo menos uma rodada para pedir a proposta.")
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Pedir proposta de mudança" })).toBeNull();
  });

  it("mostra a espera enquanto a IA escreve e não deixa pedir duas vezes", async () => {
    let deliver = (_response: { data: typeof proposalDto }) => {};
    vi.mocked(api.post).mockReturnValue(
      new Promise(resolve => {
        deliver = resolve;
      })
    );
    const { user } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Pedir proposta de mudança" }));

    expect(await screen.findByText("A IA está escrevendo a proposta…")).toBeVisible();
    expect(
      screen.getByText("Pode levar mais de um minuto. Não feche nem recarregue a tela.")
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Pedir proposta de mudança" })).toBeNull();
    expect(api.post).toHaveBeenCalledTimes(1);

    core.proposals = [proposalDto];
    await act(async () => deliver({ data: proposalDto }));

    expect(await screen.findByRole("checkbox", { name: "Descrição" })).toBeChecked();
    expect(screen.queryByText("A IA está escrevendo a proposta…")).toBeNull();
  });

  it("mostra cada mudança ao lado do valor atual do card e aplica só as escolhidas", async () => {
    core.proposals = [proposalDto];
    vi.mocked(api.patch).mockImplementation(async () => {
      core.proposals = [
        { ...proposalDto, status: "applied", applied_fields: ["acceptance_criteria"] },
      ];
      return { data: core.proposals[0] };
    });
    const { user } = renderInterviews();

    expect(await screen.findByText("A lista precisa de filtro.")).toBeVisible();
    expect(screen.getByText("O P.O filtra a lista por responsável.")).toBeVisible();
    expect(screen.getByText("A lista volta para a primeira página.")).toBeVisible();
    expect(screen.getAllByText("Atual no card")).toHaveLength(2);
    expect(screen.getAllByText("Proposta da IA")).toHaveLength(2);
    expect(screen.getByText("explícito").tagName).toBe("STRONG");

    await user.click(screen.getByRole("checkbox", { name: "Descrição" }));
    await user.click(screen.getByRole("button", { name: "Aplicar e continuar" }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/api/v1/card-interview-proposals/proposal-1", {
        status: "applied",
        fields: ["acceptance_criteria"],
        close_interview: false,
      })
    );
    expect(
      await screen.findByText("Proposta aplicada em 13/10/2026: Critérios de aceite")
    ).toBeVisible();
    expect(toast.success).toHaveBeenCalledWith("As mudanças escolhidas foram aplicadas ao card.");
    expect(screen.getByRole("status")).toHaveTextContent(
      "A proposta foi aplicada ao card, e a entrevista continua aberta."
    );
    expect(screen.getByRole("button", { name: "Encerrar entrevista" })).toBeVisible();
  });

  it("aplica e encerra a entrevista quando a pessoa escolhe encerrar", async () => {
    core.proposals = [proposalDto];
    vi.mocked(api.patch).mockImplementation(async () => {
      core.proposals = [{ ...proposalDto, status: "applied", applied_fields: ["description"] }];
      core.status = "closed";
      return { data: core.proposals[0] };
    });
    const { user } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Aplicar e encerrar" }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/api/v1/card-interview-proposals/proposal-1", {
        status: "applied",
        fields: ["description", "acceptance_criteria"],
        close_interview: true,
      })
    );
    expect(await screen.findByText("Entrevista encerrada")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Encerrar entrevista" })).toBeNull();
  });

  it("não aplica sem nenhuma mudança escolhida", async () => {
    core.proposals = [proposalDto];
    const { user } = renderInterviews();

    await user.click(await screen.findByRole("checkbox", { name: "Descrição" }));
    await user.click(screen.getByRole("checkbox", { name: "Critérios de aceite" }));
    await user.click(screen.getByRole("button", { name: "Aplicar e continuar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Escolha ao menos uma mudança para aplicar."
    );
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("não aplica a proposta com Enter numa caixa de seleção: só o botão aplica", async () => {
    core.proposals = [proposalDto];
    const { user } = renderInterviews();

    (await screen.findByRole("checkbox", { name: "Descrição" })).focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Aplicar e continuar" })).toBeVisible();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("oferece pedir outra proposta quando o card mudou depois dela", async () => {
    core.proposals = [proposalDto];
    vi.mocked(api.patch).mockRejectedValue(
      apiError(
        409,
        "InterviewProposalOutdated",
        "O card mudou depois que a proposta foi gerada. Peça uma proposta nova."
      )
    );
    vi.mocked(api.post).mockResolvedValue({ data: proposalDto });
    const { user } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Aplicar e encerrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O card mudou depois que esta proposta foi gerada, e ela não pode mais ser aplicada."
    );
    expect(screen.queryByRole("button", { name: /Aplicar e/ })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Pedir outra proposta" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.post).mock.calls[0][0]).toBe(PROPOSALS_PATH);
  });

  it("descarta a proposta só depois da confirmação", async () => {
    core.proposals = [proposalDto];
    vi.mocked(api.patch).mockImplementation(async () => {
      core.proposals = [{ ...proposalDto, status: "discarded" }];
      return { data: core.proposals[0] };
    });
    const { user } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Descartar" }));
    expect(api.patch).not.toHaveBeenCalled();

    const dialog = await screen.findByRole("dialog", { name: "Descartar a proposta?" });
    await user.click(within(dialog).getByRole("button", { name: "Descartar proposta" }));

    expect(await screen.findByText("Proposta descartada em 13/10/2026")).toBeVisible();
    expect(api.patch).toHaveBeenCalledWith("/api/v1/card-interview-proposals/proposal-1", {
      status: "discarded",
      close_interview: false,
    });
    expect(screen.getByRole("button", { name: "Pedir proposta de mudança" })).toBeVisible();
  });

  it("mostra o erro de IA do pedido de proposta e deixa a pessoa pedir de novo", async () => {
    vi.mocked(api.post).mockRejectedValue(
      apiError(424, "AiNotConfigured", "Os recursos de IA não estão configurados neste ambiente.")
    );
    const { user } = renderInterviews();

    await user.click(await screen.findByRole("button", { name: "Pedir proposta de mudança" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Os recursos de IA não estão configurados neste ambiente."
    );
    expect(screen.getByRole("button", { name: "Pedir proposta de mudança" })).toBeVisible();
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("mostra a proposta pendente ao time, sem caixa de seleção nem ações", async () => {
    core.proposals = [proposalDto];
    renderInterviews({ userId: "user-2" });

    expect(await screen.findByText("O P.O filtra a lista por responsável.")).toBeVisible();
    expect(screen.getByText("Aguardando a decisão de quem conduz a entrevista.")).toBeVisible();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /Aplicar|Descartar|Pedir/ })).toBeNull();
  });
});
