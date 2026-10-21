import { api } from "@/shared/api/client";
import { fillPath } from "@/shared/api/fill-path";
import type { components } from "@/shared/api/generated/openapi";
import { putOrDelete } from "@/shared/api/put-or-delete";
import type {
  CardTask,
  CardTaskAssignment,
  CardTaskChanges,
  NewCardTask,
} from "../model/types/card.types";
import { toAssigneePayload, toCardAssignee } from "./card.service";

type Schemas = components["schemas"];
type CardTaskDto = Schemas["CardTaskResponseDto"];

function cardTasksPath(cardId: string) {
  return fillPath("/api/v1/cards/{cardId}/tasks", { cardId });
}

function cardTaskPath(cardTaskId: string) {
  return fillPath("/api/v1/card-tasks/{cardTaskId}", { cardTaskId });
}

function cardTaskAssigneePath(cardTaskId: string) {
  return fillPath("/api/v1/card-tasks/{cardTaskId}/assignee", { cardTaskId });
}

function toCardTask(dto: CardTaskDto): CardTask {
  return {
    id: dto.card_task_id,
    cardId: dto.card_id,
    kind: dto.kind,
    title: dto.title,
    description: dto.description,
    state: dto.state,
    assignee: toCardAssignee(dto.assignee),
    updatedAt: dto.updated_at,
  };
}

export async function listCardTasks(cardId: string): Promise<CardTask[]> {
  const response = await api.get<CardTaskDto[]>(cardTasksPath(cardId));

  return response.data.map(toCardTask);
}

export async function createCardTask({
  cardId,
  kind,
  title,
  assigneeId,
}: NewCardTask): Promise<CardTask> {
  const payload: Schemas["CreateCardTaskRequestDto"] = { kind, title, assignee_id: assigneeId };
  const response = await api.post<CardTaskDto>(cardTasksPath(cardId), payload);

  return toCardTask(response.data);
}

export async function updateCardTask({
  cardTaskId,
  title,
  description,
  state,
  expectedUpdatedAt,
}: CardTaskChanges): Promise<CardTask> {
  const payload: Schemas["UpdateCardTaskRequestDto"] = {
    title,
    description,
    state,
    expected_updated_at: expectedUpdatedAt,
  };
  const response = await api.patch<CardTaskDto>(cardTaskPath(cardTaskId), payload);

  return toCardTask(response.data);
}

export async function deleteCardTask(cardTaskId: string): Promise<void> {
  await api.delete(cardTaskPath(cardTaskId));
}

export function setCardTaskAssignee({ cardTaskId, userId }: CardTaskAssignment): Promise<void> {
  return putOrDelete(cardTaskAssigneePath(cardTaskId), toAssigneePayload(userId));
}
