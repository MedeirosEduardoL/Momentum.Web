import { Layers, List, SquareKanban } from "lucide-react";
import type { ReactNode } from "react";
import { toAssigneeOptions } from "@/features/card";
import { useListProjectMembers } from "@/features/project";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { SelectField } from "@/shared/ui/select-field";
import {
  ANY_ASSIGNEE_OPTION,
  BOARD_GROUPING_OPTIONS,
  BOARD_LEVEL_OPTIONS,
  fromAssigneeChoice,
  toAssigneeChoice,
  toBoardOptions,
  UNASSIGNED_OPTION,
} from "../model/lib/board-options";
import type { Board, BoardLevel, BoardView } from "../model/types/board.types";

type BoardToolbarProps = {
  boards: Board[];
  board: Board;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  actions: ReactNode;
};

const LEVEL_MARKS: Record<BoardLevel, string> = {
  cards: "text-accent-text",
  features: "text-type-feature",
  epics: "text-type-epic",
};

export function BoardToolbar({ boards, board, view, onViewChange, actions }: BoardToolbarProps) {
  const team = useListProjectMembers(board.projectId);
  const showsCards = view.level === "cards";

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line pb-3">
      <SelectField
        isLabelInline
        label="Board"
        options={toBoardOptions(boards)}
        value={board.id}
        onValueChange={boardId => onViewChange({ ...view, boardId })}
      />
      <div className="flex items-center gap-2">
        <Layers aria-hidden className={cn("size-4 shrink-0", LEVEL_MARKS[view.level])} />
        <SelectField
          isLabelInline
          label="Visão"
          options={BOARD_LEVEL_OPTIONS}
          value={view.level}
          onValueChange={level => onViewChange({ ...view, level })}
        />
      </div>
      {showsCards && (
        <SelectField
          isLabelInline
          label="Responsável"
          options={[ANY_ASSIGNEE_OPTION, UNASSIGNED_OPTION, ...toAssigneeOptions(team.data ?? [])]}
          value={toAssigneeChoice(view)}
          disabled={team.isPending}
          error={team.isError ? "Não foi possível carregar o time." : undefined}
          onValueChange={choice => onViewChange({ ...view, ...fromAssigneeChoice(choice) })}
        />
      )}
      {showsCards && !view.isList && (
        <SelectField
          isLabelInline
          label="Agrupar por"
          options={BOARD_GROUPING_OPTIONS}
          value={view.isGroupedByAssignee ? "assignee" : "none"}
          onValueChange={grouping =>
            onViewChange({ ...view, isGroupedByAssignee: grouping === "assignee" })
          }
        />
      )}
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange({ ...view, isList: !view.isList })}
        >
          {view.isList ? <SquareKanban aria-hidden /> : <List aria-hidden />}
          {view.isList ? "Ver como board" : "Ver como lista"}
        </Button>
        {board.visibility === "members" && <Badge>Acesso restrito</Badge>}
        {actions}
      </div>
    </div>
  );
}
