import type { Board } from "../types/board.types";

export function selectBoard(boards: Board[], boardId?: string): Board | null {
  return boards.find(board => board.id === boardId) ?? boards.at(0) ?? null;
}

export function isMissingBoard(boards: Board[], boardId?: string) {
  return boardId !== undefined && !boards.some(board => board.id === boardId);
}
