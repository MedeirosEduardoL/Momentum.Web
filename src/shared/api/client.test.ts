import {
  AxiosError,
  CanceledError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api-error";
import { api } from "./client";

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
  vi.unstubAllEnvs();
});

function respondWith(status: number, data: unknown) {
  const sentRequests: InternalAxiosRequestConfig[] = [];

  api.defaults.adapter = async config => {
    sentRequests.push(config);
    const response: AxiosResponse = { config, data, headers: {}, status, statusText: "" };

    if (status >= 400) {
      throw new AxiosError("Request failed", AxiosError.ERR_BAD_REQUEST, config, null, response);
    }

    return response;
  };

  return sentRequests;
}

describe("api", () => {
  it("manda o cookie de sessão e o X-Requested-With numa mutação", async () => {
    const sentRequests = respondWith(204, null);

    await api.post("/api/v1/cards", { title: "Card" });

    expect(sentRequests[0].withCredentials).toBe(true);
    expect(sentRequests[0].headers.get("X-Requested-With")).toBe("XMLHttpRequest");
  });

  it("sem VITE_API_BASE_URL, chama a API na mesma origem, pelo caminho do contrato", async () => {
    const sentRequests = respondWith(200, {});

    await api.get("/api/v1/health");

    expect(api.getUri(sentRequests[0])).toBe("/api/v1/health");
  });

  it("com VITE_API_BASE_URL, chama a API nesse endereço", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://gateway.exemplo.test");
    vi.resetModules();
    const { api: configuredApi } = await import("./client");

    expect(configuredApi.getUri({ url: "/api/v1/health" })).toBe(
      "https://gateway.exemplo.test/api/v1/health"
    );
  });

  it("rejeita a resposta de erro do Core como ApiError", async () => {
    respondWith(404, {
      title: "Não encontrado",
      status: 404,
      errors: [{ code: "CardNotFound", details: "Card não encontrado." }],
    });

    const failure = api.get("/api/v1/cards/123");

    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({ status: 404 });
  });

  it("deixa o cancelamento chegar como cancelamento", async () => {
    api.defaults.adapter = async config => {
      throw new CanceledError(undefined, undefined, config);
    };

    await expect(api.get("/api/v1/health")).rejects.toBeInstanceOf(CanceledError);
  });
});
