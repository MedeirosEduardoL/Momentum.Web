import type { Card } from "@/features/card";
import { useGetCurrentOrganization } from "@/features/organization";
import { describeApiFailure } from "@/shared/api/describe-api-failure";
import { formatDate } from "@/shared/lib/format-date";
import { Button } from "@/shared/ui/button";
import { LoadingState } from "@/shared/ui/loading-state";
import { MarkdownContent } from "@/shared/ui/markdown-content";
import { Notice } from "@/shared/ui/notice";
import { QueryContent } from "@/shared/ui/query-content";
import { Section } from "@/shared/ui/section";
import { useGetCardBrief } from "../api/card-brief.queries";
import { useCardBriefFile } from "../model/hooks/use-card-brief-file";
import { useGenerateCardBrief } from "../model/hooks/use-generate-card-brief";
import { explainGenerateRestriction } from "../model/lib/card-brief-access";
import type { CardBrief } from "../model/types/card-brief.types";

function CardBriefWait() {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-surface-raised p-3">
      <LoadingState label="A IA está escrevendo o briefing…" />
      <p className="text-center text-sm text-ink-subtle">
        Pode levar até dois minutos. Não feche nem recarregue a tela.
      </p>
    </div>
  );
}

type CardBriefStartProps = {
  restriction: string | null;
  onGenerate: () => void;
};

function CardBriefStart({ restriction, onGenerate }: CardBriefStartProps) {
  if (restriction) {
    return <p className="text-ink-subtle">{restriction}</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" onClick={onGenerate}>
        Gerar briefing
      </Button>
      <span className="text-sm text-ink-subtle">
        Cada pedido é uma chamada paga à IA, e um card tem até 10 por dia.
      </span>
    </div>
  );
}

type CardBriefPreviewProps = {
  brief: CardBrief;
  restriction: string | null;
  onGenerate: () => void;
};

function CardBriefPreview({ brief, restriction, onGenerate }: CardBriefPreviewProps) {
  const { copy, download } = useCardBriefFile(brief);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-subtle">
        Gerado em {formatDate(brief.generatedAt)}, com o prompt {brief.promptVersion}. Revise antes
        de entregar a um agente.
      </p>
      {brief.isOutdated && (
        <Notice>
          O card mudou depois deste briefing. Gere outro para o arquivo trazer a mudança.
        </Notice>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={copy}>Copiar</Button>
        <Button variant="secondary" onClick={download}>
          Baixar {brief.fileName}
        </Button>
        {restriction === null && (
          <Button variant="ghost" onClick={onGenerate}>
            Gerar de novo
          </Button>
        )}
      </div>
      {restriction && <p className="text-sm text-ink-subtle">{restriction}</p>}
      <div className="max-h-[32rem] overflow-y-auto rounded-md border border-line bg-surface-raised p-4">
        <MarkdownContent content={brief.content} showsLinkDestination />
      </div>
    </div>
  );
}

type CardBriefContentProps = {
  card: Card;
  brief: CardBrief | null;
};

function CardBriefContent({ card, brief }: CardBriefContentProps) {
  const organization = useGetCurrentOrganization();
  const { generate, isGenerating, failure } = useGenerateCardBrief(card.id);
  const restriction = explainGenerateRestriction(card, organization.data?.isAiEnabled ?? false);

  return (
    <div className="flex flex-col gap-3">
      {failure !== null && <Notice tone="danger">{describeApiFailure(failure)}</Notice>}
      {isGenerating && <CardBriefWait />}
      {!isGenerating && brief && (
        <CardBriefPreview brief={brief} restriction={restriction} onGenerate={generate} />
      )}
      {!isGenerating && !brief && (
        <CardBriefStart restriction={restriction} onGenerate={generate} />
      )}
    </div>
  );
}

type CardBriefSectionProps = {
  card: Card;
};

export function CardBriefSection({ card }: CardBriefSectionProps) {
  const brief = useGetCardBrief(card.id);

  return (
    <Section
      title="Briefing"
      description="O arquivo que o desenvolvedor entrega a um agente, escrito pela IA a partir do card, das tasks e da entrevista."
    >
      <QueryContent
        query={brief}
        loadingLabel="Carregando o briefing…"
        errorTitle="Não foi possível carregar o briefing"
      >
        {current => <CardBriefContent card={card} brief={current} />}
      </QueryContent>
    </Section>
  );
}
