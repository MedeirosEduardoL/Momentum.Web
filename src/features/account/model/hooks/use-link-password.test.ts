import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { useResetPasswordMutation } from "../../api/account.mutations";
import { resetPassword } from "../../api/account.service";
import { linkPasswordSchema } from "../schemas/link-password.schema";
import { useLinkPassword } from "./use-link-password";

vi.mock("../../api/account.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const resolver = zodResolver(linkPasswordSchema);
const onDone = vi.fn();

function renderLinkPassword(token: string | null) {
  return renderHook(
    () => useLinkPassword({ token, resolver, submission: useResetPasswordMutation(), onDone }),
    { wrapper: createQueryWrapper().wrapper }
  ).result;
}

async function submit(token: string | null, password: string) {
  const result = renderLinkPassword(token);

  await act(async () => {
    result.current.form.setValue("password", password);
    await result.current.onSubmit();
  });

  return result;
}

beforeEach(() => {
  vi.mocked(resetPassword).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  onDone.mockClear();
});

describe("useLinkPassword", () => {
  it("envia o token do link com a senha e avisa que terminou", async () => {
    const result = await submit("token-sintetico", "senha-sintetica-1");

    expect(vi.mocked(resetPassword).mock.calls[0][0]).toEqual({
      token: "token-sintetico",
      password: "senha-sintetica-1",
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(result.current.isLinkInvalid).toBe(false);
  });

  it("trata como link inválido a página aberta sem token", async () => {
    const result = await submit(null, "senha-sintetica-1");

    expect(result.current.isLinkInvalid).toBe(true);
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("não chama a API com a senha fora da regra", async () => {
    const result = await submit("token-sintetico", "curta");

    expect(resetPassword).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("password").error?.message).toBe(
      "A senha precisa ter de 10 a 128 caracteres."
    );
  });

  it("troca para o link inválido quando o Core recusa o token", async () => {
    vi.mocked(resetPassword).mockRejectedValue(
      apiError(422, "AccountLinkInvalid", "Este link é inválido ou expirou. Peça um novo.", {
        property: "token",
      })
    );

    const result = await submit("token-vencido", "senha-sintetica-1");

    await waitFor(() => expect(result.current.isLinkInvalid).toBe(true));
    expect(onDone).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("põe no campo a senha que o Core recusa, mantendo o link válido", async () => {
    vi.mocked(resetPassword).mockRejectedValue(
      apiError(400, "AccountPasswordNotAcceptable", "A senha precisa ter de 10 a 128 caracteres.", {
        property: "password",
      })
    );

    const result = await submit("token-sintetico", "outra-senha-qualquer");

    expect(result.current.form.getFieldState("password").error?.message).toBe(
      "A senha precisa ter de 10 a 128 caracteres."
    );
    expect(result.current.isLinkInvalid).toBe(false);
    expect(onDone).not.toHaveBeenCalled();
  });

  it("mostra a falha de rede sem trocar de tela", async () => {
    vi.mocked(resetPassword).mockRejectedValue(networkFailure);

    const result = await submit("token-sintetico", "senha-sintetica-1");

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(result.current.isLinkInvalid).toBe(false);
  });
});
