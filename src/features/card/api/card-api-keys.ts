import type { CardListQuery } from "../model/types/card.types";

export const cardKeys = {
  all: ["card"] as const,
  list: (query: CardListQuery) => [...cardKeys.all, "list", query] as const,
  byId: (cardId: string) => [...cardKeys.all, "detail", cardId] as const,
  states: (projectId: string) => [...cardKeys.all, "states", projectId] as const,
  tasks: (cardId: string) => [...cardKeys.all, "tasks", cardId] as const,
  relations: (cardId: string) => [...cardKeys.all, "relations", cardId] as const,
};
