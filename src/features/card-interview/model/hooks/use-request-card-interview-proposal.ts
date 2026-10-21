import { useRef, useState } from "react";
import { useGetCurrentOrganization } from "@/features/organization";
import { useRequestCardInterviewProposalMutation } from "../../api/card-interview.mutations";
import { isInterviewNotEnabled } from "../lib/card-interview-failure";

export type ProposalRequestState = ReturnType<typeof useRequestCardInterviewProposal>;

export function useRequestCardInterviewProposal(interviewId: string) {
  const organization = useGetCurrentOrganization();
  const requesting = useRequestCardInterviewProposalMutation();
  const [failure, setFailure] = useState<unknown>(null);
  const isRunning = useRef(false);

  function refuse(error: unknown) {
    setFailure(error);

    if (isInterviewNotEnabled(error)) {
      void organization.refetch();
    }
  }

  async function request() {
    if (isRunning.current) {
      return;
    }

    isRunning.current = true;
    setFailure(null);

    try {
      await requesting.mutateAsync(interviewId);
    } catch (error) {
      refuse(error);
    } finally {
      isRunning.current = false;
    }
  }

  return { request, isRequesting: requesting.isPending, failure };
}
