import type { ReactNode } from "react";
import { MarkdownSection } from "@/shared/ui/markdown-section";
import { QueryContent } from "@/shared/ui/query-content";
import { Screen } from "@/shared/ui/screen";
import { Section } from "@/shared/ui/section";
import { useGetEpic } from "../api/feature.queries";
import { describeEpic } from "../model/lib/group-description";
import type { Epic, EpicSummary } from "../model/types/feature.types";
import { EpicFeatures } from "./epic-features";
import type { FeatureLinks } from "./feature-list";

type EpicLinks = FeatureLinks & {
  editLink: ReactNode;
  renderBackLink: (projectId: string) => ReactNode;
  renderNewFeatureLink: (epic: EpicSummary) => ReactNode;
};

type EpicDetailProps = EpicLinks & {
  epicId: string;
};

type EpicScreenProps = EpicLinks & {
  epic: Epic;
};

function EpicScreen({
  epic,
  editLink,
  renderBackLink,
  renderNewFeatureLink,
  ...featureLinks
}: EpicScreenProps) {
  return (
    <Screen
      backLink={renderBackLink(epic.projectId)}
      eyebrow={<p className="text-sm text-ink-muted">Epic</p>}
      title={epic.title}
      action={editLink}
    >
      <p className="text-sm text-ink-muted">{describeEpic(epic)}</p>
      <MarkdownSection title="Descrição" content={epic.description} emptyText="Sem descrição." />
      <Section title="Features do epic" action={renderNewFeatureLink(epic)}>
        <EpicFeatures epic={epic} {...featureLinks} />
      </Section>
    </Screen>
  );
}

export function EpicDetail({ epicId, ...links }: EpicDetailProps) {
  const epic = useGetEpic(epicId);

  return (
    <QueryContent
      query={epic}
      loadingLabel="Carregando o epic…"
      errorTitle="Não foi possível carregar o epic"
    >
      {loadedEpic => <EpicScreen epic={loadedEpic} {...links} />}
    </QueryContent>
  );
}
