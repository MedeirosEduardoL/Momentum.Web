import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { session } from "@/shared/api/client";
import { apiError, gatewayRateLimit, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { useSignIn } from "./use-sign-in";

vi.mock("@/shared/api/client", () => ({ session: { open: vi.fn(), close: vi.fn() } }));

async function signIn(email: string, password: string) {
  const { result } = renderHook(() => useSignIn(), { wrapper: createQueryWrapper().wrapper });

  await act(async () => {
    result.current.form.setValue("email", email);
    result.current.form.setValue("password", password);
    await result.current.onSubmit();
  });

  return result;
}

beforeEach(() => {
  vi.mocked(session.open).mockReset().mockResolvedValue(undefined);
});

describe("useSignIn", () => {
  it("abre a sessão com o e-mail normalizado e a senha", async () => {
    const result = await signIn(" Ana@Exemplo.Test ", "senha-sintetica-1");

    expect(vi.mocked(session.open).mock.calls[0][0]).toEqual({
      email: "ana@exemplo.test",
      password: "senha-sintetica-1",
    });
    expect(result.current.refusal).toBeUndefined();
  });

  it("não chama a API com o formulário inválido", async () => {
    const result = await signIn("ana", "");

    expect(session.open).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("email").error?.message).toBe(
      "Informe um e-mail válido."
    );
    expect(result.current.form.getFieldState("password").error?.message).toBe(
      "Informe a sua senha."
    );
  });

  it("mostra no formulário a recusa das credenciais, com a dica de confirmar o e-mail", async () => {
    const details =
      "E-mail ou senha incorretos. Se você acabou de se cadastrar, confirme o seu e-mail pelo link que enviamos.";
    vi.mocked(session.open).mockRejectedValue(apiError(401, "AccountCredentialsInvalid", details));

    const result = await signIn("ana@exemplo.test", "senha-errada");

    expect(result.current.refusal).toBe(details);
  });

  it("diz quanto falta para o login bloqueado ser liberado", async () => {
    vi.mocked(session.open).mockRejectedValue(
      apiError(429, "SignInTemporarilyBlocked", "Muitas tentativas de entrada com este e-mail.", {
        metadata: { retryAfterSeconds: 840 },
      })
    );

    const result = await signIn("ana@exemplo.test", "senha-errada");

    expect(result.current.refusal).toBe(
      "Muitas tentativas de entrada com este e-mail. Tente de novo em 14 minutos."
    );
  });

  it("trata pelo status o limite do Kong, que não vem no formato do Core", async () => {
    vi.mocked(session.open).mockRejectedValue(gatewayRateLimit);

    const result = await signIn("ana@exemplo.test", "senha-sintetica-1");

    expect(result.current.refusal).toBe(
      "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo."
    );
  });

  it("mostra a falha de rede sem quebrar a tela", async () => {
    vi.mocked(session.open).mockRejectedValue(networkFailure);

    const result = await signIn("ana@exemplo.test", "senha-sintetica-1");

    expect(result.current.refusal).toBe(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    await waitFor(() => expect(result.current.isSaving).toBe(false));
  });
});
