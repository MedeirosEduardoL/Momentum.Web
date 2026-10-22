import type { ReactNode } from "react";
import { Screen } from "@/shared/ui/screen";
import { CardContent } from "./card-content";
import { CardEditFields } from "./card-edit-fields";
import { CardIdentifier } from "./card-identifier";

type EditCardFormProps = {
  cardId: string;
  backLink: ReactNode;
  onSaved: () => void;
};

export function EditCardForm({ cardId, backLink, onSaved }: EditCardFormProps) {
  return (
    <CardContent cardId={cardId}>
      {card => (
        <Screen backLink={backLink} eyebrow={<CardIdentifier card={card} />} title="Editar card">
          <CardEditFields card={card} onSaved={onSaved} />
        </Screen>
      )}
    </CardContent>
  );
}
