import { formatDay } from "@/shared/lib/format-date";
import { MarkdownContent } from "@/shared/ui/markdown-content";
import { MarkdownSection } from "@/shared/ui/markdown-section";
import { Section } from "@/shared/ui/section";
import { ISSUE_SEVERITY_LABELS } from "../model/lib/card-options";
import type {
  CardTypeFields,
  IssueFields,
  SpikeFields,
  UserStoryFields,
} from "../model/types/card.types";

type CardTypeDetailsProps = {
  fields: CardTypeFields;
};

const NOT_FILLED = "Não informado.";

function UserStoryDetails({ fields }: { fields: UserStoryFields }) {
  return (
    <Section title="Critérios de aceite">
      {fields.acceptanceCriteria.length === 0 ? (
        <p className="text-ink-subtle">Nenhum critério de aceite.</p>
      ) : (
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          {fields.acceptanceCriteria.map((criterion, position) => (
            <li key={`${position}-${criterion}`}>
              <MarkdownContent content={criterion} />
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

function SpikeDetails({ fields }: { fields: SpikeFields }) {
  return (
    <>
      <MarkdownSection title="Pergunta" content={fields.question} emptyText={NOT_FILLED} />
      <Section title="Prazo">
        <p className={fields.deadline ? undefined : "text-ink-subtle"}>
          {fields.deadline ? formatDay(fields.deadline) : "Sem prazo."}
        </p>
      </Section>
      <MarkdownSection title="Conclusão" content={fields.conclusion} emptyText={NOT_FILLED} />
    </>
  );
}

function IssueDetails({ fields }: { fields: IssueFields }) {
  return (
    <>
      <MarkdownSection
        title="Passos para reproduzir"
        content={fields.stepsToReproduce}
        emptyText={NOT_FILLED}
      />
      <MarkdownSection
        title="Comportamento esperado"
        content={fields.expectedBehavior}
        emptyText={NOT_FILLED}
      />
      <MarkdownSection
        title="Comportamento observado"
        content={fields.observedBehavior}
        emptyText={NOT_FILLED}
      />
      <Section title="Severidade">
        <p className={fields.severity ? undefined : "text-ink-subtle"}>
          {fields.severity ? ISSUE_SEVERITY_LABELS[fields.severity] : NOT_FILLED}
        </p>
      </Section>
      <Section title="Local">
        <p className={fields.location ? "font-mono text-sm break-words" : "text-ink-subtle"}>
          {fields.location || NOT_FILLED}
        </p>
      </Section>
    </>
  );
}

export function CardTypeDetails({ fields }: CardTypeDetailsProps) {
  switch (fields.type) {
    case "user_story":
      return <UserStoryDetails fields={fields} />;
    case "spike":
      return <SpikeDetails fields={fields} />;
    case "issue":
      return <IssueDetails fields={fields} />;
    case "tech_debt":
      return <MarkdownSection title="Impacto" content={fields.impact} emptyText={NOT_FILLED} />;
  }
}
