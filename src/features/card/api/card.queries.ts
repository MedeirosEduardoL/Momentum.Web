import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { CardListQuery } from "../model/types/card.types";
import { cardKeys } from "./card-api-keys";
import { listCardRelations } from "./card-relation.service";
import { listCardTasks } from "./card-task.service";
import { getCard, listCards, listCardStates } from "./card.service";

export function useListCards(query: CardListQuery) {
  return useQuery({
    queryKey: cardKeys.list(query),
    queryFn: () => listCards(query),
    placeholderData: keepPreviousData,
  });
}

export function useGetCard(cardId: string) {
  return useQuery({
    queryKey: cardKeys.byId(cardId),
    queryFn: () => getCard(cardId),
  });
}

export function useListCardStates(projectId: string) {
  return useQuery({
    queryKey: cardKeys.states(projectId),
    queryFn: () => listCardStates(projectId),
  });
}

export function useListCardTasks(cardId: string) {
  return useQuery({
    queryKey: cardKeys.tasks(cardId),
    queryFn: () => listCardTasks(cardId),
  });
}

export function useListCardRelations(cardId: string) {
  return useQuery({
    queryKey: cardKeys.relations(cardId),
    queryFn: () => listCardRelations(cardId),
  });
}
