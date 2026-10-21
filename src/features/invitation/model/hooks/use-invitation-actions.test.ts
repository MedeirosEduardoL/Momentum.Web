import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, gatewayRateLimit } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { invitationKeys } from "../../api/invitation-api-keys";
import { cancelInvitation, resendInvitation } from "../../api/invitation.service";
import type { PendingInvitation } from "../types/invitation.types";
import { useInvitationActions } from "./use-invitation-actions";

vi.mock("../../api/invitation.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const invitation: PendingInvitation = {
  id: "invitation-1",
  email: "bia@exemplo.test",
  role: "member",
  expiresAt: "2026-10-19T12:00:00Z",
  projects: [],
};
const notFound = apiError(404, "InvitationNotFound", "Convite não encontrado.");

function renderActions() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useInvitationActions(), { wrapper });

  return { result, invalidateQueries };
}

beforeEach(() => {
  vi.mocked(resendInvitation).mockReset().mockResolvedValue(undefined);
  vi.mocked(cancelInvitation).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
});

describe("useInvitationActions — reenviar", () => {
  it("pede o reenvio e diz que envio seguido não sai, sem afirmar que o e-mail saiu", async () => {
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.resend(invitation));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Reenvio pedido para bia@exemplo.test. Convite enviado há menos de 1 minuto não sai de novo."
      )
    );
    expect(vi.mocked(resendInvitation).mock.calls[0][0]).toBe("invitation-1");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: invitationKeys.pending() });
  });

  it("marca o convite que está sendo reenviado", async () => {
    let finishResend = () => {};
    vi.mocked(resendInvitation).mockReturnValue(
      new Promise<void>(resolve => {
        finishResend = resolve;
      })
    );
    const { result } = renderActions();

    act(() => result.current.resend(invitation));

    await waitFor(() => expect(result.current.resendingInvitationId).toBe("invitation-1"));

    await act(async () => finishResend());

    await waitFor(() => expect(result.current.resendingInvitationId).toBeNull());
  });

  it("avisa que o convite atingiu o limite de reenvios", async () => {
    vi.mocked(resendInvitation).mockRejectedValue(
      apiError(
        429,
        "InvitationResendLimitReached",
        "Este convite já foi reenviado o máximo de vezes. Cancele e convide de novo."
      )
    );
    const { result } = renderActions();

    act(() => result.current.resend(invitation));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Este convite já foi reenviado o máximo de vezes. Cancele e convide de novo."
      )
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("avisa o limite do gateway, que não vem no formato do Core", async () => {
    vi.mocked(resendInvitation).mockRejectedValue(gatewayRateLimit);
    const { result } = renderActions();

    act(() => result.current.resend(invitation));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo."
      )
    );
  });

  it("avisa e recarrega a lista quando o convite já não está pendente", async () => {
    vi.mocked(resendInvitation).mockRejectedValue(notFound);
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.resend(invitation));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Convite não encontrado."));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: invitationKeys.pending() });
  });
});

describe("useInvitationActions — cancelar", () => {
  it("cancela o convite, confirma na tela e recarrega a lista", async () => {
    const { result, invalidateQueries } = renderActions();

    await act(() => result.current.cancel(invitation));

    expect(vi.mocked(cancelInvitation).mock.calls[0][0]).toBe("invitation-1");
    expect(toast.success).toHaveBeenCalledWith("Convite de bia@exemplo.test cancelado.");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: invitationKeys.pending() });
  });

  it("avisa e recarrega a lista quando o convite já não existe", async () => {
    vi.mocked(cancelInvitation).mockRejectedValue(notFound);
    const { result, invalidateQueries } = renderActions();

    await act(() => result.current.cancel(invitation));

    expect(toast.error).toHaveBeenCalledWith("Convite não encontrado.");
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: invitationKeys.pending() });
  });
});
