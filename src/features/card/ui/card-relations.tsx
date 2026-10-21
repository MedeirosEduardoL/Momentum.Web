import { useState, type ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { QueryContent } from "@/shared/ui/query-content";
import { Section } from "@/shared/ui/section";
import { useListCardRelations } from "../api/card.queries";
import { useRemoveCardRelation } from "../model/hooks/use-remove-card-relation";
import type { Card, RelatedCard } from "../model/types/card.types";
import { CardRelationForm } from "./card-relation-form";
import { CardRelationRow } from "./card-relation-row";

type CardRelationsProps = {
  card: Card;
  renderCardLink: (card: RelatedCard) => ReactNode;
};

export function CardRelations({ card, renderCardLink }: CardRelationsProps) {
  const relations = useListCardRelations(card.id);
  const removeRelation = useRemoveCardRelation();
  const [isAdding, setIsAdding] = useState(false);

  return (
    <Section
      title="Relações"
      description="Como este card se liga a outros cards da organização."
      action={
        <Button size="sm" onClick={() => setIsAdding(true)}>
          Nova relação
        </Button>
      }
    >
      <QueryContent
        query={relations}
        loadingLabel="Carregando as relações…"
        errorTitle="Não foi possível carregar as relações"
      >
        {relationList =>
          relationList.length === 0 ? (
            <p className="text-ink-subtle">Nenhuma relação.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line panel">
              {relationList.map(relation => (
                <CardRelationRow
                  key={relation.id}
                  relation={relation}
                  titleLink={renderCardLink(relation.card)}
                  onRemove={removeRelation}
                />
              ))}
            </ul>
          )
        }
      </QueryContent>
      <Modal
        open={isAdding}
        onOpenChange={setIsAdding}
        title="Nova relação"
        description="A relação é lida a partir deste card: “Bloqueado por” quer dizer que este card espera o outro."
      >
        <CardRelationForm card={card} onCreated={() => setIsAdding(false)} />
      </Modal>
    </Section>
  );
}
