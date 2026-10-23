import type { ReactNode } from "react";
import { formatCount } from "@/shared/lib/format-count";
import { EPIC_STATE_LABELS } from "../model/lib/group-description";
import type { EpicSummary } from "../model/types/feature.types";
import { GroupBoard } from "./group-board";
import { GroupTile } from "./group-tile";

type EpicBoardProps = {
  epics: EpicSummary[];
  renderEpicLink: (epic: EpicSummary) => ReactNode;
};

export function EpicBoard({ epics, renderEpicLink }: EpicBoardProps) {
  return (
    <GroupBoard
      label="Board de epics"
      groups={epics}
      stateLabels={EPIC_STATE_LABELS}
      emptyText="Nenhum epic aqui."
      renderTile={epic => (
        <GroupTile
          key={epic.id}
          kind="epic"
          titleLink={renderEpicLink(epic)}
          progressLabel={`Progresso de ${epic.title}`}
          progress={epic.progress}
          details={[formatCount(epic.featureCount, "feature"), formatCount(epic.cardCount, "card")]}
        />
      )}
    />
  );
}
