import { useQuery } from "@tanstack/react-query";
import type { BoardColumnsQuery } from "../model/types/board.types";
import { boardKeys } from "./board-api-keys";
import { listBoardColumns, listBoards } from "./board.service";

const DERIVED_FROM_CARDS_STALE_TIME = 0;

export function useListBoards(projectId: string) {
  return useQuery({
    queryKey: boardKeys.list(projectId),
    queryFn: () => listBoards(projectId),
  });
}

export function useListBoardColumns(query: BoardColumnsQuery) {
  return useQuery({
    queryKey: boardKeys.columns(query),
    queryFn: () => listBoardColumns(query),
    staleTime: DERIVED_FROM_CARDS_STALE_TIME,
  });
}
