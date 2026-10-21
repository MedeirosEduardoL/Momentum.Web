import type { BoardColumnsQuery } from "../model/types/board.types";

export const boardKeys = {
  all: ["board"] as const,
  lists: () => [...boardKeys.all, "list"] as const,
  list: (projectId: string) => [...boardKeys.lists(), projectId] as const,
  columns: (query: BoardColumnsQuery) => [...boardKeys.all, "columns", query] as const,
};
