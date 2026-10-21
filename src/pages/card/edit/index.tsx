import { useNavigate } from "@tanstack/react-router";
import { EditCardForm } from "@/features/card";
import { TextLink } from "@/shared/ui/text-link";

type CardEditPageProps = {
  cardId: string;
};

export function CardEditPage({ cardId }: CardEditPageProps) {
  const navigate = useNavigate();

  return (
    <EditCardForm
      cardId={cardId}
      backLink={
        <TextLink to="/cards/$cardId" params={{ cardId }}>
          Voltar para o card
        </TextLink>
      }
      onSaved={() => navigate({ to: "/cards/$cardId", params: { cardId } })}
    />
  );
}
