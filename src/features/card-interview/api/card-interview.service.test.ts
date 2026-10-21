import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getApiErrorMessage, getRetryAfterSeconds } from "@/shared/api/api-error";
import { api } from "@/shared/api/client";
import { postEventStream, type ServerSentEvent } from "@/shared/api/event-stream";
import { apiError } from "@/test/api-errors";
import {
  askCardInterviewRound,
  closeCardInterview,
  getCardInterview,
  listCardInterviews,
  startCardInterview,
} from "./card-interview.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
vi.mock("@/shared/api/event-stream", () => ({ postEventStream: vi.fn() }));

const questionDto = {
  title: "Quem usa o filtro?",
  body: "O card não diz **quem** filtra a lista.",
  recommended_answer: "O P.O, ao revisar o backlog.",
};
const question = {
  title: "Quem usa o filtro?",
  body: "O card não diz **quem** filtra a lista.",
  recommendedAnswer: "O P.O, ao revisar o backlog.",
};

const answeredRoundDto = {
  number: 1,
  questions: [questionDto],
  answers: [{ question: 1, answer: "O P.O." }],
  created_at: "2026-10-13T12:00:00Z",
  answered_at: "2026-10-13T12:05:00Z",
};
const pendingRoundDto = {
  number: 2,
  questions: [questionDto],
  answers: null,
  created_at: "2026-10-13T12:06:00Z",
  answered_at: null,
};

const interviewDto = {
  card_interview_id: "interview-1",
  card_id: "card-1",
  status: "open",
  started_by: { user_id: "user-1", name: "Ana Souza" },
  finished: false,
  rounds: [answeredRoundDto, pendingRoundDto],
  created_at: "2026-10-13T11:00:00Z",
  closed_at: null,
};
const interview = {
  id: "interview-1",
  cardId: "card-1",
  status: "open",
  startedBy: { userId: "user-1", name: "Ana Souza" },
  isFinished: false,
  rounds: [
    { number: 1, questions: [question], answers: [{ question: 1, answer: "O P.O." }] },
    { number: 2, questions: [question], answers: null },
  ],
  createdAt: "2026-10-13T11:00:00Z",
  closedAt: null,
};

function streamed(payload: object, event: string): ServerSentEvent {
  return { event, data: JSON.stringify({ delta: null, round: null, errors: null, ...payload }) };
}

const delta = (text: string) => streamed({ event_type: "delta", delta: text }, "delta");
const roundReady = streamed({ event_type: "round", round: pendingRoundDto }, "round");
const quotaReached = streamed(
  {
    event_type: "error",
    errors: [
      {
        code: "AiOrganizationQuotaReached",
        details: "A cota de IA da organização acabou neste mês.",
        error_type: "rate_limit_error",
        property: null,
        metadata: { retry_after_seconds: 1555200 },
      },
    ],
  },
  "error"
);

function coreStreams(...events: ServerSentEvent[]) {
  vi.mocked(postEventStream).mockImplementation(async function* () {
    yield* events;
  });
}

function ask(answers: { question: number; answer: string }[] = []) {
  const { signal } = new AbortController();

  return {
    signal,
    round: askCardInterviewRound({ interviewId: "interview-1", answers, signal }),
  };
}

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: interviewDto });
  vi.mocked(api.patch).mockReset().mockResolvedValue({ data: interviewDto });
  vi.mocked(postEventStream).mockReset();
});

describe("listCardInterviews", () => {
  it("lista as entrevistas do card na ordem que o Core devolve, adaptadas do contrato", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          card_interview_id: "interview-2",
          card_id: "card-1",
          status: "open",
          started_by: { user_id: "user-1", name: "Ana Souza" },
          round_count: 2,
          created_at: "2026-10-13T11:00:00Z",
          closed_at: null,
        },
        {
          card_interview_id: "interview-1",
          card_id: "card-1",
          status: "closed",
          started_by: null,
          round_count: 4,
          created_at: "2026-10-10T09:00:00Z",
          closed_at: "2026-10-11T09:00:00Z",
        },
      ],
    });

    await expect(listCardInterviews("card-1")).resolves.toEqual([
      {
        id: "interview-2",
        cardId: "card-1",
        status: "open",
        startedBy: { userId: "user-1", name: "Ana Souza" },
        roundCount: 2,
        createdAt: "2026-10-13T11:00:00Z",
        closedAt: null,
      },
      {
        id: "interview-1",
        cardId: "card-1",
        status: "closed",
        startedBy: null,
        roundCount: 4,
        createdAt: "2026-10-10T09:00:00Z",
        closedAt: "2026-10-11T09:00:00Z",
      },
    ]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/card-interviews", {
      params: { card_id: "card-1" },
    });
  });
});

describe("getCardInterview", () => {
  it("adapta a entrevista com as rodadas, as respostas e a rodada que espera resposta", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: interviewDto });

    await expect(getCardInterview("interview-1")).resolves.toEqual(interview);
    expect(api.get).toHaveBeenCalledWith("/api/v1/card-interviews/interview-1");
  });

  it("diz que a IA terminou quando o Core marca a entrevista como terminada", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...interviewDto, finished: true } });

    await expect(getCardInterview("interview-1")).resolves.toMatchObject({ isFinished: true });
  });
});

describe("startCardInterview", () => {
  it("inicia a entrevista do card", async () => {
    await expect(startCardInterview("card-1")).resolves.toEqual(interview);

    expect(api.post).toHaveBeenCalledWith("/api/v1/card-interviews", { card_id: "card-1" });
  });

  it("repassa a recusa do Core a quem não tem a permissão de IA", async () => {
    const notEnabled = apiError(
      403,
      "InterviewNotEnabled",
      "A entrevista pede a permissão de IA, e quem a concede é o administrador da organização."
    );
    vi.mocked(api.post).mockRejectedValue(notEnabled);

    await expect(startCardInterview("card-1")).rejects.toBe(notEnabled);
  });
});

describe("closeCardInterview", () => {
  it("encerra a entrevista pelo estado dela", async () => {
    await closeCardInterview("interview-1");

    expect(api.patch).toHaveBeenCalledWith("/api/v1/card-interviews/interview-1", {
      status: "closed",
    });
  });
});

describe("askCardInterviewRound — pedido", () => {
  it("pede a primeira rodada com o corpo vazio, levando o sinal de cancelamento", async () => {
    coreStreams(roundReady);

    const { round, signal } = ask();
    await round;

    expect(postEventStream).toHaveBeenCalledWith(
      "/api/v1/card-interviews/interview-1/rounds",
      {},
      signal
    );
  });

  it("manda as respostas da rodada pendente com o número de cada pergunta", async () => {
    coreStreams(roundReady);

    await ask([{ question: 2, answer: "Sim, com os filtros na URL." }]).round;

    expect(vi.mocked(postEventStream).mock.calls[0][1]).toEqual({
      answers: [{ question: 2, answer: "Sim, com os filtros na URL." }],
    });
  });
});

describe("askCardInterviewRound — stream", () => {
  it("ignora o texto dos eventos delta e devolve a rodada só no evento round", async () => {
    coreStreams(delta('{"questions":[{"title":"Quem'), delta(' usa o filtro?"'), roundReady);

    await expect(ask().round).resolves.toEqual({
      number: 2,
      questions: [question],
      answers: null,
    });
  });

  it("rejeita com o erro do Core no evento error", async () => {
    coreStreams(delta('{"questions":['), quotaReached);

    const failure = await ask().round.catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).hasCode("AiOrganizationQuotaReached")).toBe(true);
    expect(getApiErrorMessage(failure)).toBe("A cota de IA da organização acabou neste mês.");
    expect(getRetryAfterSeconds(failure)).toBe(1555200);
  });

  it("não trata o texto dos eventos delta como rodada quando o stream acaba sem o evento final", async () => {
    coreStreams(delta('{"questions":[{"title":"Quem usa o filtro?"}]}'));

    const failure = await ask().round.catch((error: unknown) => error);

    expect((failure as ApiError).hasCode("NetworkFailure")).toBe(true);
  });

  it("repassa o que o Core recusa antes do stream", async () => {
    const notTheStarter = apiError(
      403,
      "InterviewNotTheStarter",
      "Só quem iniciou a entrevista responde às perguntas."
    );
    vi.mocked(postEventStream).mockImplementation(async function* () {
      yield* [];
      throw notTheStarter;
    });

    await expect(ask().round).rejects.toBe(notTheStarter);
  });

  it("deixa o cancelamento chegar como cancelamento", async () => {
    const aborted = new DOMException("The operation was aborted.", "AbortError");
    vi.mocked(postEventStream).mockImplementation(async function* () {
      yield delta('{"questions":[');
      throw aborted;
    });

    await expect(ask().round).rejects.toBe(aborted);
  });
});
