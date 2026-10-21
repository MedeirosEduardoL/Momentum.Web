import { useMutation, useQueryClient } from "@tanstack/react-query";
import { boardKeys } from "./board-api-keys";
import { createBoard, deleteBoard, updateBoard } from "./board.service";

function useBoardRefresh() {
  const queryClient = useQueryClient();

  return {
    refreshBoardLists: () => queryClient.invalidateQueries({ queryKey: boardKeys.lists() }),
    refreshBoards: () => queryClient.invalidateQueries({ queryKey: boardKeys.all }),
    refreshEverything: () => queryClient.invalidateQueries(),
  };
}

export function useCreateBoardMutation() {
  const { refreshBoardLists, refreshEverything } = useBoardRefresh();

  return useMutation({
    mutationFn: createBoard,
    onSuccess: refreshBoardLists,
    onError: refreshEverything,
  });
}

export function useUpdateBoardMutation() {
  const { refreshBoards, refreshEverything } = useBoardRefresh();

  return useMutation({
    mutationFn: updateBoard,
    onSuccess: refreshBoards,
    onError: refreshEverything,
  });
}

export function useDeleteBoardMutation() {
  const { refreshBoardLists, refreshEverything } = useBoardRefresh();

  return useMutation({
    mutationFn: deleteBoard,
    onSuccess: refreshBoardLists,
    onError: refreshEverything,
  });
}
