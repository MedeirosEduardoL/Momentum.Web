import { ActionMenu } from "@/shared/ui/action-menu";
import { CARD_TASK_KINDS, CARD_TASK_KIND_LABELS } from "../model/lib/card-options";
import type { CardSummary, CardTaskKind } from "../model/types/card.types";
import { CardSubitemKindIcon } from "./card-subitem-kind-icon";

type CardTileActionsProps = {
  card: Pick<CardSummary, "identifier">;
  onAddSubitem: (kind: CardTaskKind) => void;
};

export function CardTileActions({ card, onAddSubitem }: CardTileActionsProps) {
  return (
    <ActionMenu
      label={`Ações de ${card.identifier}`}
      items={CARD_TASK_KINDS.map(kind => ({
        label: `Adicionar ${CARD_TASK_KIND_LABELS[kind].toLowerCase()}`,
        icon: <CardSubitemKindIcon kind={kind} />,
        onSelect: () => onAddSubitem(kind),
      }))}
    />
  );
}
