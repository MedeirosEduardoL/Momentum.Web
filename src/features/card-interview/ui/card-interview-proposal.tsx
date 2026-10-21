import type { Card } from "@/features/card";
import { MarkdownContent } from "@/shared/ui/markdown-content";
import { describeProposalDecision } from "../model/lib/card-interview-description";
import { PROPOSAL_FIELD_LABELS } from "../model/lib/proposal-changes";
import type { CardInterviewProposal } from "../model/types/card-interview.types";
import { CardInterviewProposalChanges } from "./card-interview-proposal-changes";
import { CardInterviewProposalDecision } from "./card-interview-proposal-decision";

type ProposalSummaryProps = {
  proposal: CardInterviewProposal;
};

function ProposalSummary({ proposal }: ProposalSummaryProps) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-line-strong pl-3">
      <span className="text-xs font-medium text-ink-subtle">Resumo da IA</span>
      <MarkdownContent content={proposal.summary} showsLinkDestination />
    </div>
  );
}

type PendingCardInterviewProposalProps = {
  card: Card;
  proposal: CardInterviewProposal;
  canConduct: boolean;
  onRequestAnother: () => void;
};

export function PendingCardInterviewProposal({
  card,
  proposal,
  canConduct,
  onRequestAnother,
}: PendingCardInterviewProposalProps) {
  return (
    <div className="flex flex-col gap-3">
      <ProposalSummary proposal={proposal} />
      {canConduct ? (
        <CardInterviewProposalDecision
          card={card}
          proposal={proposal}
          onRequestAnother={onRequestAnother}
        />
      ) : (
        <>
          <CardInterviewProposalChanges
            card={card}
            changes={proposal.changes}
            renderHeading={change => (
              <span className="font-medium">{PROPOSAL_FIELD_LABELS[change.field]}</span>
            )}
          />
          <p className="text-sm text-ink-subtle">
            Aguardando a decisão de quem conduz a entrevista.
          </p>
        </>
      )}
    </div>
  );
}

export function DecidedCardInterviewProposal({ proposal }: ProposalSummaryProps) {
  return (
    <li className="flex flex-col gap-2">
      <span className="text-sm text-ink-muted">{describeProposalDecision(proposal)}</span>
      <ProposalSummary proposal={proposal} />
    </li>
  );
}
