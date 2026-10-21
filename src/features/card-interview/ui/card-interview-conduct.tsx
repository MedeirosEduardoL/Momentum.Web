import { describeApiFailure } from "@/shared/api/describe-api-failure";
import { Button } from "@/shared/ui/button";
import { LoadingState } from "@/shared/ui/loading-state";
import { Notice } from "@/shared/ui/notice";
import type { RoundRequestState } from "../model/hooks/use-card-interview-round";
import { areRoundAttemptsExhausted } from "../model/lib/card-interview-failure";
import { shouldRequestProposal } from "../model/lib/card-interview-progress";
import type {
  CardInterview,
  CardInterviewAnswer,
  CardInterviewStep,
} from "../model/types/card-interview.types";
import { CardInterviewAnswersForm } from "./card-interview-answers-form";

type RoundGenerationProps = {
  onCancel: () => void;
};

function RoundGeneration({ onCancel }: RoundGenerationProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-surface-raised p-3">
      <LoadingState label="A IA está escrevendo a rodada…" />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-ink-subtle">Cancelar não devolve o custo da tentativa.</span>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

type CardInterviewConductProps = {
  interview: CardInterview;
  step: CardInterviewStep;
  roundRequest: RoundRequestState;
  onFinished: () => void;
};

export function CardInterviewConduct({
  interview,
  step,
  roundRequest: round,
  onFinished,
}: CardInterviewConductProps) {
  async function askRound(answers: CardInterviewAnswer[]) {
    const asked = await round.ask(interview.id, answers);

    if (asked && shouldRequestProposal(interview, answers, asked)) {
      onFinished();
    }
  }
  const canAsk =
    step.kind === "ask" && !round.isAsking && !areRoundAttemptsExhausted(round.failure);

  return (
    <div className="flex flex-col gap-4">
      {step.kind === "answer" && (
        <CardInterviewAnswersForm
          key={step.round.number}
          round={step.round}
          isAsking={round.isAsking}
          onAnswer={askRound}
        />
      )}
      {step.kind === "round-limit" && (
        <Notice>
          A entrevista chegou ao limite de 10 rodadas. Peça a proposta de mudança logo abaixo.
        </Notice>
      )}
      {round.isAsking && <RoundGeneration onCancel={round.cancel} />}
      {round.failure !== null && <Notice tone="danger">{describeApiFailure(round.failure)}</Notice>}
      {canAsk && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => askRound([])}>
            {interview.rounds.length === 0 ? "Pedir a primeira rodada" : "Pedir a próxima rodada"}
          </Button>
          <span className="text-sm text-ink-subtle">Cada rodada é uma chamada paga à IA.</span>
        </div>
      )}
    </div>
  );
}
