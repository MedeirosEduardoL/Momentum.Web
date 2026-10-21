import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useCreateCardMutation } from "../../api/card.mutations";
import { toQuickNewCard } from "../lib/card-form-values";
import { containsCard } from "../lib/card-state-columns";
import { quickCardSchema, type QuickCardFormValues } from "../schemas/card.schema";
import type { Card, CardStateColumn, QuickCardDefaults } from "../types/card.types";

type QuickCreateCardOptions = {
  projectId: string;
  defaults: QuickCardDefaults;
  reload: () => Promise<CardStateColumn[] | undefined>;
  onOpenCard: (card: Card) => void;
};

const quickCardResolver = zodResolver(quickCardSchema);

const DEFAULTS_ERROR_FIELD = "root.defaults";

const DEFAULTS_ERROR_FIELDS = {
  cardStateId: DEFAULTS_ERROR_FIELD,
  priority: DEFAULTS_ERROR_FIELD,
  assigneeId: DEFAULTS_ERROR_FIELD,
  featureId: DEFAULTS_ERROR_FIELD,
} as const;

function announceCreated(
  card: Card,
  columns: CardStateColumn[] | undefined,
  onOpenCard: (card: Card) => void
) {
  const options = { action: { label: "Abrir o card", onClick: () => onOpenCard(card) } };

  if (columns && !containsCard(columns, card.id)) {
    toast.warning(
      `O card ${card.identifier} foi criado, mas não casa com o filtro deste board.`,
      options
    );
    return;
  }

  toast.success(`O card ${card.identifier} foi criado.`, options);
}

export function useQuickCreateCard({
  projectId,
  defaults,
  reload,
  onOpenCard,
}: QuickCreateCardOptions) {
  const createCard = useCreateCardMutation();
  const form = useForm<QuickCardFormValues>({
    resolver: quickCardResolver,
    defaultValues: { cardType: defaults.cardType, title: "" },
  });

  const onSubmit = form.handleSubmit(async values => {
    try {
      const card = await createCard.mutateAsync(toQuickNewCard(projectId, defaults, values));
      form.reset({ cardType: values.cardType, title: "" });
      form.setFocus("title");
      announceCreated(card, await reload(), onOpenCard);
    } catch (error) {
      applyApiErrors(form, error, DEFAULTS_ERROR_FIELDS);
    }
  });

  return {
    form,
    onSubmit,
    isSaving: createCard.isPending,
    defaultsError: form.formState.errors.root?.defaults?.message,
  };
}
