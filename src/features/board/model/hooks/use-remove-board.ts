import { toast } from "sonner";
import { toastApiError } from "@/shared/api/toast-api-error";
import { useDeleteBoardMutation } from "../../api/board.mutations";
import type { Board } from "../types/board.types";

export function useRemoveBoard(onRemoved: () => void) {
  const removal = useDeleteBoardMutation();

  return async function removeBoard(board: Board) {
    try {
      await removal.mutateAsync(board.id);
      toast.success(`O board ${board.name} foi excluído.`);
      onRemoved();
    } catch (error) {
      toastApiError(error);
    }
  };
}
