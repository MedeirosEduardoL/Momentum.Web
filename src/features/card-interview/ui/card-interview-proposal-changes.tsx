import type { ReactNode } from "react";
import type { Card } from "@/features/card";
import { MarkdownContent } from "@/shared/ui/markdown-content";
import { currentValueOf } from "../model/lib/proposal-changes";
import type {
  CardInterviewProposalChange,
  CardInterviewProposalValue,
} from "../model/types/card-interview.types";

type ProposalTextProps = {
  value: CardInterviewProposalValue;
  showsLinkDestination: boolean;
};

function ProposalText({ value, showsLinkDestination }: ProposalTextProps) {
  if (value.length === 0) {
    return <p className="text-ink-subtle">Vazio.</p>;
  }

  if (typeof value === "string") {
    return <MarkdownContent content={value} showsLinkDestination={showsLinkDestination} />;
  }

  return (
    <ol className="flex list-decimal flex-col gap-2 pl-5">
      {value.map((item, position) => (
        <li key={`${position}-${item}`}>
          <MarkdownContent content={item} showsLinkDestination={showsLinkDestination} />
        </li>
      ))}
    </ol>
  );
}

type ProposalValueProps = {
  title: string;
  value: CardInterviewProposalValue;
  showsLinkDestination?: boolean;
};

function ProposalValue({ title, value, showsLinkDestination = false }: ProposalValueProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-medium text-ink-subtle">{title}</span>
      <ProposalText value={value} showsLinkDestination={showsLinkDestination} />
    </div>
  );
}

type CardInterviewProposalChangesProps = {
  card: Card;
  changes: CardInterviewProposalChange[];
  renderHeading: (change: CardInterviewProposalChange) => ReactNode;
};

export function CardInterviewProposalChanges({
  card,
  changes,
  renderHeading,
}: CardInterviewProposalChangesProps) {
  if (changes.length === 0) {
    return <p className="text-ink-subtle">A IA não propôs nenhuma mudança para este card.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {changes.map(change => (
        <li key={change.field} className="flex flex-col gap-3 rounded-md border border-line p-3">
          {renderHeading(change)}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProposalValue title="Atual no card" value={currentValueOf(card, change.field)} />
            <ProposalValue title="Proposta da IA" value={change.proposed} showsLinkDestination />
          </div>
        </li>
      ))}
    </ul>
  );
}
