import type { ReactNode } from "react";
import { BoardColumn } from "@/shared/ui/board-column";
import { GROUP_STATE_TONES, toGroupColumns } from "../model/lib/group-board";
import type { FeatureState } from "../model/types/feature.types";

type GroupBoardProps<TGroup extends { id: string; state: FeatureState }> = {
  label: string;
  groups: TGroup[];
  stateLabels: Record<FeatureState, string>;
  emptyText: string;
  renderTile: (group: TGroup) => ReactNode;
};

export function GroupBoard<TGroup extends { id: string; state: FeatureState }>({
  label,
  groups,
  stateLabels,
  emptyText,
  renderTile,
}: GroupBoardProps<TGroup>) {
  return (
    <div role="group" aria-label={label} className="flex gap-3 overflow-x-auto pb-2">
      {toGroupColumns(groups).map(column => (
        <BoardColumn
          key={column.state}
          title={stateLabels[column.state]}
          count={column.groups.length}
          tone={GROUP_STATE_TONES[column.state]}
          emptyText={emptyText}
        >
          <ul className="flex flex-col gap-2">{column.groups.map(renderTile)}</ul>
        </BoardColumn>
      ))}
    </div>
  );
}
