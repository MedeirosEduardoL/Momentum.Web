import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/api/api-error";
import { useSignOutMutation } from "../../api/account.mutations";

export function useSignOut() {
  const signOut = useSignOutMutation();

  const onSignOut = () =>
    signOut.mutate(undefined, {
      onError: error => toast.error(getApiErrorMessage(error)),
    });

  return { onSignOut, isSigningOut: signOut.isPending };
}
