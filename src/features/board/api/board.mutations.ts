import { useMutation, useQueryClient } from "@tanstack/react-query";
import { boardKeys } from "./board-api-keys";
import type { BoardVisibility } from "../model/types/board.types";
import {
  addBoardMember,
  createBoard,
  deleteBoard,
  removeBoardMember,
  setBoardVisibility,
  updateBoard,
} from "./board.service";

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

export function useSetBoardVisibilityMutation(boardId: string) {
  const { refreshBoards, refreshEverything } = useBoardRefresh();

  return useMutation({
    mutationFn: (visibility: BoardVisibility) => setBoardVisibility(boardId, visibility),
    onSuccess: refreshBoards,
    onError: refreshEverything,
  });
}

export function useAddBoardMemberMutation() {
  const { refreshBoards, refreshEverything } = useBoardRefresh();

  return useMutation({
    mutationFn: addBoardMember,
    onSuccess: refreshBoards,
    onError: refreshEverything,
  });
}

export function useRemoveBoardMemberMutation() {
  const { refreshBoards, refreshEverything } = useBoardRefresh();

  return useMutation({
    mutationFn: removeBoardMember,
    onSuccess: refreshBoards,
    onError: refreshEverything,
  });
}
