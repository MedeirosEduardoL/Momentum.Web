import { api } from "@/shared/api/client";
import { fillPath } from "@/shared/api/fill-path";
import type { components } from "@/shared/api/generated/openapi";
import type { CardRelation, NewCardRelation } from "../model/types/card.types";

type Schemas = components["schemas"];
type CardRelationDto = Schemas["CardRelationResponseDto"];

function cardRelationsPath(cardId: string) {
  return fillPath("/api/v1/cards/{cardId}/relations", { cardId });
}

function cardRelationPath(cardRelationId: string) {
  return fillPath("/api/v1/card-relations/{cardRelationId}", { cardRelationId });
}

function toCardRelation({ card_relation_id, relation, card }: CardRelationDto): CardRelation {
  return {
    id: card_relation_id,
    relation,
    card: {
      id: card.card_id,
      identifier: card.identifier,
      type: card.card_type,
      title: card.title,
      stateName: card.state_name,
    },
  };
}

export async function listCardRelations(cardId: string): Promise<CardRelation[]> {
  const response = await api.get<CardRelationDto[]>(cardRelationsPath(cardId));

  return response.data.map(toCardRelation);
}

export async function createCardRelation({
  cardId,
  relatedCardId,
  relation,
}: NewCardRelation): Promise<CardRelation> {
  const payload: Schemas["CreateCardRelationRequestDto"] = {
    related_card_id: relatedCardId,
    relation,
  };
  const response = await api.post<CardRelationDto>(cardRelationsPath(cardId), payload);

  return toCardRelation(response.data);
}

export async function deleteCardRelation(cardRelationId: string): Promise<void> {
  await api.delete(cardRelationPath(cardRelationId));
}
