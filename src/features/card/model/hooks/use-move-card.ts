import { useState } from "react";
import { toast } from "sonner";
import { toastApiError } from "@/shared/api/toast-api-error";
import { useSetCardAssigneeMutation, useUpdateCardMutation } from "../../api/card.mutations";
import { wasCardChangedMeanwhile } from "../lib/card-refusal";
import { changesAssignee, changesPlace } from "../lib/card-state-columns";
import type { CardMove, CardPlace, CardSummary } from "../types/card.types";

const CHANGED_MEANWHILE_MESSAGE =
  "O card foi alterado por outra pessoa. O board mostra a versão atual: confira e mova de novo.";

function refuse(error: unknown) {
  if (wasCardChangedMeanwhile(error)) {
    toast.error(CHANGED_MEANWHILE_MESSAGE);
    return;
  }

  toastApiError(error);
}

export function useMoveCard(onMoved: () => Promise<unknown>) {
  const update = useUpdateCardMutation();
  const assignment = useSetCardAssigneeMutation();
  const [pendingMove, setPendingMove] = useState<CardMove | null>(null);

  async function save(card: CardSummary, place: CardPlace) {
    if (card.state.id !== place.cardStateId) {
      await update.mutateAsync({ cardId: card.id, cardStateId: place.cardStateId });
    }

    if (changesAssignee(card, place)) {
      await assignment.mutateAsync({ cardId: card.id, userId: place.assignee?.userId ?? null });
    }
  }

  async function move(card: CardSummary, place: CardPlace) {
    if (pendingMove || !changesPlace(card, place)) {
      return;
    }

    setPendingMove({ cardId: card.id, ...place });
    await save(card, place).catch(refuse);
    await onMoved().finally(() => setPendingMove(null));
  }

  return { move, pendingMove };
}
