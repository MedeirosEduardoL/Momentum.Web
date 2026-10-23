import type { EpicSummary } from "@/features/feature";
import type { SelectOption } from "@/shared/ui/select-field";
import type { Board, BoardAssigneeView, BoardLevel } from "../types/board.types";

export type BoardGrouping = "none" | "assignee";

export const ANY_ASSIGNEE = "";
export const UNASSIGNED = "unassigned";

export const ANY_ASSIGNEE_OPTION: SelectOption = { value: ANY_ASSIGNEE, label: "Todos" };
export const UNASSIGNED_OPTION: SelectOption = { value: UNASSIGNED, label: "Sem responsável" };

export const BOARD_GROUPING_OPTIONS: SelectOption<BoardGrouping>[] = [
  { value: "none", label: "Sem agrupar" },
  { value: "assignee", label: "Responsável" },
];

export const BOARD_LEVEL_OPTIONS: SelectOption<BoardLevel>[] = [
  { value: "cards", label: "Cards" },
  { value: "features", label: "Features" },
  { value: "epics", label: "Epics" },
];

export function toBoardOptions(boards: Board[]): SelectOption[] {
  return boards.map(board => ({ value: board.id, label: board.name }));
}

export function toEpicOptions(epics: EpicSummary[]): SelectOption[] {
  return epics.map(epic => ({ value: epic.id, label: epic.title }));
}

export function toAssigneeChoice({ assigneeId, isUnassigned }: BoardAssigneeView) {
  return isUnassigned ? UNASSIGNED : (assigneeId ?? ANY_ASSIGNEE);
}

export function fromAssigneeChoice(choice: string): BoardAssigneeView {
  if (choice === UNASSIGNED) {
    return { assigneeId: undefined, isUnassigned: true };
  }

  return { assigneeId: choice || undefined, isUnassigned: undefined };
}
