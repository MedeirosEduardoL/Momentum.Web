import { Button } from "@/shared/ui/button";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { SelectField } from "@/shared/ui/select-field";
import { useCardActions } from "../model/hooks/use-card-actions";
import { useCompletionConfirmation } from "../model/hooks/use-completion-confirmation";
import { describeCardDates, describeCardProgress } from "../model/lib/card-description";
import {
  CARD_PRIORITY_OPTIONS,
  NO_ASSIGNEE_OPTION,
  toAssigneeOptions,
  toStateOptions,
} from "../model/lib/card-options";
import type { Card, CardOptions } from "../model/types/card.types";
import { CardCompletionDialog } from "./card-completion-dialog";

type CardPropertiesProps = {
  card: Card;
  options: CardOptions;
};

export function CardProperties({ card, options }: CardPropertiesProps) {
  const actions = useCardActions(card);
  const completion = useCompletionConfirmation(options.states);

  return (
    <div className="panel flex flex-col gap-4 p-4">
      <CardCompletionDialog completion={completion} />
      <div className="flex flex-col gap-3">
        <SelectField
          label="Estado"
          options={toStateOptions(options.states)}
          value={actions.selected.cardStateId}
          disabled={actions.isBusy}
          onValueChange={cardStateId =>
            completion.request(card, cardStateId, () => actions.changeState(cardStateId))
          }
        />
        <SelectField
          label="Prioridade"
          options={CARD_PRIORITY_OPTIONS}
          value={actions.selected.priority}
          disabled={actions.isBusy}
          onValueChange={actions.changePriority}
        />
        <SelectField
          label="Responsável"
          options={[NO_ASSIGNEE_OPTION, ...toAssigneeOptions(options.team)]}
          value={actions.selected.assigneeId}
          disabled={actions.isBusy}
          onValueChange={actions.changeAssignee}
        />
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-3">
        <div className="flex flex-col text-sm">
          <span className="text-ink-muted">{describeCardProgress(card)}</span>
          <span className="text-ink-subtle">{describeCardDates(card)}</span>
        </div>
        {card.isArchived ? (
          <Button variant="ghost" size="sm" disabled={actions.isBusy} onClick={actions.unarchive}>
            Desarquivar
          </Button>
        ) : (
          <ConfirmButton
            title="Arquivar o card?"
            description="O card sai da lista e dos boards. Dá para desarquivar nesta mesma tela."
            confirmLabel="Arquivar"
            disabled={actions.isBusy}
            onConfirm={async () => actions.archive()}
          >
            Arquivar
          </ConfirmButton>
        )}
      </div>
    </div>
  );
}
