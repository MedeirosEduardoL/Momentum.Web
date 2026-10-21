import { QueryContent } from "@/shared/ui/query-content";
import { Section } from "@/shared/ui/section";
import { useListCardTasks } from "../api/card.queries";
import type { Card } from "../model/types/card.types";
import { CardOptionsContent } from "./card-options-content";
import { CardTaskList } from "./card-task-list";

type CardTasksProps = {
  card: Card;
};

export function CardTasks({ card }: CardTasksProps) {
  const tasks = useListCardTasks(card.id);

  return (
    <Section
      title="Subitens"
      description="Tasks, bugs e impedimentos do card, cada um com estado, responsável e descrição próprios. Clique no título para abrir o subitem."
    >
      <QueryContent
        query={tasks}
        loadingLabel="Carregando os subitens…"
        errorTitle="Não foi possível carregar os subitens"
      >
        {taskList => (
          <CardOptionsContent projectId={card.projectId}>
            {({ team }) => <CardTaskList card={card} tasks={taskList} team={team} />}
          </CardOptionsContent>
        )}
      </QueryContent>
    </Section>
  );
}
