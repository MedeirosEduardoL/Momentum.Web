import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { describe, expect, it } from "vitest";
import {
  ApiError,
  fromErrorList,
  fromResponse,
  getApiErrorMessage,
  getRetryAfterSeconds,
  hasErrorCode,
  hasErrorStatus,
  isTransientFailure,
  networkFailure,
  toApiError,
} from "./api-error";

const config: InternalAxiosRequestConfig = { headers: new AxiosHeaders() };

function failedResponse(status: number, data: unknown) {
  const response: AxiosResponse = { config, data, headers: {}, status, statusText: String(status) };
  return new AxiosError("Request failed", AxiosError.ERR_BAD_REQUEST, config, null, response);
}

const cardTitleRequired = {
  type: "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  title: "Requisição inválida",
  status: 400,
  instance: "POST /api/v1/cards",
  trace_id: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  errors: [
    {
      code: "CardTitleRequired",
      details: "Informe o título do card.",
      error_type: "request_error",
      property: "title",
      metadata: null,
    },
  ],
};

describe("toApiError", () => {
  it("lê o ApiProblemDetails do Core", () => {
    const error = toApiError(failedResponse(400, cardTitleRequired));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Requisição inválida");
    expect(error.status).toBe(400);
    expect(error.traceId).toBe(cardTitleRequired.trace_id);
    expect(error.hasCode("CardTitleRequired")).toBe(true);
    expect(error.errors).toEqual([
      {
        code: "CardTitleRequired",
        details: "Informe o título do card.",
        errorType: "request_error",
        property: "title",
        metadata: null,
      },
    ]);
  });

  it("entrega property e metadata em camelCase", () => {
    const rateLimited = {
      ...cardTitleRequired,
      title: "Limite atingido",
      status: 429,
      errors: [
        {
          code: "InterviewRateLimited",
          details: "Tente de novo em 30 segundos.",
          error_type: "rate_limit_error",
          property: "card_type",
          metadata: { retry_after_seconds: 30 },
        },
      ],
    };

    const [item] = toApiError(failedResponse(429, rateLimited)).errors;

    expect(item.property).toBe("cardType");
    expect(item.metadata).toEqual({ retryAfterSeconds: 30 });
  });

  it("trata a resposta fora do formato do Core, como a do Kong, sem mensagem técnica", () => {
    const error = toApiError(failedResponse(502, "<html>Bad Gateway</html>"));

    expect(error.status).toBe(502);
    expect(error.hasCode("UnexpectedResponse")).toBe(true);
    expect(getApiErrorMessage(error)).toBe("Não foi possível concluir a operação. Tente de novo.");
  });

  it.each([
    ["sem título", { ...cardTitleRequired, title: undefined }],
    ["com o status em texto", { ...cardTitleRequired, status: "400" }],
    ["com o trace_id que não é texto", { ...cardTitleRequired, trace_id: 7 }],
    ["sem a lista de erros", { ...cardTitleRequired, errors: undefined }],
    ["com a lista de erros vazia", { ...cardTitleRequired, errors: [] }],
    ["com um erro que não é objeto", { ...cardTitleRequired, errors: ["CardTitleRequired"] }],
    [
      "com um erro sem código",
      { ...cardTitleRequired, errors: [{ details: "Informe o título." }] },
    ],
    [
      "com um erro sem details",
      { ...cardTitleRequired, errors: [{ code: "CardTitleRequired", details: null }] },
    ],
    [
      "com a property que não é texto",
      { ...cardTitleRequired, errors: [{ code: "CardTitleRequired", details: "x", property: 3 }] },
    ],
    [
      "com o metadata em lista",
      {
        ...cardTitleRequired,
        errors: [{ code: "CardTitleRequired", details: "x", metadata: [1] }],
      },
    ],
    ["nula", null],
    ["em lista", [cardTitleRequired]],
  ])("trata como resposta inesperada a que vem %s", (_description, data) => {
    const error = toApiError(failedResponse(400, data));

    expect(error.hasCode("UnexpectedResponse")).toBe(true);
  });

  it("aceita o erro só com código e details, sem os campos opcionais", () => {
    const minimal = {
      title: "Conflito",
      status: 409,
      errors: [{ code: "CardChangedMeanwhile", details: "O card mudou." }],
    };

    const error = toApiError(failedResponse(409, minimal));

    expect(error.traceId).toBeNull();
    expect(error.errors).toEqual([
      {
        code: "CardChangedMeanwhile",
        details: "O card mudou.",
        errorType: null,
        property: null,
        metadata: null,
      },
    ]);
  });

  it("pede para aguardar quando o limite do Kong responde 429 fora do formato do Core", () => {
    const error = toApiError(failedResponse(429, { message: "API rate limit exceeded" }));

    expect(error.status).toBe(429);
    expect(error.hasCode("UnexpectedResponse")).toBe(true);
    expect(getApiErrorMessage(error)).toBe(
      "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo."
    );
  });

  it("separa o tempo esgotado da falha de rede", () => {
    const timeout = new AxiosError("timeout of 15000ms exceeded", AxiosError.ECONNABORTED, config);
    const offline = new AxiosError("Network Error", AxiosError.ERR_NETWORK, config);

    expect(toApiError(timeout).hasCode("RequestTimeout")).toBe(true);
    expect(toApiError(offline).hasCode("NetworkFailure")).toBe(true);
    expect(toApiError(offline).status).toBeNull();
  });

  it("devolve o mesmo ApiError e cobre o erro que não veio do HTTP", () => {
    const apiError = toApiError(failedResponse(400, cardTitleRequired));

    expect(toApiError(apiError)).toBe(apiError);
    expect(toApiError(new TypeError("boom")).hasCode("UnexpectedFailure")).toBe(true);
  });
});

describe("getApiErrorMessage", () => {
  it("junta os details de todos os erros", () => {
    const error = new ApiError({
      title: "Requisição inválida",
      status: 400,
      errors: [
        { code: "A", details: "Primeiro.", errorType: null, property: null, metadata: null },
        { code: "B", details: "Segundo.", errorType: null, property: null, metadata: null },
      ],
    });

    expect(getApiErrorMessage(error)).toBe("Primeiro. Segundo.");
  });
});

describe("isTransientFailure", () => {
  it.each([
    [null, true],
    [500, true],
    [503, true],
    [400, false],
    [401, false],
    [422, false],
    [424, false],
    [429, false],
  ])("status %s → %s", (status, expected) => {
    const error = new ApiError({ title: "Falha", status, errors: [] });

    expect(isTransientFailure(error)).toBe(expected);
  });

  it("não considera transitório o erro que não é da API", () => {
    expect(isTransientFailure(new TypeError("boom"))).toBe(false);
  });
});

describe("hasErrorCode e hasErrorStatus", () => {
  const linkInvalid = new ApiError({
    title: "Regra de negócio",
    status: 422,
    errors: [
      {
        code: "AccountLinkInvalid",
        details: "Este link é inválido ou expirou. Peça um novo.",
        errorType: "business_error",
        property: "token",
        metadata: null,
      },
    ],
  });

  it("reconhece o código e o status do erro da API", () => {
    expect(hasErrorCode(linkInvalid, "AccountLinkInvalid")).toBe(true);
    expect(hasErrorCode(linkInvalid, "InvitationLinkInvalid")).toBe(false);
    expect(hasErrorStatus(linkInvalid, 422)).toBe(true);
    expect(hasErrorStatus(linkInvalid, 401)).toBe(false);
  });

  it("responde não para o que não é erro da API", () => {
    expect(hasErrorCode(null, "AccountLinkInvalid")).toBe(false);
    expect(hasErrorStatus(new TypeError("boom"), 422)).toBe(false);
  });
});

describe("getRetryAfterSeconds", () => {
  function blockedFor(metadata: Record<string, unknown> | null) {
    return new ApiError({
      title: "Limite atingido",
      status: 429,
      errors: [
        {
          code: "SignInTemporarilyBlocked",
          details: "Muitas tentativas de entrada com este e-mail.",
          errorType: "rate_limit_error",
          property: null,
          metadata,
        },
      ],
    });
  }

  it("lê o tempo de espera do metadata", () => {
    expect(getRetryAfterSeconds(blockedFor({ retryAfterSeconds: 840 }))).toBe(840);
  });

  it("devolve null quando o erro não traz o tempo", () => {
    expect(getRetryAfterSeconds(blockedFor(null))).toBeNull();
    expect(getRetryAfterSeconds(blockedFor({ retryAfterSeconds: "840" }))).toBeNull();
    expect(getRetryAfterSeconds(new TypeError("boom"))).toBeNull();
  });
});

describe("fromResponse e networkFailure", () => {
  it("lê o ApiProblemDetails de uma resposta que não veio pelo Axios", () => {
    const error = fromResponse(400, cardTitleRequired);

    expect(error.status).toBe(400);
    expect(error.hasCode("CardTitleRequired")).toBe(true);
  });

  it("trata o corpo fora do formato do Core pelo status", () => {
    expect(fromResponse(401, { message: "Unauthorized" })).toMatchObject({ status: 401 });
    expect(fromResponse(502, null).hasCode("UnexpectedResponse")).toBe(true);
  });

  it("descreve a falha de conexão como a do client", () => {
    const failure = networkFailure();

    expect(failure.status).toBeNull();
    expect(failure.hasCode("NetworkFailure")).toBe(true);
    expect(getApiErrorMessage(failure)).toBe(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
  });
});

describe("fromErrorList", () => {
  it("lê os erros do Core que chegam fora de uma resposta de erro, como num evento de stream", () => {
    const error = fromErrorList([
      {
        code: "AiOrganizationQuotaReached",
        details: "A cota de IA da organização acabou neste mês.",
        error_type: "rate_limit_error",
        property: null,
        metadata: { retry_after_seconds: 86400 },
      },
    ]);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBeNull();
    expect(error.hasCode("AiOrganizationQuotaReached")).toBe(true);
    expect(getApiErrorMessage(error)).toBe("A cota de IA da organização acabou neste mês.");
    expect(getRetryAfterSeconds(error)).toBe(86400);
  });

  it("trata a lista vazia ou fora do formato como falha inesperada, sem mensagem técnica", () => {
    expect(fromErrorList([]).hasCode("UnexpectedFailure")).toBe(true);
    expect(fromErrorList(null).hasCode("UnexpectedFailure")).toBe(true);
    expect(getApiErrorMessage(fromErrorList([{ code: 1 }]))).toBe(
      "Não foi possível concluir a operação. Tente de novo."
    );
  });
});
