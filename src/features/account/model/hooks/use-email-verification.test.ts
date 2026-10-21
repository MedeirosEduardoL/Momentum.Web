import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getApiErrorMessage } from "@/shared/api/api-error";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { previewEmailVerification, verifyEmail } from "../../api/account.service";
import { useEmailVerification } from "./use-email-verification";

vi.mock("../../api/account.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const TOKEN = "token-sintetico";
const ALREADY_VERIFIED_MESSAGE =
  "Este e-mail já foi confirmado. Entre com a sua senha; se não foi você quem a escolheu, troque-a.";
const linkInvalid = apiError(422, "AccountLinkInvalid", "Este link é inválido ou expirou.", {
  property: "token",
});
const alreadyVerified = apiError(409, "AccountEmailAlreadyVerified", ALREADY_VERIFIED_MESSAGE);

const onVerified = vi.fn();

function renderVerification(token: string | null = TOKEN) {
  return renderHook(() => useEmailVerification({ token, onVerified }), {
    wrapper: createQueryWrapper().wrapper,
  }).result;
}

async function renderForm() {
  const result = renderVerification();

  await waitFor(() => expect(result.current.view).toBe("form"));

  return result;
}

async function submit(
  result: ReturnType<typeof renderVerification>,
  values: { name: string; password: string }
) {
  await act(async () => {
    result.current.form.setValue("name", values.name);
    result.current.form.setValue("password", values.password);
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(previewEmailVerification).mockReset().mockResolvedValue({ name: "Ana Souza" });
  vi.mocked(verifyEmail).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  onVerified.mockClear();
});

describe("useEmailVerification — prévia", () => {
  it("trata como link inválido a página aberta sem token, sem chamar a API", () => {
    const result = renderVerification(null);

    expect(result.current.view).toBe("invalid");
    expect(previewEmailVerification).not.toHaveBeenCalled();
  });

  it("preenche o nome com o do cadastro, lido pelo token do link", async () => {
    const result = await renderForm();

    expect(previewEmailVerification).toHaveBeenCalledWith(TOKEN);
    expect(result.current.form.getValues()).toEqual({ name: "Ana Souza", password: "" });
  });

  it("mostra o link inválido quando o Core recusa o token", async () => {
    vi.mocked(previewEmailVerification).mockRejectedValue(linkInvalid);
    const result = renderVerification();

    await waitFor(() => expect(result.current.view).toBe("invalid"));
  });

  it("avisa, com a mensagem do Core, que o e-mail já foi confirmado", async () => {
    vi.mocked(previewEmailVerification).mockRejectedValue(alreadyVerified);
    const result = renderVerification();

    await waitFor(() => expect(result.current.view).toBe("already-verified"));
    expect(getApiErrorMessage(result.current.failure)).toBe(ALREADY_VERIFIED_MESSAGE);
  });

  it("separa a falha técnica do link inválido e deixa tentar de novo", async () => {
    vi.mocked(previewEmailVerification).mockRejectedValueOnce(networkFailure);
    const result = renderVerification();

    await waitFor(() => expect(result.current.view).toBe("unavailable"));
    expect(result.current.failure).toBe(networkFailure);

    await act(() => result.current.retryPreview());

    await waitFor(() => expect(result.current.view).toBe("form"));
  });
});

describe("useEmailVerification — confirmação", () => {
  it("envia o token, o nome escolhido e a senha, e avisa que terminou", async () => {
    const result = await renderForm();

    await submit(result, { name: " Ana Lima ", password: "senha-sintetica-1" });

    expect(vi.mocked(verifyEmail).mock.calls[0][0]).toEqual({
      token: TOKEN,
      name: "Ana Lima",
      password: "senha-sintetica-1",
    });
    expect(onVerified).toHaveBeenCalledTimes(1);
  });

  it("não chama a API com o nome ou a senha fora da regra", async () => {
    const result = await renderForm();

    await submit(result, { name: "", password: "curta" });

    expect(verifyEmail).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("name").error?.message).toBe("Informe o seu nome.");
    expect(result.current.form.getFieldState("password").error?.message).toBe(
      "A senha precisa ter de 10 a 128 caracteres."
    );
  });

  it("troca para o aviso de e-mail já confirmado quando o link foi usado no meio do caminho", async () => {
    vi.mocked(verifyEmail).mockRejectedValue(alreadyVerified);
    const result = await renderForm();

    await submit(result, { name: "Ana Souza", password: "senha-sintetica-1" });

    await waitFor(() => expect(result.current.view).toBe("already-verified"));
    expect(onVerified).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("troca para o link inválido quando o Core recusa o token", async () => {
    vi.mocked(verifyEmail).mockRejectedValue(linkInvalid);
    const result = await renderForm();

    await submit(result, { name: "Ana Souza", password: "senha-sintetica-1" });

    await waitFor(() => expect(result.current.view).toBe("invalid"));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("põe no campo o nome que o Core recusa, mantendo o formulário", async () => {
    vi.mocked(verifyEmail).mockRejectedValue(
      apiError(400, "AccountNameTooLong", "O nome pode ter no máximo 120 caracteres.", {
        property: "name",
      })
    );
    const result = await renderForm();

    await submit(result, { name: "Ana Souza", password: "senha-sintetica-1" });

    expect(result.current.form.getFieldState("name").error?.message).toBe(
      "O nome pode ter no máximo 120 caracteres."
    );
    expect(result.current.view).toBe("form");
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("mostra a falha de rede sem trocar de tela", async () => {
    vi.mocked(verifyEmail).mockRejectedValue(networkFailure);
    const result = await renderForm();

    await submit(result, { name: "Ana Souza", password: "senha-sintetica-1" });

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(result.current.view).toBe("form");
  });
});
