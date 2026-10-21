import { useState } from "react";
import type { Card } from "@/features/card";
import { Button } from "@/shared/ui/button";
import type { RoundRequestState } from "../model/hooks/use-card-interview-round";
import { isInterviewOpen } from "../model/lib/card-interview-access";
import { describeInterview } from "../model/lib/card-interview-description";
import type {
  CardInterviewAccess,
  CardInterviewSummary,
} from "../model/types/card-interview.types";
import { CardInterviewDetail } from "./card-interview-detail";

type CardInterviewItemProps = {
  card: Card;
  interview: CardInterviewSummary;
  access: CardInterviewAccess;
  roundRequest: RoundRequestState;
};

export function CardInterviewItem({
  card,
  interview,
  access,
  roundRequest,
}: CardInterviewItemProps) {
  const isOpen = isInterviewOpen(interview);
  const [isExpanded, setIsExpanded] = useState(isOpen);

  return (
    <li className="flex flex-col gap-4 panel p-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="font-medium">
            {isOpen ? "Entrevista aberta" : "Entrevista encerrada"}
          </span>
          <span className="text-sm text-ink-muted">{describeInterview(interview)}</span>
        </div>
        {!isOpen && (
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Ocultar a conversa" : "Ver a conversa"}
          </Button>
        )}
      </header>
      {(isOpen || isExpanded) && (
        <CardInterviewDetail
          card={card}
          interviewId={interview.id}
          access={access}
          roundRequest={roundRequest}
        />
      )}
    </li>
  );
}
