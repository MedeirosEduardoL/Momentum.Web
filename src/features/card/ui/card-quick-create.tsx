import { Plus } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Button } from "@/shared/ui/button";
import { SelectField } from "@/shared/ui/select-field";
import { TextField } from "@/shared/ui/text-field";
import { useQuickCreateCard } from "../model/hooks/use-quick-create-card";
import { CARD_TYPE_OPTIONS } from "../model/lib/card-options";
import { CARD_LIMITS } from "../model/schemas/card.schema";
import type { Card, CardStateColumn, QuickCardDefaults } from "../model/types/card.types";

type CardQuickCreateProps = {
  projectId: string;
  defaults: QuickCardDefaults;
  reload: () => Promise<CardStateColumn[] | undefined>;
  onOpenCard: (card: Card) => void;
};

type QuickCreateFormProps = CardQuickCreateProps & {
  onClose: () => void;
};

function QuickCreateForm({ onClose, ...options }: QuickCreateFormProps) {
  const { form, onSubmit, isSaving, defaultsError } = useQuickCreateCard(options);
  const { errors } = form.formState;

  function closeOnEscape(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") {
      onClose();
    }
  }

  return (
    <form
      aria-label="Novo card"
      noValidate
      onSubmit={onSubmit}
      onKeyDown={closeOnEscape}
      className="glass flex flex-col gap-2 rounded-md border border-glass-line p-2"
    >
      <SelectField
        isLabelHidden
        label="Tipo do card novo"
        options={CARD_TYPE_OPTIONS}
        error={errors.cardType?.message}
        {...form.register("cardType")}
      />
      <TextField
        isLabelHidden
        label="Título do card novo"
        placeholder="Título do card"
        autoFocus
        autoComplete="off"
        maxLength={CARD_LIMITS.title}
        error={errors.title?.message}
        {...form.register("title")}
      />
      {defaultsError && (
        <p role="alert" className="text-sm text-danger">
          {defaultsError}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" isLoading={isSaving}>
          Criar card
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function CardQuickCreate(props: CardQuickCreateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasClosed, setHasClosed] = useState(false);

  function close() {
    setIsOpen(false);
    setHasClosed(true);
  }

  if (isOpen) {
    return <QuickCreateForm {...props} onClose={close} />;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      autoFocus={hasClosed}
      className="justify-start"
      onClick={() => setIsOpen(true)}
    >
      <Plus aria-hidden />
      Novo card
    </Button>
  );
}
