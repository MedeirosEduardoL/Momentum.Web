import type { ReactNode } from "react";
import { useListEpics, useListFeatures } from "@/features/feature";
import { useListProjectMembers } from "@/features/project";
import { QueryContent } from "@/shared/ui/query-content";
import type { BoardFilterOptions } from "../model/types/board.types";

type BoardFilterOptionsContentProps = {
  projectId: string;
  children: (options: BoardFilterOptions) => ReactNode;
};

export function BoardFilterOptionsContent({ projectId, children }: BoardFilterOptionsContentProps) {
  const team = useListProjectMembers(projectId);
  const features = useListFeatures(projectId);
  const epics = useListEpics(projectId);

  return (
    <QueryContent
      query={team}
      loadingLabel="Carregando o time…"
      errorTitle="Não foi possível carregar o time"
    >
      {members => (
        <QueryContent
          query={features}
          loadingLabel="Carregando as features…"
          errorTitle="Não foi possível carregar as features"
        >
          {featureList => (
            <QueryContent
              query={epics}
              loadingLabel="Carregando os epics…"
              errorTitle="Não foi possível carregar os epics"
            >
              {epicList => children({ team: members, features: featureList, epics: epicList })}
            </QueryContent>
          )}
        </QueryContent>
      )}
    </QueryContent>
  );
}
