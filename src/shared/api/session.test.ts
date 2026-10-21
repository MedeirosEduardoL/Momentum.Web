import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api-error";
import { api, session } from "./client";

type Reply = { status: number; data?: unknown } | "network-failure";

const RENEWAL = "PUT /api/v1/sessions/me";
const PROJECTS = "GET /api/v1/projects";

const originalAdapter = api.defaults.adapter;
const onOpened = vi.fn();
const onEnded = vi.fn();

function problem(status: number, code: string): Reply {
  return {
    status,
    data: { title: "Falha", status, errors: [{ code, details: `Detalhe de ${code}.` }] },
  };
}

function respond(config: InternalAxiosRequestConfig, reply: Reply): AxiosResponse {
  if (reply === "network-failure") {
    throw new AxiosError("Network Error", AxiosError.ERR_NETWORK, config);
  }

  const response: AxiosResponse = {
    config,
    data: reply.data ?? null,
    headers: {},
    status: reply.status,
    statusText: "",
  };

  if (reply.status >= 400) {
    throw new AxiosError("Request failed", AxiosError.ERR_BAD_REQUEST, config, null, response);
  }

  return response;
}

function serve(repliesByRoute: Record<string, Reply[]>) {
  const requests: InternalAxiosRequestConfig[] = [];

  api.defaults.adapter = async config => {
    const route = `${config.method?.toUpperCase()} ${config.url}`;
    const reply = repliesByRoute[route]?.shift();
    requests.push(config);

    if (!reply) {
      throw new Error(`Requisição não prevista: ${route}`);
    }

    return respond(config, reply);
  };

  return {
    requests,
    routes: () => requests.map(request => `${request.method?.toUpperCase()} ${request.url}`),
  };
}

beforeEach(() => {
  onOpened.mockReset();
  onEnded.mockReset();
  session.listen({ onOpened, onEnded });
});

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe("renovação da sessão no client", () => {
  it("renova a sessão uma vez e repete a requisição que recebeu 401", async () => {
    const server = serve({
      [PROJECTS]: [problem(401, "AuthenticationRequired"), { status: 200, data: [] }],
      [RENEWAL]: [{ status: 200, data: { access_expires_at: "2026-10-12T13:00:00Z" } }],
    });

    const response = await api.get("/api/v1/projects");

    expect(response.data).toEqual([]);
    expect(server.routes()).toEqual([PROJECTS, RENEWAL, PROJECTS]);
    expect(onEnded).not.toHaveBeenCalled();
  });

  it("repete a mutação com o mesmo corpo depois de renovar", async () => {
    const server = serve({
      "POST /api/v1/projects": [problem(401, "SessionNotActive"), { status: 201, data: {} }],
      [RENEWAL]: [{ status: 200 }],
    });

    await api.post("/api/v1/projects", { name: "Momentum", key: "MOM" });

    expect(JSON.parse(server.requests[2].data)).toEqual({ name: "Momentum", key: "MOM" });
    expect(server.requests[2].headers.get("X-Requested-With")).toBe("XMLHttpRequest");
  });

  it("trata o 401 do Kong, fora do formato do Core, do mesmo jeito", async () => {
    const server = serve({
      [PROJECTS]: [
        { status: 401, data: { message: "Unauthorized" } },
        { status: 200, data: [] },
      ],
      [RENEWAL]: [{ status: 200 }],
    });

    await api.get("/api/v1/projects");

    expect(server.routes()).toEqual([PROJECTS, RENEWAL, PROJECTS]);
  });

  it("encerra a sessão quando a renovação responde 401 e devolve o erro original", async () => {
    const server = serve({
      [PROJECTS]: [problem(401, "AuthenticationRequired")],
      [RENEWAL]: [problem(401, "SessionNotActive")],
    });

    const failure = await api.get("/api/v1/projects").catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({ status: 401 });
    expect((failure as ApiError).hasCode("AuthenticationRequired")).toBe(true);
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(onEnded).toHaveBeenCalledWith("expired");
    expect(server.routes()).toEqual([PROJECTS, RENEWAL]);
  });

  it("repete a requisição quando outra aba já renovou a sessão", async () => {
    const server = serve({
      [PROJECTS]: [problem(401, "AuthenticationRequired"), { status: 200, data: [] }],
      [RENEWAL]: [problem(409, "SessionAlreadyRenewed")],
    });

    await api.get("/api/v1/projects");

    expect(server.routes()).toEqual([PROJECTS, RENEWAL, PROJECTS]);
    expect(onEnded).not.toHaveBeenCalled();
  });

  it("compartilha uma única renovação entre requisições simultâneas", async () => {
    const server = serve({
      [PROJECTS]: [problem(401, "AuthenticationRequired"), { status: 200, data: [] }],
      "GET /api/v1/organizations/me": [
        problem(401, "AuthenticationRequired"),
        { status: 200, data: {} },
      ],
      [RENEWAL]: [{ status: 200 }],
    });

    await Promise.all([api.get("/api/v1/projects"), api.get("/api/v1/organizations/me")]);

    expect(server.routes().filter(route => route === RENEWAL)).toHaveLength(1);
  });

  it("avisa uma vez só quando a renovação compartilhada encerra a sessão", async () => {
    serve({
      [PROJECTS]: [problem(401, "AuthenticationRequired")],
      "GET /api/v1/organizations/me": [problem(401, "AuthenticationRequired")],
      [RENEWAL]: [problem(401, "SessionNotActive")],
    });

    await Promise.allSettled([api.get("/api/v1/projects"), api.get("/api/v1/organizations/me")]);

    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it("não renova de novo se a requisição repetida também recebe 401", async () => {
    const server = serve({
      [PROJECTS]: [problem(401, "AuthenticationRequired"), problem(401, "AuthenticationRequired")],
      [RENEWAL]: [{ status: 200 }],
    });

    await expect(api.get("/api/v1/projects")).rejects.toMatchObject({ status: 401 });

    expect(server.routes()).toEqual([PROJECTS, RENEWAL, PROJECTS]);
  });

  it("devolve a falha da renovação, sem encerrar a sessão, quando ela não é 401 nem 409", async () => {
    serve({
      [PROJECTS]: [problem(401, "AuthenticationRequired")],
      [RENEWAL]: ["network-failure"],
    });

    const failure = await api.get("/api/v1/projects").catch((error: unknown) => error);

    expect((failure as ApiError).hasCode("NetworkFailure")).toBe(true);
    expect(onEnded).not.toHaveBeenCalled();
  });

  it("não tenta renovar no 401 do login, que é erro de formulário", async () => {
    const server = serve({
      "POST /api/v1/sessions": [problem(401, "AccountCredentialsInvalid")],
    });

    const failure = await session
      .open({ email: "ana@exemplo.test", password: "senha-errada" })
      .catch((error: unknown) => error);

    expect((failure as ApiError).hasCode("AccountCredentialsInvalid")).toBe(true);
    expect(server.routes()).toEqual(["POST /api/v1/sessions"]);
    expect(onEnded).not.toHaveBeenCalled();
    expect(onOpened).not.toHaveBeenCalled();
  });

  it("deixa passar o erro que não é 401", async () => {
    const server = serve({ [PROJECTS]: [problem(403, "AccessDenied")] });

    await expect(api.get("/api/v1/projects")).rejects.toMatchObject({ status: 403 });

    expect(server.routes()).toEqual([PROJECTS]);
  });
});

describe("session.open", () => {
  it("manda as credenciais e avisa que a sessão abriu depois da resposta", async () => {
    const server = serve({
      "POST /api/v1/sessions": [
        { status: 201, data: { access_expires_at: "2026-10-12T13:00:00Z" } },
      ],
    });

    await session.open({ email: "ana@exemplo.test", password: "senha-sintetica-1" });

    expect(JSON.parse(server.requests[0].data)).toEqual({
      email: "ana@exemplo.test",
      password: "senha-sintetica-1",
    });
    expect(onOpened).toHaveBeenCalledTimes(1);
  });

  it("espera quem ouve a abertura terminar", async () => {
    const steps: string[] = [];
    onOpened.mockImplementation(async () => {
      await Promise.resolve();
      steps.push("cache atualizado");
    });
    serve({ "POST /api/v1/sessions": [{ status: 201 }] });

    await session.open({ email: "ana@exemplo.test", password: "senha-sintetica-1" });
    steps.push("sessão aberta");

    expect(steps).toEqual(["cache atualizado", "sessão aberta"]);
  });
});

describe("session.close", () => {
  it("encerra a sessão no servidor e avisa", async () => {
    const server = serve({ "DELETE /api/v1/sessions/me": [{ status: 204 }] });

    await session.close();

    expect(server.routes()).toEqual(["DELETE /api/v1/sessions/me"]);
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(onEnded).toHaveBeenCalledWith("signed-out");
  });

  it("não avisa o encerramento se o servidor não confirmou", async () => {
    serve({ "DELETE /api/v1/sessions/me": ["network-failure"] });

    await expect(session.close()).rejects.toBeInstanceOf(ApiError);

    expect(onEnded).not.toHaveBeenCalled();
  });
});

describe("session.renewAfter", () => {
  const unauthorized = new ApiError({ title: "Não autenticado", status: 401, errors: [] });

  it("renova a sessão para quem recebeu 401 fora do client", async () => {
    const server = serve({ [RENEWAL]: [{ status: 200 }] });

    await expect(session.renewAfter(unauthorized)).resolves.toBeUndefined();

    expect(server.routes()).toEqual([RENEWAL]);
    expect(onEnded).not.toHaveBeenCalled();
  });

  it("devolve o 401 original e encerra a sessão quando a renovação é recusada", async () => {
    serve({ [RENEWAL]: [problem(401, "SessionNotActive")] });

    await expect(session.renewAfter(unauthorized)).rejects.toBe(unauthorized);

    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(onEnded).toHaveBeenCalledWith("expired");
  });

  it("devolve a falha da renovação quando ela não é uma recusa", async () => {
    serve({ [RENEWAL]: ["network-failure"] });

    const failure = await session.renewAfter(unauthorized).catch((error: unknown) => error);

    expect((failure as ApiError).hasCode("NetworkFailure")).toBe(true);
    expect(onEnded).not.toHaveBeenCalled();
  });
});
