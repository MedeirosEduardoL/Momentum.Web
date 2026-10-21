import type { Card } from "@/features/card";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { Notice } from "@/shared/ui/notice";
import { QueryContent } from "@/shared/ui/query-content";
import { useGetCardInterview } from "../api/card-interview.queries";
import type { RoundRequestState } from "../model/hooks/use-card-interview-round";
import { useCloseCardInterview } from "../model/hooks/use-close-card-interview";
import { useRequestCardInterviewProposal } from "../model/hooks/use-request-card-interview-proposal";
import {
  canCloseInterview,
  canConductInterview,
  explainConductRestriction,
} from "../model/lib/card-interview-access";
import { listReadableRounds, nextInterviewStep } from "../model/lib/card-interview-progress";
import type { CardInterview, CardInterviewAccess } from "../model/types/card-interview.types";
import { CardInterviewConduct } from "./card-interview-conduct";
import { CardInterviewProposals } from "./card-interview-proposals";
import { CardInterviewRoundView } from "./card-interview-round-view";

type CardInterviewConversationProps = {
  card: Card;
  interview: CardInterview;
  access: CardInterviewAccess;
  roundRequest: RoundRequestState;
};

function CardInterviewConversation({
  card,
  interview,
  access,
  roundRequest,
}: CardInterviewConversationProps) {
  const closeInterview = useCloseCardInterview();
  const proposalRequest = useRequestCardInterviewProposal(interview.id);
  const canConduct = canConductInterview(access, interview);
  const conductRestriction = explainConductRestriction(access, interview);
  const step = nextInterviewStep(interview);
  const readableRounds = listReadableRounds(interview, canConduct);

  return (
    <>
      {conductRestriction && <Notice>{conductRestriction}</Notice>}
      {readableRounds.length === 0 && !canConduct && (
        <p className="text-ink-subtle">Nenhuma rodada ainda.</p>
      )}
      {readableRounds.length > 0 && (
        <ol className="flex flex-col gap-5">
          {readableRounds.map(round => (
            <CardInterviewRoundView key={round.number} round={round} />
          ))}
        </ol>
      )}
      {step.kind === "finished" && <Notice>A IA não tem mais perguntas para este card.</Notice>}
      {canConduct && (
        <CardInterviewConduct
          interview={interview}
          step={step}
          roundRequest={roundRequest}
          onFinished={proposalRequest.request}
        />
      )}
      <CardInterviewProposals
        card={card}
        interview={interview}
        canConduct={canConduct}
        proposalRequest={proposalRequest}
      />
      {canCloseInterview(access, interview) && (
        <footer className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="text-sm text-ink-subtle">
            Enquanto esta entrevista está aberta, o card não recebe outra.
          </span>
          <ConfirmButton
            title="Encerrar a entrevista?"
            description="A entrevista deixa de receber rodadas e propostas, e a proposta pendente é descartada. A conversa continua no histórico do card."
            confirmLabel="Encerrar entrevista"
            onConfirm={() => closeInterview(interview.id)}
          >
            Encerrar entrevista
          </ConfirmButton>
        </footer>
      )}
    </>
  );
}

type CardInterviewDetailProps = {
  card: Card;
  interviewId: string;
  access: CardInterviewAccess;
  roundRequest: RoundRequestState;
};

export function CardInterviewDetail({
  card,
  interviewId,
  access,
  roundRequest,
}: CardInterviewDetailProps) {
  const interview = useGetCardInterview(interviewId);

  return (
    <QueryContent
      query={interview}
      loadingLabel="Carregando a entrevista…"
      errorTitle="Não foi possível carregar a entrevista"
    >
      {loadedInterview => (
        <CardInterviewConversation
          card={card}
          interview={loadedInterview}
          access={access}
          roundRequest={roundRequest}
        />
      )}
    </QueryContent>
  );
}
