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
        <TextLink to="/projetos/$projectId/boards" params={{ projectId }}>
          Voltar para o board
        </TextLink>
      }
      onCreated={card =>
        navigate({
          to: "/projetos/$projectId/boards",
          params: { projectId },
          search: { card: card.id },
        })
      }
    />
  );
}
