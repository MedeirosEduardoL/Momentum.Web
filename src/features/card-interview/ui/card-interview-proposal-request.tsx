import { Button } from "@/shared/ui/button";
import { LoadingState } from "@/shared/ui/loading-state";
import { hasAnsweredRound } from "../model/lib/card-interview-progress";
import type { CardInterview } from "../model/types/card-interview.types";

type CardInterviewProposalRequestProps = {
  interview: CardInterview;
  onRequest: () => void;
};

export function CardInterviewProposalRequest({
  interview,
  onRequest,
}: CardInterviewProposalRequestProps) {
  if (!hasAnsweredRound(interview)) {
    return (
      <p className="text-sm text-ink-subtle">
        Responda a pelo menos uma rodada para pedir a proposta.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" onClick={onRequest}>
        Pedir proposta de mudança
      </Button>
      <span className="text-sm text-ink-subtle">
        A IA reescreve os campos do card a partir das respostas. Nada muda sem o seu aceite.
      </span>
    </div>
  );
}

export function CardInterviewProposalWait() {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-surface-raised p-3">
      <LoadingState label="A IA está escrevendo a proposta…" />
      <p className="text-center text-sm text-ink-subtle">
        Pode levar mais de um minuto. Não feche nem recarregue a tela.
      </p>
    </div>
  );
}
