import { toast } from "sonner";
import { toastApiError } from "@/shared/api/toast-api-error";
import { useCloseCardInterviewMutation } from "../../api/card-interview.mutations";

export function useCloseCardInterview() {
  const closing = useCloseCardInterviewMutation();

  return async function closeCardInterview(interviewId: string) {
    try {
      await closing.mutateAsync(interviewId);
      toast.success("A entrevista foi encerrada.");
    } catch (error) {
      toastApiError(error);
    }
  };
}
