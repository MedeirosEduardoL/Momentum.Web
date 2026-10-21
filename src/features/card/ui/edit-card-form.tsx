import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Screen } from "@/shared/ui/screen";
import { useEditCard } from "../model/hooks/use-edit-card";
import type { Card } from "../model/types/card.types";
import { CardContent } from "./card-content";
import { ChangedMeanwhileNotice } from "./changed-meanwhile-notice";
import { CardFormFields } from "./card-form-fields";
import { CardIdentifier } from "./card-identifier";

type EditCardFormProps = {
  cardId: string;
  backLink: ReactNode;
  onSaved: () => void;
};

type LoadedCardFieldsProps = {
  card: Card;
  onSaved: () => void;
};

function LoadedCardFields({ card, onSaved }: LoadedCardFieldsProps) {
  const { form, onSubmit, isSaving, hasChangedMeanwhile, loadCurrentVersion } = useEditCard({
    card,
    onSaved,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {hasChangedMeanwhile && (
        <ChangedMeanwhileNotice subject="O card" onLoadCurrentVersion={loadCurrentVersion} />
      )}
      <CardFormFields form={form} cardType={card.type} />
      <div>
        <Button type="submit" isLoading={isSaving}>
          Salvar card
        </Button>
      </div>
    </form>
  );
}

export function EditCardForm({ cardId, backLink, onSaved }: EditCardFormProps) {
  return (
    <CardContent cardId={cardId}>
      {card => (
        <Screen backLink={backLink} eyebrow={<CardIdentifier card={card} />} title="Editar card">
          <LoadedCardFields card={card} onSaved={onSaved} />
        </Screen>
      )}
    </CardContent>
  );
}
