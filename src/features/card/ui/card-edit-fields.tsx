import { Button } from "@/shared/ui/button";
import { useEditCard } from "../model/hooks/use-edit-card";
import type { Card } from "../model/types/card.types";
import { ChangedMeanwhileNotice } from "./changed-meanwhile-notice";
import { CardFormFields } from "./card-form-fields";

type CardEditFieldsProps = {
  card: Card;
  onSaved: () => void;
  onCancel?: () => void;
};

export function CardEditFields({ card, onSaved, onCancel }: CardEditFieldsProps) {
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
      <div className="flex gap-2">
        <Button type="submit" isLoading={isSaving}>
          Salvar card
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
