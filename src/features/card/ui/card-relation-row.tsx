import type { ReactNode } from "react";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { describeRelatedCard } from "../model/lib/card-description";
import { CARD_RELATION_LABELS } from "../model/lib/card-options";
import type { CardRelation } from "../model/types/card.types";

type CardRelationRowProps = {
  relation: CardRelation;
  titleLink: ReactNode;
  onRemove: (relation: CardRelation) => Promise<void>;
};

export function CardRelationRow({ relation, titleLink, onRemove }: CardRelationRowProps) {
  const { card } = relation;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="w-28 shrink-0 text-sm text-ink-muted">
        {CARD_RELATION_LABELS[relation.relation]}
      </span>
      <span className="w-20 shrink-0 font-mono text-sm text-ink-subtle">{card.identifier}</span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{titleLink}</span>
        <span className="truncate text-sm text-ink-muted">{describeRelatedCard(card)}</span>
      </div>
      <ConfirmButton
        title={`Desfazer a relação com ${card.identifier}?`}
        description="Os dois cards continuam como estão; só a relação entre eles deixa de existir."
        confirmLabel="Desfazer relação"
        onConfirm={() => onRemove(relation)}
      >
        Desfazer
      </ConfirmButton>
    </li>
  );
}
