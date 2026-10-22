import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CardDialog, CardExtensionsProvider, type RelatedCard } from "@/features/card";
import { cardExtensions, cardPanels } from "./card-panels";

type OpenedCardDialogProps = {
  cardId: string;
  onClose: () => void;
  renderRelatedCardLink: (card: RelatedCard) => ReactNode;
};

export function OpenedCardDialog({
  cardId,
  onClose,
  renderRelatedCardLink,
}: OpenedCardDialogProps) {
  const navigate = useNavigate();

  return (
    <CardExtensionsProvider value={cardExtensions}>
      <CardDialog
        key={cardId}
        cardId={cardId}
        onClose={onClose}
        onOpenPage={card => navigate({ to: "/cards/$cardId", params: { cardId: card.id } })}
        renderRelatedCardLink={renderRelatedCardLink}
        {...cardPanels}
      />
    </CardExtensionsProvider>
  );
}
