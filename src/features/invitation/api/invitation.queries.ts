import { skipToken, useQuery } from "@tanstack/react-query";
import { invitationKeys } from "./invitation-api-keys";
import { listPendingInvitations, previewInvitation } from "./invitation.service";

export function useGetInvitationPreview(token: string | null) {
  return useQuery({
    queryKey: invitationKeys.preview(token),
    queryFn: token === null ? skipToken : () => previewInvitation(token),
    staleTime: Infinity,
    gcTime: 0,
  });
}

export function useListPendingInvitations() {
  return useQuery({
    queryKey: invitationKeys.pending(),
    queryFn: listPendingInvitations,
  });
}
