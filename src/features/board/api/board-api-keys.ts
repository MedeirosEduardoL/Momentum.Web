import type { BoardColumnsQuery } from "../model/types/board.types";

export const boardKeys = {
  all: ["board"] as const,
  lists: () => [...boardKeys.all, "list"] as const,
  list: (projectId: string) => [...boardKeys.lists(), projectId] as const,
  allColumns: () => [...boardKeys.all, "columns"] as const,
  members: (boardId: string) => [...boardKeys.all, "members", boardId] as const,
  columns: (query: BoardColumnsQuery) => [...boardKeys.allColumns(), query] as const,
};
