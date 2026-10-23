import type { BoardGroupLevel, BoardView } from "@/features/board";
import { fromAssigneeSearch, toAssigneeSearch } from "@/shared/lib/assignee-search";
import { toCardListSearch, type CardListSearch } from "./card-list-search";
import { readId } from "./search-id";

const BY_ASSIGNEE = "responsavel";
const AS_LIST = "lista";

export type BoardSearch = CardListSearch & {
  board?: string;
  agrupar?: typeof BY_ASSIGNEE;
  nivel?: BoardGroupLevel;
  exibir?: typeof AS_LIST;
};

const GROUP_LEVELS: Record<BoardGroupLevel, true> = { features: true, epics: true };

function isGroupLevel(value: unknown): value is BoardGroupLevel {
  return typeof value === "string" && Object.hasOwn(GROUP_LEVELS, value);
}

export function toBoardSearch(search: Record<string, unknown>): BoardSearch {
  return {
    ...toCardListSearch(search),
    board: readId(search.board),
    agrupar: search.agrupar === BY_ASSIGNEE ? BY_ASSIGNEE : undefined,
    nivel: isGroupLevel(search.nivel) ? search.nivel : undefined,
    exibir: search.exibir === AS_LIST ? AS_LIST : undefined,
  };
}

export function toBoardView(search: BoardSearch): BoardView {
  return {
    boardId: search.board,
    level: search.nivel ?? "cards",
    isList: search.exibir === AS_LIST,
    ...fromAssigneeSearch(search.responsavel),
    isGroupedByAssignee: search.agrupar === BY_ASSIGNEE,
  };
}

export function fromBoardView(view: BoardView): BoardSearch {
  return {
    board: view.boardId,
    nivel: view.level === "cards" ? undefined : view.level,
    exibir: view.isList ? AS_LIST : undefined,
    responsavel: toAssigneeSearch(view),
    agrupar: view.isGroupedByAssignee ? BY_ASSIGNEE : undefined,
  };
}
