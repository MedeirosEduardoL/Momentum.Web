import type { ReactNode } from "react";
import { QueryContent } from "@/shared/ui/query-content";
import { useGetCard } from "../api/card.queries";
import type { Card } from "../model/types/card.types";

type CardContentProps = {
  cardId: string;
  children: (card: Card) => ReactNode;
};

export function CardContent({ cardId, children }: CardContentProps) {
  const card = useGetCard(cardId);

  return (
    <QueryContent
      query={card}
      loadingLabel="Carregando o card…"
      errorTitle="Não foi possível carregar o card"
    >
      {children}
    </QueryContent>
  );
}
