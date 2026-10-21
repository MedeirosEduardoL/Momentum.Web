import { describe, expect, it } from "vitest";
import { ApiError } from "./api-error";
import { createQueryClient, shouldRetryQuery } from "./query-config";

function failure(status: number | null) {
  return new ApiError({ title: "Falha", status, errors: [] });
}

describe("shouldRetryQuery", () => {
  it("tenta de novo a falha transitória até duas vezes", () => {
    expect(shouldRetryQuery(0, failure(null))).toBe(true);
    expect(shouldRetryQuery(1, failure(503))).toBe(true);
    expect(shouldRetryQuery(2, failure(503))).toBe(false);
  });

  it("não repete erro de negócio, limite nem falha de serviço externo", () => {
    expect(shouldRetryQuery(0, failure(422))).toBe(false);
    expect(shouldRetryQuery(0, failure(424))).toBe(false);
    expect(shouldRetryQuery(0, failure(429))).toBe(false);
  });
});

describe("createQueryClient", () => {
  it("aplica a política de retry e o staleTime padrão", () => {
    const queryDefaults = createQueryClient().getDefaultOptions().queries;

    expect(queryDefaults?.retry).toBe(shouldRetryQuery);
    expect(queryDefaults?.staleTime).toBe(30_000);
  });

  it("não guarda a mutação terminada, que pode levar senha nas variáveis", () => {
    const mutationDefaults = createQueryClient().getDefaultOptions().mutations;

    expect(mutationDefaults?.gcTime).toBe(0);
  });
});
