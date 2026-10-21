import { useMutation, useQueryClient } from "@tanstack/react-query";
import { session } from "@/shared/api/client";
import { invitationKeys } from "./invitation-api-keys";
import {
  acceptInvitation,
  cancelInvitation,
  createInvitation,
  resendInvitation,
} from "./invitation.service";

function useRefreshPendingInvitations() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: invitationKeys.pending() });
}

export function useAcceptInvitationMutation() {
  return useMutation({ mutationFn: acceptInvitation });
}

export function useOpenSessionMutation() {
  return useMutation({ mutationFn: session.open });
}

export function useCreateInvitationMutation() {
  const refreshPendingInvitations = useRefreshPendingInvitations();

  return useMutation({ mutationFn: createInvitation, onSettled: refreshPendingInvitations });
}

export function useResendInvitationMutation() {
  const refreshPendingInvitations = useRefreshPendingInvitations();

  return useMutation({ mutationFn: resendInvitation, onSettled: refreshPendingInvitations });
}

export function useCancelInvitationMutation() {
  const refreshPendingInvitations = useRefreshPendingInvitations();

  return useMutation({ mutationFn: cancelInvitation, onSettled: refreshPendingInvitations });
}
