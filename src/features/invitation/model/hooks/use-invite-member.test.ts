import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/features/project";
import { apiError, gatewayRateLimit, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { invitationKeys } from "../../api/invitation-api-keys";
import { createInvitation } from "../../api/invitation.service";
import type { InvitationFormValues } from "../schemas/invitation.schema";
import { useInviteMember } from "./use-invite-member";

vi.mock("../../api/invitation.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const projects: Project[] = [
  { id: "project-1", name: "Momentum", key: "MOM", role: "administrator" },
  { id: "project-2", name: "Suporte", key: "SUP", role: "administrator" },
];
const validValues: InvitationFormValues = {
  email: " Bia@Exemplo.Test ",
  role: "member",
  projectRoles: { "project-1": "administrator", "project-2": "none" },
};
const onInvited = vi.fn();

function renderInviteMember() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useInviteMember({ projects, onInvited }), { wrapper });

  return { result, invalidateQueries };
}

async function submit(
  result: ReturnType<typeof renderInviteMember>["result"],
  values: InvitationFormValues
) {
  await act(async () => {
    result.current.form.reset(values);
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(createInvitation).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
  onInvited.mockClear();
});

describe("useInviteMember", () => {
  it("começa como membro, fora do time de todos os projetos", () => {
    const { result } = renderInviteMember();

    expect(result.current.form.getValues()).toEqual({
      email: "",
      role: "member",
      projectRoles: { "project-1": "none", "project-2": "none" },
    });
  });

  it("convida com o e-mail normalizado, o papel e só os projetos escolhidos", async () => {
    const { result, invalidateQueries } = renderInviteMember();

    await submit(result, validValues);

    expect(vi.mocked(createInvitation).mock.calls[0][0]).toEqual({
      email: "bia@exemplo.test",
      role: "member",
      projects: [{ projectId: "project-1", role: "administrator" }],
    });
    expect(toast.success).toHaveBeenCalledWith("Convite enviado para bia@exemplo.test.");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: invitationKeys.pending() });
    expect(onInvited).toHaveBeenCalledTimes(1);
  });

  it("não chama a API com o e-mail inválido", async () => {
    const { result } = renderInviteMember();

    await submit(result, { ...validValues, email: "bia" });

    expect(createInvitation).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("email").error?.message).toBe(
      "Informe um e-mail válido."
    );
  });

  it.each([
    [409, "InvitationEmailAlreadyMember", "Esta pessoa já participa da organização."],
    [
      409,
      "InvitationEmailInAnotherOrganization",
      "Este e-mail já participa de outra organização e não pode ser convidado.",
    ],
    [
      409,
      "InvitationAlreadyPending",
      "Já existe um convite pendente para este e-mail. Reenvie ou cancele o convite anterior.",
    ],
    [400, "InvitationEmailInvalid", "Informe um e-mail válido para o convite."],
  ])("põe no campo do e-mail a recusa %i %s do Core", async (status, code, details) => {
    vi.mocked(createInvitation).mockRejectedValue(
      apiError(status, code, details, { property: "email" })
    );
    const { result } = renderInviteMember();

    await submit(result, validValues);

    expect(result.current.form.getFieldState("email").error?.message).toBe(details);
    expect(toast.error).not.toHaveBeenCalled();
    expect(onInvited).not.toHaveBeenCalled();
  });

  it("põe no campo do papel a falta dele apontada pelo Core", async () => {
    vi.mocked(createInvitation).mockRejectedValue(
      apiError(400, "InvitationRoleRequired", "Informe o papel da pessoa na organização.", {
        property: "role",
      })
    );
    const { result } = renderInviteMember();

    await submit(result, validValues);

    expect(result.current.form.getFieldState("role").error?.message).toBe(
      "Informe o papel da pessoa na organização."
    );
  });

  it.each([
    [422, "InvitationProjectNotFound", "Um dos projetos do convite não existe na organização."],
    [
      400,
      "InvitationProjectInvalid",
      "Cada projeto do convite precisa do projeto e do papel, sem repetir projeto.",
    ],
  ])("mostra junto dos projetos a recusa %i %s do Core", async (status, code, details) => {
    vi.mocked(createInvitation).mockRejectedValue(
      apiError(status, code, details, { property: "projects" })
    );
    const { result } = renderInviteMember();

    await submit(result, validValues);

    expect(result.current.projectsError).toBe(details);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("avisa que a organização atingiu o limite de convites do dia", async () => {
    vi.mocked(createInvitation).mockRejectedValue(
      apiError(
        429,
        "InvitationDailyLimitReached",
        "A organização atingiu o limite de convites por dia. Tente de novo amanhã."
      )
    );
    const { result } = renderInviteMember();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith(
      "A organização atingiu o limite de convites por dia. Tente de novo amanhã."
    );
    expect(onInvited).not.toHaveBeenCalled();
  });

  it("avisa o limite do gateway, que não vem no formato do Core", async () => {
    vi.mocked(createInvitation).mockRejectedValue(gatewayRateLimit);
    const { result } = renderInviteMember();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith(
      "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo."
    );
  });

  it("recarrega os convites mesmo na falha, porque o convite pode ter sido gravado", async () => {
    vi.mocked(createInvitation).mockRejectedValue(networkFailure);
    const { result, invalidateQueries } = renderInviteMember();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: invitationKeys.pending() });
    expect(onInvited).not.toHaveBeenCalled();
  });
});
