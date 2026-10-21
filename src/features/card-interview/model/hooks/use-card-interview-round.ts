import { useEffect, useRef, useState } from "react";
import { useGetCurrentOrganization } from "@/features/organization";
import { useAskCardInterviewRoundMutation } from "../../api/card-interview.mutations";
import { isInterviewNotEnabled, isRoundLimitReached } from "../lib/card-interview-failure";
import type { CardInterviewAnswer, CardInterviewRound } from "../types/card-interview.types";

export type RoundRequestState = ReturnType<typeof useCardInterviewRound>;

export function useCardInterviewRound() {
  const organization = useGetCurrentOrganization();
  const asking = useAskCardInterviewRoundMutation();
  const [failure, setFailure] = useState<unknown>(null);
  const stream = useRef<AbortController | null>(null);

  useEffect(() => () => stream.current?.abort(), []);

  function refuse(error: unknown) {
    if (!isRoundLimitReached(error)) {
      setFailure(error);
    }

    if (isInterviewNotEnabled(error)) {
      void organization.refetch();
    }
  }

  async function ask(
    interviewId: string,
    answers: CardInterviewAnswer[]
  ): Promise<CardInterviewRound | null> {
    if (stream.current) {
      return null;
    }

    const current = new AbortController();
    stream.current = current;
    setFailure(null);

    try {
      return await asking.mutateAsync({ interviewId, answers, signal: current.signal });
    } catch (error) {
      if (!current.signal.aborted) {
        refuse(error);
      }

      return null;
    } finally {
      stream.current = null;
    }
  }

  return {
    ask,
    cancel: () => stream.current?.abort(),
    isAsking: asking.isPending,
    failure,
  };
}
