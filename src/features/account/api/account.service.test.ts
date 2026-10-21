import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { apiError, networkFailure } from "@/test/api-errors";
import {
  getCurrentAccount,
  previewEmailVerification,
  registerAccount,
  requestEmailVerification,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from "./account.service";

vi.mock("@/shared/api/client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: null });
});

describe("getCurrentAccount", () => {
  it("adapta a conta do contrato para o tipo interno", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { user_id: "user-1", name: "Ana Souza", email: "ana@exemplo.test" },
    });

    await expect(getCurrentAccount()).resolves.toEqual({
      id: "user-1",
      name: "Ana Souza",
      email: "ana@exemplo.test",
    });
    expect(api.get).toHaveBeenCalledWith("/api/v1/accounts/me");
  });

  it("devolve null quando não há sessão, venha o 401 do Core ou do Kong", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(
      apiError(401, "AuthenticationRequired", "Entre para continuar.")
    );
    await expect(getCurrentAccount()).resolves.toBeNull();

    vi.mocked(api.get).mockRejectedValueOnce(
      apiError(401, "UnexpectedResponse", "Não foi possível concluir a operação.")
    );
    await expect(getCurrentAccount()).resolves.toBeNull();
  });

  it("repassa a falha que não é falta de sessão", async () => {
    vi.mocked(api.get).mockRejectedValue(networkFailure);

    await expect(getCurrentAccount()).rejects.toBe(networkFailure);
  });
});

describe("ações da conta", () => {
  it("cadastra a conta só com nome e e-mail", async () => {
    await registerAccount({ name: "Ana Souza", email: "ana@exemplo.test" });

    expect(api.post).toHaveBeenCalledWith("/api/v1/accounts", {
      name: "Ana Souza",
      email: "ana@exemplo.test",
    });
  });

  it("lê pelo token do link o nome do cadastro", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { name: "Ana Souza" } });

    await expect(previewEmailVerification("token-sintetico")).resolves.toEqual({
      name: "Ana Souza",
    });
    expect(api.post).toHaveBeenCalledWith("/api/v1/email-verification-previews", {
      token: "token-sintetico",
    });
  });

  it("confirma o e-mail com o token do link, o nome e a senha escolhidos", async () => {
    await verifyEmail({
      token: "token-sintetico",
      name: "Ana Souza",
      password: "senha-sintetica-1",
    });

    expect(api.post).toHaveBeenCalledWith("/api/v1/email-verifications", {
      token: "token-sintetico",
      name: "Ana Souza",
      password: "senha-sintetica-1",
    });
  });

  it("pede o reenvio do link de confirmação", async () => {
    await requestEmailVerification("ana@exemplo.test");

    expect(api.post).toHaveBeenCalledWith("/api/v1/email-verification-requests", {
      email: "ana@exemplo.test",
    });
  });

  it("pede o link de troca de senha", async () => {
    await requestPasswordReset("ana@exemplo.test");

    expect(api.post).toHaveBeenCalledWith("/api/v1/password-reset-requests", {
      email: "ana@exemplo.test",
    });
  });

  it("grava a senha nova com o token do link", async () => {
    await resetPassword({ token: "token-sintetico", password: "senha-sintetica-2" });

    expect(api.post).toHaveBeenCalledWith("/api/v1/password-resets", {
      token: "token-sintetico",
      password: "senha-sintetica-2",
    });
  });
});
