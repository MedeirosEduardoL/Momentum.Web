import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cardKeys } from "./card-api-keys";
import { createCardRelation, deleteCardRelation } from "./card-relation.service";
import {
  createCardTask,
  deleteCardTask,
  setCardTaskAssignee,
  updateCardTask,
} from "./card-task.service";
import {
  createCard,
  createCardState,
  deleteCardState,
  setCardAssignee,
  setCardFeature,
  updateCard,
  updateCardState,
} from "./card.service";

function useRefreshCards() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: cardKeys.all });
}

export function useCreateCardMutation() {
  const refreshCards = useRefreshCards();

  return useMutation({ mutationFn: createCard, onSettled: refreshCards });
}

export function useUpdateCardMutation() {
  const refreshCards = useRefreshCards();

  return useMutation({ mutationFn: updateCard, onSettled: refreshCards });
}

export function useSetCardAssigneeMutation() {
  const refreshCards = useRefreshCards();

  return useMutation({ mutationFn: setCardAssignee, onSettled: refreshCards });
}

export function useSetCardFeatureMutation() {
  const refreshCards = useRefreshCards();

  return useMutation({ mutationFn: setCardFeature, onSettled: refreshCards });
}

export function useCreateCardTaskMutation() {
  const refreshCards = useRefreshCards();

  return useMutation({ mutationFn: createCardTask, onSettled: refreshCards });
}

export function useUpdateCardTaskMutation() {
  const refreshCards = useRefreshCards();

  return useMutation({ mutationFn: updateCardTask, onSettled: refreshCards });
}

export function useSetCardTaskAssigneeMutation() {
  const refreshCards = useRefreshCards();

  return useMutation({ mutationFn: setCardTaskAssignee, onSettled: refreshCards });
}

export function useDeleteCardTaskMutation() {
  const refreshCards = useRefreshCards();

  return useMutation({ mutationFn: deleteCardTask, onSettled: refreshCards });
}

export function useCreateCardRelationMutation() {
  const refreshCards = useRefreshCards();

  return useMutation({ mutationFn: createCardRelation, onSettled: refreshCards });
}

export function useDeleteCardRelationMutation() {
  const refreshCards = useRefreshCards();

  return useMutation({ mutationFn: deleteCardRelation, onSettled: refreshCards });
}

function useRefreshEverything() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries();
}

export function useCreateCardStateMutation() {
  const refreshEverything = useRefreshEverything();

  return useMutation({ mutationFn: createCardState, onSettled: refreshEverything });
}

export function useUpdateCardStateMutation() {
  const refreshEverything = useRefreshEverything();

  return useMutation({ mutationFn: updateCardState, onSettled: refreshEverything });
}

export function useDeleteCardStateMutation() {
  const refreshEverything = useRefreshEverything();

  return useMutation({ mutationFn: deleteCardState, onSettled: refreshEverything });
}
