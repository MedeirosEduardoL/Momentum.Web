import type { ReactNode } from "react";
import { toAssigneeOptions } from "@/features/card";
import { useListProjectMembers } from "@/features/project";
import { Badge } from "@/shared/ui/badge";
import { SelectField } from "@/shared/ui/select-field";
import {
  ANY_ASSIGNEE_OPTION,
  BOARD_GROUPING_OPTIONS,
  fromAssigneeChoice,
  toAssigneeChoice,
  toBoardOptions,
  UNASSIGNED_OPTION,
} from "../model/lib/board-options";
import type { Board, BoardView } from "../model/types/board.types";

type BoardToolbarProps = {
  boards: Board[];
  board: Board;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  actions: ReactNode;
};

export function BoardToolbar({ boards, board, view, onViewChange, actions }: BoardToolbarProps) {
  const team = useListProjectMembers(board.projectId);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line pb-3">
      <SelectField
        isLabelInline
        label="Board"
        options={toBoardOptions(boards)}
        value={board.id}
        onValueChange={boardId => onViewChange({ ...view, boardId })}
      />
      <SelectField
        isLabelInline
        label="Responsável"
        options={[ANY_ASSIGNEE_OPTION, UNASSIGNED_OPTION, ...toAssigneeOptions(team.data ?? [])]}
        value={toAssigneeChoice(view)}
        disabled={team.isPending}
        error={team.isError ? "Não foi possível carregar o time." : undefined}
        onValueChange={choice => onViewChange({ ...view, ...fromAssigneeChoice(choice) })}
      />
      <SelectField
        isLabelInline
        label="Agrupar por"
        options={BOARD_GROUPING_OPTIONS}
        value={view.isGroupedByAssignee ? "assignee" : "none"}
        onValueChange={grouping =>
          onViewChange({ ...view, isGroupedByAssignee: grouping === "assignee" })
        }
      />
      <div className="ml-auto flex items-center gap-2">
        {board.visibility === "members" && <Badge>Acesso restrito</Badge>}
        {actions}
      </div>
    </div>
  );
}
