import type { Card } from "@/features/card";
import { Button } from "@/shared/ui/button";
import { QueryContent } from "@/shared/ui/query-content";
import { Section } from "@/shared/ui/section";
import { useListCardInterviews } from "../api/card-interview.queries";
import { useCardInterviewAccess } from "../model/hooks/use-card-interview-access";
import { useCardInterviewRound } from "../model/hooks/use-card-interview-round";
import { useStartCardInterview } from "../model/hooks/use-start-card-interview";
import { canStartInterview, explainStartRestriction } from "../model/lib/card-interview-access";
import { CardInterviewItem } from "./card-interview-item";

type CardInterviewsProps = {
  card: Card;
};

export function CardInterviews({ card }: CardInterviewsProps) {
  const interviews = useListCardInterviews(card.id);
  const access = useCardInterviewAccess(card);
  const roundRequest = useCardInterviewRound();
  const { startInterview, isStarting } = useStartCardInterview(card, roundRequest.ask);
  const startRestriction = explainStartRestriction(access, card);

  return (
    <Section
      title="Entrevista"
      description="A IA pergunta sobre o card em rodadas e propõe mudanças nele. A conversa fica visível para o time."
      action={
        canStartInterview(access, card, interviews.data) && (
          <Button size="sm" isLoading={isStarting} onClick={startInterview}>
            Iniciar entrevista
          </Button>
        )
      }
    >
      {startRestriction && <p className="text-sm text-ink-subtle">{startRestriction}</p>}
      <QueryContent
        query={interviews}
        loadingLabel="Carregando as entrevistas…"
        errorTitle="Não foi possível carregar as entrevistas"
      >
        {interviewList =>
          interviewList.length === 0 ? (
            <p className="text-ink-subtle">Nenhuma entrevista neste card.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {interviewList.map(interview => (
                <CardInterviewItem
                  key={interview.id}
                  card={card}
                  interview={interview}
                  access={access}
                  roundRequest={roundRequest}
                />
              ))}
            </ul>
          )
        }
      </QueryContent>
    </Section>
  );
}
