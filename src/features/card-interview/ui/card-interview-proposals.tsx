import type { Card } from "@/features/card";
import { describeApiFailure } from "@/shared/api/describe-api-failure";
import { Notice } from "@/shared/ui/notice";
import { QueryContent } from "@/shared/ui/query-content";
import { useListCardInterviewProposals } from "../api/card-interview.queries";
import type { ProposalRequestState } from "../model/hooks/use-request-card-interview-proposal";
import { isPendingProposal, wasLatestProposalApplied } from "../model/lib/proposal-changes";
import type { CardInterview, CardInterviewProposal } from "../model/types/card-interview.types";
import {
  DecidedCardInterviewProposal,
  PendingCardInterviewProposal,
} from "./card-interview-proposal";
import {
  CardInterviewProposalRequest,
  CardInterviewProposalWait,
} from "./card-interview-proposal-request";

type CardInterviewProposalListProps = {
  card: Card;
  interview: CardInterview;
  proposals: CardInterviewProposal[];
  canConduct: boolean;
  proposalRequest: ProposalRequestState;
};

function CardInterviewProposalList({
  card,
  interview,
  proposals,
  canConduct,
  proposalRequest,
}: CardInterviewProposalListProps) {
  const { request, isRequesting, failure } = proposalRequest;
  const pending = proposals.find(isPendingProposal);
  const decided = proposals.filter(proposal => !isPendingProposal(proposal));

  if (proposals.length === 0 && !canConduct) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3 border-t border-line pt-3">
      <h3 className="font-medium">Proposta de mudança no card</h3>
      {failure !== null && <Notice tone="danger">{describeApiFailure(failure)}</Notice>}
      {isRequesting && <CardInterviewProposalWait />}
      {!isRequesting && pending && (
        <PendingCardInterviewProposal
          key={pending.id}
          card={card}
          proposal={pending}
          canConduct={canConduct}
          onRequestAnother={request}
        />
      )}
      {!isRequesting && !pending && canConduct && (
        <>
          {wasLatestProposalApplied(proposals) && (
            <Notice tone="success">
              A proposta foi aplicada ao card, e a entrevista continua aberta.
            </Notice>
          )}
          <CardInterviewProposalRequest interview={interview} onRequest={request} />
        </>
      )}
      {decided.length > 0 && (
        <ul className="flex flex-col gap-3">
          {decided.map(proposal => (
            <DecidedCardInterviewProposal key={proposal.id} proposal={proposal} />
          ))}
        </ul>
      )}
    </section>
  );
}

type CardInterviewProposalsProps = {
  card: Card;
  interview: CardInterview;
  canConduct: boolean;
  proposalRequest: ProposalRequestState;
};

export function CardInterviewProposals({
  card,
  interview,
  canConduct,
  proposalRequest,
}: CardInterviewProposalsProps) {
  const proposals = useListCardInterviewProposals(interview.id);

  return (
    <QueryContent
      query={proposals}
      loadingLabel="Carregando as propostas…"
      errorTitle="Não foi possível carregar as propostas"
    >
      {proposalList => (
        <CardInterviewProposalList
          card={card}
          interview={interview}
          proposals={proposalList}
          canConduct={canConduct}
          proposalRequest={proposalRequest}
        />
      )}
    </QueryContent>
  );
}
