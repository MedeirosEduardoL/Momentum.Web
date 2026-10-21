import type { ReactNode } from "react";
import { useListProjectMembers } from "@/features/project";
import { QueryContent } from "@/shared/ui/query-content";
import { useListCardStates } from "../api/card.queries";
import type { CardOptions } from "../model/types/card.types";

type CardOptionsContentProps = {
  projectId: string;
  children: (options: CardOptions) => ReactNode;
};

export function CardOptionsContent({ projectId, children }: CardOptionsContentProps) {
  const states = useListCardStates(projectId);
  const team = useListProjectMembers(projectId);

  return (
    <QueryContent
      query={states}
      loadingLabel="Carregando os estados do projeto…"
      errorTitle="Não foi possível carregar os estados do projeto"
    >
      {stateList => (
        <QueryContent
          query={team}
          loadingLabel="Carregando o time…"
          errorTitle="Não foi possível carregar o time"
        >
          {members => children({ states: stateList, team: members })}
        </QueryContent>
      )}
    </QueryContent>
  );
}
