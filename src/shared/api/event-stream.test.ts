import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api-error";
import { session } from "./client";
import { postEventStream, type ServerSentEvent } from "./event-stream";

vi.mock("./client", () => ({
  REQUESTED_WITH_HEADER: { "X-Requested-With": "XMLHttpRequest" },
  session: { renewAfter: vi.fn() },
}));

const ROUNDS_PATH = "/api/v1/card-interviews/interview-1/rounds";
const encoder = new TextEncoder();
const fetchMock = vi.fn<typeof fetch>();

function streamOf(chunks: (string | Uint8Array)[], failure?: Error) {
  const waiting = [...chunks];

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      const chunk = waiting.shift();

      if (chunk !== undefined) {
        controller.enqueue(typeof chunk === "string" ? encoder.encode(chunk) : chunk);
        return;
      }

      if (failure) {
        controller.error(failure);
        return;
      }

      controller.close();
    },
  });
}

function streamed(chunks: (string | Uint8Array)[], failure?: Error) {
  return new Response(streamOf(chunks, failure), {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

function refused(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

function problem(status: number, code: string, details: string) {
  return refused(status, { title: "Falha", status, errors: [{ code, details }] });
}

async function collect(events: AsyncIterable<ServerSentEvent>) {
  const collected: ServerSentEvent[] = [];

  for await (const event of events) {
    collected.push(event);
  }

  return collected;
}

function ask(payload: object = {}, signal = new AbortController().signal) {
  return collect(postEventStream(ROUNDS_PATH, payload, signal));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.mocked(session.renewAfter).mockReset().mockResolvedValue(undefined);
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("postEventStream — requisição", () => {
  it("manda o POST com o cookie de sessão, o X-Requested-With, o corpo em JSON e o sinal", async () => {
    const { signal } = new AbortController();
    fetchMock.mockResolvedValue(streamed([]));

    await ask({ answers: [{ question: 1, answer: "Sim" }] }, signal);

    expect(fetchMock).toHaveBeenCalledWith(ROUNDS_PATH, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: '{"answers":[{"question":1,"answer":"Sim"}]}',
      signal,
    });
  });

  it("manda o POST ao endereço de VITE_API_BASE_URL", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://gateway.exemplo.test");
    vi.resetModules();
    const { postEventStream: configuredStream } = await import("./event-stream");
    fetchMock.mockResolvedValue(streamed([]));

    await collect(configuredStream(ROUNDS_PATH, {}, new AbortController().signal));

    expect(fetchMock).toHaveBeenCalledWith(
      `https://gateway.exemplo.test${ROUNDS_PATH}`,
      expect.objectContaining({ credentials: "include" })
    );
  });
});

describe("postEventStream — eventos", () => {
  it("entrega cada evento com o nome e o dado, na ordem em que chegam", async () => {
    fetchMock.mockResolvedValue(
      streamed([
        'event: delta\ndata: {"delta":"{\\"ques"}\n\n',
        'event: delta\ndata: {"delta":"tions\\":[]}"}\n\nevent: round\ndata: {"round":{"number":1}}\n\n',
      ])
    );

    await expect(ask()).resolves.toEqual([
      { event: "delta", data: '{"delta":"{\\"ques"}' },
      { event: "delta", data: '{"delta":"tions\\":[]}"}' },
      { event: "round", data: '{"round":{"number":1}}' },
    ]);
  });

  it("junta o evento que chega partido entre pedaços, inclusive no meio de uma letra acentuada", async () => {
    const bytes = encoder.encode('event: delta\ndata: {"delta":"decisão"}\n\n');
    const middleOfTheAccent = bytes.indexOf(0xc3) + 1;

    fetchMock.mockResolvedValue(
      streamed([bytes.slice(0, middleOfTheAccent), bytes.slice(middleOfTheAccent)])
    );

    await expect(ask()).resolves.toEqual([{ event: "delta", data: '{"delta":"decisão"}' }]);
  });

  it("aceita fim de linha CRLF, comentário, dado em várias linhas e evento sem nome", async () => {
    fetchMock.mockResolvedValue(
      streamed([
        ": ping\r\n\r\n",
        "event: round\r\ndata: primeira\r\ndata:segunda\r\n\r\n",
        "data: sem nome\n\n",
      ])
    );

    await expect(ask()).resolves.toEqual([
      { event: "round", data: "primeira\nsegunda" },
      { event: "message", data: "sem nome" },
    ]);
  });

  it("descarta o evento que ficou pela metade quando o stream acaba", async () => {
    fetchMock.mockResolvedValue(
      streamed(['event: delta\ndata: {"delta":"a"}\n\n', "event: round\ndata: {"])
    );

    await expect(ask()).resolves.toEqual([{ event: "delta", data: '{"delta":"a"}' }]);
  });

  it("para de ler quando quem consome sai no meio", async () => {
    fetchMock.mockResolvedValue(streamed(["data: um\n\n", "data: dois\n\n", "data: três\n\n"]));
    const received: string[] = [];

    for await (const event of postEventStream(ROUNDS_PATH, {}, new AbortController().signal)) {
      received.push(event.data);
      break;
    }

    expect(received).toEqual(["um"]);
  });
});

describe("postEventStream — recusa e falha", () => {
  it("rejeita com o erro do Core o que é recusado antes do stream", async () => {
    fetchMock.mockResolvedValue(
      problem(403, "InterviewNotTheStarter", "Só quem iniciou a entrevista responde às perguntas.")
    );

    const failure = await ask().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({ status: 403 });
    expect((failure as ApiError).hasCode("InterviewNotTheStarter")).toBe(true);
  });

  it("trata o limite do Kong, fora do formato do Core, pelo status", async () => {
    fetchMock.mockResolvedValue(refused(429, { message: "API rate limit exceeded" }));

    await expect(ask()).rejects.toMatchObject({
      status: 429,
      errors: [{ details: "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo." }],
    });
  });

  it("trata a resposta de erro que nem JSON é", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad Gateway</html>", { status: 502 }));

    await expect(ask()).rejects.toMatchObject({ status: 502 });
  });

  it("converte a falha de conexão ao abrir o stream", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const failure = await ask().catch((error: unknown) => error);

    expect((failure as ApiError).hasCode("NetworkFailure")).toBe(true);
  });

  it("converte a conexão que cai no meio do stream, depois de entregar o que já tinha chegado", async () => {
    fetchMock.mockResolvedValue(streamed(["data: um\n\n"], new TypeError("network error")));
    const received: string[] = [];

    const reading = (async () => {
      for await (const event of postEventStream(ROUNDS_PATH, {}, new AbortController().signal)) {
        received.push(event.data);
      }
    })();

    await expect(reading).rejects.toMatchObject({ errors: [{ code: "NetworkFailure" }] });
    expect(received).toEqual(["um"]);
  });

  it("deixa o cancelamento chegar como cancelamento", async () => {
    const aborted = new DOMException("The operation was aborted.", "AbortError");
    fetchMock.mockRejectedValue(aborted);

    await expect(ask()).rejects.toBe(aborted);
  });
});

describe("postEventStream — sessão", () => {
  const unauthorized = () => refused(401, { message: "Unauthorized" });

  it("renova a sessão no 401 e repete o pedido uma vez", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(streamed(["event: round\ndata: {}\n\n"]));

    await expect(ask({ answers: [] })).resolves.toEqual([{ event: "round", data: "{}" }]);

    expect(session.renewAfter).toHaveBeenCalledTimes(1);
    expect(vi.mocked(session.renewAfter).mock.calls[0][0]).toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]).toEqual(fetchMock.mock.calls[0]);
  });

  it("não repete o pedido quando a renovação é recusada", async () => {
    const sessionEnded = new ApiError({ title: "Não autenticado", status: 401, errors: [] });
    fetchMock.mockResolvedValue(unauthorized());
    vi.mocked(session.renewAfter).mockRejectedValue(sessionEnded);

    await expect(ask()).rejects.toBe(sessionEnded);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("não renova de novo se o pedido repetido também recebe 401", async () => {
    fetchMock.mockImplementation(async () => unauthorized());

    await expect(ask()).rejects.toMatchObject({ status: 401 });

    expect(session.renewAfter).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
