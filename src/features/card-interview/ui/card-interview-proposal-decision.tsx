import type { Card } from "@/features/card";
import { Button } from "@/shared/ui/button";
import { CheckboxField } from "@/shared/ui/checkbox-field";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { Notice } from "@/shared/ui/notice";
import { useDecideCardInterviewProposal } from "../model/hooks/use-decide-card-interview-proposal";
import { PROPOSAL_FIELD_LABELS } from "../model/lib/proposal-changes";
import type { CardInterviewProposal } from "../model/types/card-interview.types";
import { CardInterviewProposalChanges } from "./card-interview-proposal-changes";

type CardInterviewProposalDecisionProps = {
  card: Card;
  proposal: CardInterviewProposal;
  onRequestAnother: () => void;
};

export function CardInterviewProposalDecision({
  card,
  proposal,
  onRequestAnother,
}: CardInterviewProposalDecisionProps) {
  const { form, apply, discard, pendingChoice, isDeciding, isOutdated } =
    useDecideCardInterviewProposal(proposal);
  const hasChanges = proposal.changes.length > 0;
  const fieldsError = form.formState.errors.fields?.message;

  return (
    <div className="flex flex-col gap-3">
      <CardInterviewProposalChanges
        card={card}
        changes={proposal.changes}
        renderHeading={change => (
          <CheckboxField
            label={PROPOSAL_FIELD_LABELS[change.field]}
            value={change.field}
            className="font-medium"
            {...form.register("fields")}
          />
        )}
      />
      {fieldsError && (
        <p role="alert" className="text-sm text-danger">
          {fieldsError}
        </p>
      )}
      {isOutdated && (
        <Notice tone="danger">
          O card mudou depois que esta proposta foi gerada, e ela não pode mais ser aplicada. Peça
          outra proposta.
        </Notice>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {hasChanges && !isOutdated ? (
          <>
            <Button
              isLoading={pendingChoice === "close"}
              disabled={isDeciding}
              onClick={() => apply(true)}
            >
              Aplicar e encerrar
            </Button>
            <Button
              variant="secondary"
              isLoading={pendingChoice === "continue"}
              disabled={isDeciding}
              onClick={() => apply(false)}
            >
              Aplicar e continuar
            </Button>
          </>
        ) : (
          <Button disabled={isDeciding} onClick={onRequestAnother}>
            Pedir outra proposta
          </Button>
        )}
        <ConfirmButton
          title="Descartar a proposta?"
          description="A proposta deixa de poder ser aplicada, e o card continua como está."
          confirmLabel="Descartar proposta"
          disabled={isDeciding}
          onConfirm={discard}
        >
          Descartar
        </ConfirmButton>
      </div>
    </div>
  );
}
