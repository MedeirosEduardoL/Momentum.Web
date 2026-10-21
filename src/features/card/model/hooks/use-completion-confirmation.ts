import { useState } from "react";
import { countTasksClosedBy } from "../lib/card-completion";
import type { CardState, CardSummary } from "../types/card.types";

type PendingCompletion = {
  card: CardSummary;
  openTaskCount: number;
  complete: () => void;
};

export type CompletionConfirmation = ReturnType<typeof useCompletionConfirmation>;

export function useCompletionConfirmation(states: CardState[]) {
  const [pending, setPending] = useState<PendingCompletion | null>(null);

  function request(card: CardSummary, cardStateId: string, complete: () => void) {
    const state = states.find(shown => shown.id === cardStateId);
    const openTaskCount = countTasksClosedBy(card, state);

    if (openTaskCount === 0) {
      complete();
      return;
    }

    setPending({ card, openTaskCount, complete });
  }

  function confirm() {
    setPending(null);
    pending?.complete();
  }

  return { pending, request, confirm, cancel: () => setPending(null) };
}
