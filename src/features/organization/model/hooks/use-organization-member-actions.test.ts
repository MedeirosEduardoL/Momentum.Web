import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import {
  changeOrganizationMemberAiPermission,
  changeOrganizationMemberRole,
  removeOrganizationMember,
} from "../../api/organization.service";
import type { OrganizationMember } from "../types/organization.types";
import { useOrganizationMemberActions } from "./use-organization-member-actions";

vi.mock("../../api/organization.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const member: OrganizationMember = {
  userId: "user-2",
  name: "Bia Lima",
  email: "bia@exemplo.test",
  role: "member",
  isAiEnabled: false,
};
const lastAdministrator = apiError(
  422,
  "OrganizationLastAdministrator",
  "A organização precisa de pelo menos um administrador."
);

function renderActions() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useOrganizationMemberActions(), { wrapper });

  return { result, invalidateQueries };
}

beforeEach(() => {
  vi.mocked(changeOrganizationMemberRole).mockReset().mockResolvedValue(undefined);
  vi.mocked(changeOrganizationMemberAiPermission).mockReset().mockResolvedValue(undefined);
  vi.mocked(removeOrganizationMember).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
});

describe("useOrganizationMemberActions — papel", () => {
  it("muda o papel do membro e atualiza o que estava em cache", async () => {
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeRole({ userId: "user-2", role: "administrator" }));

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(1));
    expect(vi.mocked(changeOrganizationMemberRole).mock.calls[0][0]).toEqual({
      userId: "user-2",
      role: "administrator",
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("mostra o papel pedido enquanto a mudança está em andamento", async () => {
    let finishChange = () => {};
    vi.mocked(changeOrganizationMemberRole).mockReturnValue(
      new Promise<void>(resolve => {
        finishChange = resolve;
      })
    );
    const { result } = renderActions();

    act(() => result.current.changeRole({ userId: "user-2", role: "administrator" }));

    await waitFor(() =>
      expect(result.current.pendingRoleChange).toEqual({ userId: "user-2", role: "administrator" })
    );

    await act(async () => finishChange());

    await waitFor(() => expect(result.current.pendingRoleChange).toBeNull());
  });

  it("avisa que a organização não pode ficar sem administrador e recarrega os membros", async () => {
    vi.mocked(changeOrganizationMemberRole).mockRejectedValue(lastAdministrator);
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeRole({ userId: "user-1", role: "member" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "A organização precisa de pelo menos um administrador."
      )
    );
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
  });
});

describe("useOrganizationMemberActions — entrevista", () => {
  it("concede a permissão de IA ao membro e atualiza o que estava em cache", async () => {
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeAiPermission({ userId: "user-2", isAiEnabled: true }));

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledTimes(1));
    expect(vi.mocked(changeOrganizationMemberAiPermission).mock.calls[0][0]).toEqual({
      userId: "user-2",
      isAiEnabled: true,
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("mostra a marcação pedida e trava as outras mudanças enquanto a chamada corre", async () => {
    let finishChange = () => {};
    vi.mocked(changeOrganizationMemberAiPermission).mockReturnValue(
      new Promise<void>(resolve => {
        finishChange = resolve;
      })
    );
    const { result } = renderActions();

    act(() => result.current.changeAiPermission({ userId: "user-2", isAiEnabled: true }));

    await waitFor(() =>
      expect(result.current.pendingAiPermissionChange).toEqual({
        userId: "user-2",
        isAiEnabled: true,
      })
    );
    expect(result.current.isChanging).toBe(true);

    await act(async () => finishChange());

    await waitFor(() => expect(result.current.pendingAiPermissionChange).toBeNull());
    expect(result.current.isChanging).toBe(false);
  });

  it("mostra a recusa do Core a quem deixou de administrar a organização e recarrega os membros", async () => {
    vi.mocked(changeOrganizationMemberAiPermission).mockRejectedValue(
      apiError(403, "AccessDenied", "Você não tem permissão para esta operação.")
    );
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeAiPermission({ userId: "user-2", isAiEnabled: true }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Você não tem permissão para esta operação.")
    );
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
  });
});

describe("useOrganizationMemberActions — remoção", () => {
  it("remove o membro, confirma na tela e atualiza o que estava em cache", async () => {
    const { result, invalidateQueries } = renderActions();

    await act(() => result.current.remove(member));

    expect(vi.mocked(removeOrganizationMember).mock.calls[0][0]).toBe("user-2");
    expect(toast.success).toHaveBeenCalledWith("Bia Lima não participa mais da organização.");
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
  });

  it("avisa quando a remoção deixaria a organização sem administrador", async () => {
    vi.mocked(removeOrganizationMember).mockRejectedValue(lastAdministrator);
    const { result } = renderActions();

    await act(() => result.current.remove(member));

    expect(toast.error).toHaveBeenCalledWith(
      "A organização precisa de pelo menos um administrador."
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("trata a falha de rede sem deixar o erro escapar para a tela", async () => {
    vi.mocked(removeOrganizationMember).mockRejectedValue(networkFailure);
    const { result } = renderActions();

    await expect(act(() => result.current.remove(member))).resolves.toBeUndefined();

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
  });
});
