import type { Card } from "@/features/card";
import { useGetCurrentOrganization } from "@/features/organization";
import { toastApiError } from "@/shared/api/toast-api-error";
import { useStartCardInterviewMutation } from "../../api/card-interview.mutations";
import { isInterviewNotEnabled } from "../lib/card-interview-failure";
import type { RoundRequestState } from "./use-card-interview-round";

export function useStartCardInterview(card: Card, askRound: RoundRequestState["ask"]) {
  const organization = useGetCurrentOrganization();
  const start = useStartCardInterviewMutation();

  function refuse(error: unknown) {
    toastApiError(error);

    if (isInterviewNotEnabled(error)) {
      void organization.refetch();
    }
  }

  return {
    startInterview: () =>
      start.mutate(card.id, {
        onSuccess: interview => void askRound(interview.id, []),
        onError: refuse,
      }),
    isStarting: start.isPending,
  };
}
