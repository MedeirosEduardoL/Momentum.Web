import type { CardListFilters } from "../types/card.types";

const FIRST_PAGE = 1;

export type CardListRefinement = Partial<Omit<CardListFilters, "page">>;

export function refineCardList(
  filters: CardListFilters,
  refinement: CardListRefinement
): CardListFilters {
  return { ...filters, ...refinement, page: FIRST_PAGE };
}
