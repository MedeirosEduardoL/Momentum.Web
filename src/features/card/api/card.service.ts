import { api } from "@/shared/api/client";
import { fillPath } from "@/shared/api/fill-path";
import type { components, paths } from "@/shared/api/generated/openapi";
import { putOrDelete } from "@/shared/api/put-or-delete";
import type {
  Card,
  CardAssignee,
  CardAssignment,
  CardFeatureAssignment,
  CardListQuery,
  CardPage,
  CardState,
  CardStateDraft,
  CardStateUpdate,
  CardSubitemCount,
  CardSubitemCounts,
  CardSummary,
  CardTypeFields,
  CardUpdate,
  NewCard,
} from "../model/types/card.types";

type Schemas = components["schemas"];
type CardDto = Schemas["CardResponseDto"];
type CardSummaryDto = Schemas["CardSummaryResponseDto"];
type CardStateDto = Schemas["CardStateResponseDto"];
type CardPageDto = Schemas["PagedResponseOfCardSummaryResponseDto"];
type CardListParams = NonNullable<paths["/api/v1/cards"]["get"]["parameters"]["query"]>;
type TypeFieldsPayload = Pick<
  Schemas["CreateCardRequestDto"],
  "user_story" | "spike" | "issue" | "tech_debt"
>;

const CARDS_PATH = "/api/v1/cards" satisfies keyof paths;
const CARD_STATES_PATH = "/api/v1/card-states" satisfies keyof paths;
const CARDS_PER_PAGE = 20;

function cardPath(cardId: string) {
  return fillPath("/api/v1/cards/{cardId}", { cardId });
}

function assigneePath(cardId: string) {
  return fillPath("/api/v1/cards/{cardId}/assignee", { cardId });
}

function featurePath(cardId: string) {
  return fillPath("/api/v1/cards/{cardId}/feature", { cardId });
}

export function toCardAssignee(dto: CardSummaryDto["assignee"]): CardAssignee | null {
  return dto && { userId: dto.user_id, name: dto.name };
}

export function toAssigneePayload(
  userId: string | null
): Schemas["SetCardAssigneeRequestDto"] | null {
  return userId === null ? null : { user_id: userId };
}

export function toCardState(dto: CardStateDto): CardState {
  return {
    id: dto.card_state_id,
    name: dto.name,
    category: dto.category,
    position: Number(dto.position),
  };
}

export function toCardSummary(dto: CardSummaryDto): CardSummary {
  return {
    id: dto.card_id,
    projectId: dto.project_id,
    identifier: dto.identifier,
    type: dto.card_type,
    title: dto.title,
    state: toCardState(dto.state),
    priority: dto.priority,
    assignee: toCardAssignee(dto.assignee),
    featureId: dto.feature_id,
    progress: Number(dto.progress),
    taskCount: Number(dto.task_count),
    doneTaskCount: Number(dto.done_task_count),
    subitemCounts: toSubitemCounts(dto.subitem_counts),
    isArchived: dto.archived,
    updatedAt: dto.updated_at,
  };
}

function toSubitemCount(dto: Schemas["CardSubitemCountResponseDto"]): CardSubitemCount {
  return { total: dto.total_count, done: dto.done_count };
}

function toSubitemCounts(dto: CardSummaryDto["subitem_counts"]): CardSubitemCounts {
  return {
    task: toSubitemCount(dto.task),
    bug: toSubitemCount(dto.bug),
    impediment: toSubitemCount(dto.impediment),
  };
}

function toTypeFields(dto: CardDto): CardTypeFields {
  switch (dto.card_type) {
    case "user_story":
      return {
        type: dto.card_type,
        acceptanceCriteria: dto.user_story?.acceptance_criteria ?? [],
      };
    case "spike":
      return {
        type: dto.card_type,
        question: dto.spike?.question ?? "",
        deadline: dto.spike?.deadline ?? null,
        conclusion: dto.spike?.conclusion ?? "",
      };
    case "issue":
      return {
        type: dto.card_type,
        stepsToReproduce: dto.issue?.steps_to_reproduce ?? "",
        expectedBehavior: dto.issue?.expected_behavior ?? "",
        observedBehavior: dto.issue?.observed_behavior ?? "",
        severity: dto.issue?.severity ?? null,
        location: dto.issue?.location ?? "",
      };
    case "tech_debt":
      return { type: dto.card_type, impact: dto.tech_debt?.impact ?? "" };
  }
}

function toCard(dto: CardDto): Card {
  return {
    ...toCardSummary(dto),
    description: dto.description,
    fields: toTypeFields(dto),
    createdAt: dto.created_at,
  };
}

function toCardPage(dto: CardPageDto): CardPage {
  return {
    cards: dto.items.map(toCardSummary),
    page: Number(dto.page),
    totalPages: Math.max(1, Math.ceil(Number(dto.total_count) / Number(dto.page_size))),
  };
}

function toListParams(query: CardListQuery): CardListParams {
  return {
    project_id: "projectId" in query ? query.projectId : undefined,
    card_type: query.type,
    card_state_id: query.stateId,
    assignee_id: query.assigneeId,
    unassigned: query.isUnassigned || undefined,
    feature_id: query.featureId,
    q: "search" in query ? query.search : undefined,
    archived: query.includesArchived || undefined,
    page: query.page,
    page_size: CARDS_PER_PAGE,
  };
}

function toTypeFieldsPayload(fields: CardTypeFields): TypeFieldsPayload {
  switch (fields.type) {
    case "user_story":
      return { user_story: { acceptance_criteria: fields.acceptanceCriteria } };
    case "spike":
      return {
        spike: {
          question: fields.question,
          deadline: fields.deadline,
          conclusion: fields.conclusion,
        },
      };
    case "issue":
      return {
        issue: {
          steps_to_reproduce: fields.stepsToReproduce,
          expected_behavior: fields.expectedBehavior,
          observed_behavior: fields.observedBehavior,
          severity: fields.severity,
          location: fields.location,
        },
      };
    case "tech_debt":
      return { tech_debt: { impact: fields.impact } };
  }
}

function listPathOf(query: CardListQuery) {
  return "boardId" in query
    ? fillPath("/api/v1/boards/{boardId}/cards", { boardId: query.boardId })
    : CARDS_PATH;
}

export async function listCards(query: CardListQuery): Promise<CardPage> {
  const response = await api.get<CardPageDto>(listPathOf(query), {
    params: toListParams(query),
  });
  return toCardPage(response.data);
}

export async function getCard(cardId: string): Promise<Card> {
  const response = await api.get<CardDto>(cardPath(cardId));
  return toCard(response.data);
}

export async function createCard(card: NewCard): Promise<Card> {
  const payload: Schemas["CreateCardRequestDto"] = {
    project_id: card.projectId,
    card_type: card.fields.type,
    title: card.title,
    description: card.description,
    card_state_id: card.cardStateId,
    priority: card.priority,
    assignee_id: card.assigneeId,
    feature_id: card.featureId,
    ...toTypeFieldsPayload(card.fields),
  };
  const response = await api.post<CardDto>(CARDS_PATH, payload);

  return toCard(response.data);
}

export async function updateCard({
  cardId,
  expectedUpdatedAt,
  ...changes
}: CardUpdate): Promise<Card> {
  const payload: Schemas["UpdateCardRequestDto"] = {
    expected_updated_at: expectedUpdatedAt ?? null,
    title: changes.title ?? null,
    description: changes.description ?? null,
    card_state_id: changes.cardStateId ?? null,
    archived: changes.isArchived ?? null,
    priority: changes.priority,
    ...(changes.fields && toTypeFieldsPayload(changes.fields)),
  };
  const response = await api.patch<CardDto>(cardPath(cardId), payload);

  return toCard(response.data);
}

export function setCardAssignee({ cardId, userId }: CardAssignment): Promise<void> {
  return putOrDelete(assigneePath(cardId), toAssigneePayload(userId));
}

export function setCardFeature({ cardId, featureId }: CardFeatureAssignment): Promise<void> {
  const payload: Schemas["SetCardFeatureRequestDto"] | null =
    featureId === null ? null : { feature_id: featureId };

  return putOrDelete(featurePath(cardId), payload);
}

function cardStatePath(cardStateId: string) {
  return fillPath("/api/v1/card-states/{cardStateId}", { cardStateId });
}

export async function createCardState(draft: CardStateDraft): Promise<CardState> {
  const payload: Schemas["CreateCardStateRequestDto"] = {
    project_id: draft.projectId,
    name: draft.name,
    category: draft.category,
  };
  const response = await api.post<CardStateDto>(CARD_STATES_PATH, payload);

  return toCardState(response.data);
}

export async function updateCardState({
  cardStateId,
  ...changes
}: CardStateUpdate): Promise<CardState> {
  const payload: Schemas["UpdateCardStateRequestDto"] = {
    name: changes.name ?? null,
    category: changes.category,
    position: changes.position ?? null,
  };
  const response = await api.patch<CardStateDto>(cardStatePath(cardStateId), payload);

  return toCardState(response.data);
}

export async function deleteCardState(cardStateId: string): Promise<void> {
  await api.delete(cardStatePath(cardStateId));
}

export async function listCardStates(projectId: string): Promise<CardState[]> {
  const params: NonNullable<paths["/api/v1/card-states"]["get"]["parameters"]["query"]> = {
    project_id: projectId,
  };
  const response = await api.get<CardStateDto[]>(CARD_STATES_PATH, { params });

  return response.data.map(toCardState);
}
