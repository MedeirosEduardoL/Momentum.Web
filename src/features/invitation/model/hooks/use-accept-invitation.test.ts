import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { session } from "@/shared/api/client";
import { apiError, gatewayRateLimit, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { acceptInvitation, previewInvitation } from "../../api/invitation.service";
import type { InvitationPreview } from "../types/invitation.types";
import { useAcceptInvitation } from "./use-accept-invitation";

vi.mock("../../api/invitation.service");
vi.mock("@/shared/api/client", () => ({ session: { open: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const TOKEN = "token-sintetico";
const linkInvalid = apiError(
  422,
  "InvitationLinkInvalid",
  "Este convite é inválido, expirou ou foi cancelado.",
  { property: "token" }
);
const newAccountPreview: InvitationPreview = {
  organizationName: "Lua Nova",
  email: "bia@exemplo.test",
  accountExists: false,
};
const existingAccountPreview: InvitationPreview = { ...newAccountPreview, accountExists: true };

const onAccepted = vi.fn();
const onSessionNotOpened = vi.fn();

function renderAcceptance(token: string | null = TOKEN) {
  const { queryClient, wrapper } = createQueryWrapper();
  const { result } = renderHook(
    () => useAcceptInvitation({ token, onAccepted, onSessionNotOpened }),
    { wrapper }
  );

  return { result, queryClient };
}

async function renderForm(preview: InvitationPreview) {
  vi.mocked(previewInvitation).mockResolvedValue(preview);
  const rendered = renderAcceptance();

  await waitFor(() => expect(rendered.result.current.view).toBe("form"));

  return rendered;
}

async function submit(
  result: ReturnType<typeof renderAcceptance>["result"],
  values: { name: string; password: string }
) {
  await act(async () => {
    result.current.form.reset(values);
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(previewInvitation).mockReset();
  vi.mocked(acceptInvitation).mockReset().mockResolvedValue(undefined);
  vi.mocked(session.open).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  onAccepted.mockClear();
  onSessionNotOpened.mockClear();
});

describe("useAcceptInvitation — prévia", () => {
  it("trata como convite inválido a página aberta sem token, sem chamar a API", () => {
    const { result } = renderAcceptance(null);

    expect(result.current.view).toBe("invalid");
    expect(previewInvitation).not.toHaveBeenCalled();
  });

  it("carrega a prévia com o token do link", async () => {
    const { result } = await renderForm(newAccountPreview);

    expect(previewInvitation).toHaveBeenCalledWith(TOKEN);
    expect(result.current.preview).toEqual(newAccountPreview);
  });

  it("mostra convite inválido quando o Core recusa o token", async () => {
    vi.mocked(previewInvitation).mockRejectedValue(linkInvalid);
    const { result } = renderAcceptance();

    await waitFor(() => expect(result.current.view).toBe("invalid"));
  });

  it("separa a falha técnica do convite inválido", async () => {
    vi.mocked(previewInvitation).mockRejectedValue(networkFailure);
    const { result } = renderAcceptance();

    await waitFor(() => expect(result.current.view).toBe("unavailable"));
    expect(result.current.previewError).toBe(networkFailure);
  });
});

describe("useAcceptInvitation — aceite", () => {
  it("cria a conta com nome e senha, abre a sessão com o e-mail da prévia e segue", async () => {
    const { result } = await renderForm(newAccountPreview);

    await submit(result, { name: " Bia Lima ", password: "senha-sintetica-1" });

    expect(vi.mocked(acceptInvitation).mock.calls[0][0]).toEqual({
      token: TOKEN,
      name: "Bia Lima",
      password: "senha-sintetica-1",
    });
    expect(vi.mocked(session.open).mock.calls[0][0]).toEqual({
      email: "bia@exemplo.test",
      password: "senha-sintetica-1",
    });
    expect(onAccepted).toHaveBeenCalledTimes(1);
    expect(onSessionNotOpened).not.toHaveBeenCalled();
  });

  it("pede só a senha de quem já tem conta e não manda o nome", async () => {
    const { result } = await renderForm(existingAccountPreview);

    await submit(result, { name: "", password: "curta" });

    expect(vi.mocked(acceptInvitation).mock.calls[0][0]).toEqual({
      token: TOKEN,
      name: null,
      password: "curta",
    });
    expect(onAccepted).toHaveBeenCalledTimes(1);
  });

  it("valida nome e senha nova de quem ainda não tem conta", async () => {
    const { result } = await renderForm(newAccountPreview);

    await submit(result, { name: "", password: "curta" });

    expect(acceptInvitation).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("name").error?.message).toBe("Informe o seu nome.");
    expect(result.current.form.getFieldState("password").error?.message).toBe(
      "A senha precisa ter de 10 a 128 caracteres."
    );
  });

  it("põe no campo a senha que não confere e não abre a sessão", async () => {
    vi.mocked(acceptInvitation).mockRejectedValue(
      apiError(422, "InvitationPasswordInvalid", "A senha não confere com a da sua conta.", {
        property: "password",
      })
    );
    const { result } = await renderForm(existingAccountPreview);

    await submit(result, { name: "", password: "senha-errada" });

    expect(result.current.form.getFieldState("password").error?.message).toBe(
      "A senha não confere com a da sua conta."
    );
    expect(session.open).not.toHaveBeenCalled();
    expect(onAccepted).not.toHaveBeenCalled();
  });

  it("põe no campo o nome recusado pelo Core", async () => {
    vi.mocked(acceptInvitation).mockRejectedValue(
      apiError(400, "AccountNameInvalid", "O nome não pode ter quebra de linha.", {
        property: "name",
      })
    );
    const { result } = await renderForm(newAccountPreview);

    await submit(result, { name: "Bia Lima", password: "senha-sintetica-1" });

    expect(result.current.form.getFieldState("name").error?.message).toBe(
      "O nome não pode ter quebra de linha."
    );
  });

  it("troca para convite inválido quando o link morre antes do aceite", async () => {
    vi.mocked(acceptInvitation).mockRejectedValue(linkInvalid);
    const { result } = await renderForm(newAccountPreview);

    await submit(result, { name: "Bia Lima", password: "senha-sintetica-1" });

    await waitFor(() => expect(result.current.view).toBe("invalid"));
    expect(toast.error).not.toHaveBeenCalled();
    expect(session.open).not.toHaveBeenCalled();
  });

  it("avisa quem já participa de uma organização", async () => {
    vi.mocked(acceptInvitation).mockRejectedValue(
      apiError(409, "OrganizationAlreadyJoined", "Você já participa de uma organização.")
    );
    const { result } = await renderForm(existingAccountPreview);

    await submit(result, { name: "", password: "senha-sintetica-1" });

    expect(toast.error).toHaveBeenCalledWith("Você já participa de uma organização.");
    expect(session.open).not.toHaveBeenCalled();
  });

  it("manda para o login quando o convite foi aceito e a sessão não abriu", async () => {
    vi.mocked(session.open).mockRejectedValue(gatewayRateLimit);
    const { result } = await renderForm(newAccountPreview);

    await submit(result, { name: "Bia Lima", password: "senha-sintetica-1" });

    expect(onSessionNotOpened).toHaveBeenCalledTimes(1);
    expect(onAccepted).not.toHaveBeenCalled();
  });

  it("mantém o formulário quando a prévia é refeita depois do aceite e o link já foi usado", async () => {
    const { result, queryClient } = await renderForm(newAccountPreview);
    vi.mocked(previewInvitation).mockRejectedValue(linkInvalid);

    await act(() => queryClient.invalidateQueries());

    await waitFor(() => expect(result.current.previewError).toBe(linkInvalid));
    expect(result.current.view).toBe("form");
  });
});
