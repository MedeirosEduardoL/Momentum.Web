import type { BoardView } from "@/features/board";
import { fromAssigneeSearch, toAssigneeSearch } from "@/shared/lib/assignee-search";
import { readAssigneeSearch, readId } from "./search-id";

const BY_ASSIGNEE = "responsavel";

export type BoardSearch = {
  board?: string;
  responsavel?: string;
  agrupar?: typeof BY_ASSIGNEE;
  card?: string;
};

export function toBoardSearch(search: Record<string, unknown>): BoardSearch {
  return {
    board: readId(search.board),
    responsavel: readAssigneeSearch(search.responsavel),
    agrupar: search.agrupar === BY_ASSIGNEE ? BY_ASSIGNEE : undefined,
    card: readId(search.card),
  };
}

export function toBoardView(search: BoardSearch): BoardView {
  return {
    boardId: search.board,
    ...fromAssigneeSearch(search.responsavel),
    isGroupedByAssignee: search.agrupar === BY_ASSIGNEE,
  };
}

export function fromBoardView(view: BoardView): BoardSearch {
  return {
    board: view.boardId,
    responsavel: toAssigneeSearch(view),
    agrupar: view.isGroupedByAssignee ? BY_ASSIGNEE : undefined,
  };
}
