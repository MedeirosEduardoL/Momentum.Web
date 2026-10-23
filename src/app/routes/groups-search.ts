import type { BoardSearch } from "./board-search";

type FormerView = "epics" | "hierarquia";

export type GroupsSearch = {
  visao?: FormerView;
};

const FORMER_VIEWS: Record<FormerView, true> = { epics: true, hierarquia: true };

function isFormerView(value: unknown): value is FormerView {
  return typeof value === "string" && Object.hasOwn(FORMER_VIEWS, value);
}

export function toGroupsSearch(search: Record<string, unknown>): GroupsSearch {
  return { visao: isFormerView(search.visao) ? search.visao : undefined };
}

export function toBoardGroupsSearch({ visao }: GroupsSearch): BoardSearch {
  return {
    nivel: visao === "epics" ? "epics" : "features",
    exibir: visao === "hierarquia" ? "lista" : undefined,
  };
}
