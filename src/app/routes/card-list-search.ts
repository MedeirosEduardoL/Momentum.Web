import type { CardListFilters, CardType } from "@/features/card";
import { fromAssigneeSearch, toAssigneeSearch } from "@/shared/lib/assignee-search";
import { readAssigneeSearch, readId } from "./search-id";

export type CardListSearch = {
  tipo?: CardType;
  estado?: string;
  responsavel?: string;
  feature?: string;
  arquivados?: true;
  pagina?: number;
};

const FIRST_PAGE = 1;

const KNOWN_TYPES: Record<CardType, true> = {
  user_story: true,
  spike: true,
  issue: true,
  tech_debt: true,
};

function isCardType(value: unknown): value is CardType {
  return typeof value === "string" && Object.hasOwn(KNOWN_TYPES, value);
}

function readLaterPage(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > FIRST_PAGE
    ? value
    : undefined;
}

export function toCardListSearch(search: Record<string, unknown>): CardListSearch {
  return {
    tipo: isCardType(search.tipo) ? search.tipo : undefined,
    estado: readId(search.estado),
    responsavel: readAssigneeSearch(search.responsavel),
    feature: readId(search.feature),
    arquivados: search.arquivados === true || undefined,
    pagina: readLaterPage(search.pagina),
  };
}

export function toCardListFilters(search: CardListSearch): CardListFilters {
  return {
    type: search.tipo,
    stateId: search.estado,
    ...fromAssigneeSearch(search.responsavel),
    featureId: search.feature,
    includesArchived: search.arquivados ?? false,
    page: search.pagina ?? FIRST_PAGE,
  };
}

export function fromCardListFilters(filters: CardListFilters): CardListSearch {
  return {
    tipo: filters.type,
    estado: filters.stateId,
    responsavel: toAssigneeSearch(filters),
    feature: filters.featureId,
    arquivados: filters.includesArchived || undefined,
    pagina: readLaterPage(filters.page),
  };
}
