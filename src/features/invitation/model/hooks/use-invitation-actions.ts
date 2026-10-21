import { toast } from "sonner";
import { toastApiError } from "@/shared/api/toast-api-error";
import {
  useCancelInvitationMutation,
  useResendInvitationMutation,
} from "../../api/invitation.mutations";
import type { PendingInvitation } from "../types/invitation.types";

export function useInvitationActions() {
  const resending = useResendInvitationMutation();
  const cancellation = useCancelInvitationMutation();

  const resend = (invitation: PendingInvitation) =>
    resending.mutate(invitation.id, {
      onSuccess: () =>
        toast.success(
          `Reenvio pedido para ${invitation.email}. Convite enviado há menos de 1 minuto não sai de novo.`
        ),
      onError: toastApiError,
    });

  async function cancel(invitation: PendingInvitation) {
    try {
      await cancellation.mutateAsync(invitation.id);
      toast.success(`Convite de ${invitation.email} cancelado.`);
    } catch (error) {
      toastApiError(error);
    }
  }

  return {
    resend,
    cancel,
    resendingInvitationId: resending.isPending ? resending.variables : null,
  };
}
