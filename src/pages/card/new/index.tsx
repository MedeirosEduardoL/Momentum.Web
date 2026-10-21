import { useNavigate } from "@tanstack/react-router";
import { CreateCardForm } from "@/features/card";
import { TextLink } from "@/shared/ui/text-link";

type NewCardPageProps = {
  projectId: string;
};

export function NewCardPage({ projectId }: NewCardPageProps) {
  const navigate = useNavigate();

  return (
    <CreateCardForm
      projectId={projectId}
      backLink={
        <TextLink to="/projetos/$projectId/cards" params={{ projectId }}>
          Voltar para os cards do projeto
        </TextLink>
      }
      onCreated={card => navigate({ to: "/cards/$cardId", params: { cardId: card.id } })}
    />
  );
}
