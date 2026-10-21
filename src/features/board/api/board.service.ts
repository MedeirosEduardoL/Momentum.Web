import { toCardState, toCardSummary, type CardStateColumn } from "@/features/card";
import { api } from "@/shared/api/client";
import { fillPath } from "@/shared/api/fill-path";
import type { components, paths } from "@/shared/api/generated/openapi";
import type {
  Board,
  BoardColumnsQuery,
  BoardFilter,
  BoardUpdate,
  NewBoard,
} from "../model/types/board.types";

type Schemas = components["schemas"];
type BoardDto = Schemas["BoardResponseDto"];
type BoardColumnDto = Schemas["BoardColumnResponseDto"];
type BoardListParams = NonNullable<paths["/api/v1/boards"]["get"]["parameters"]["query"]>;
type BoardColumnsParams = NonNullable<
  paths["/api/v1/boards/{boardId}/columns"]["get"]["parameters"]["query"]
>;

const BOARDS_PATH = "/api/v1/boards" satisfies keyof paths;

function boardPath(boardId: string) {
  return fillPath("/api/v1/boards/{boardId}", { boardId });
}

function toBoard(dto: BoardDto): Board {
  return {
    id: dto.board_id,
    projectId: dto.project_id,
    name: dto.name,
    filter: {
      cardTypes: dto.filter.card_types,
      priorities: dto.filter.priorities,
      assigneeIds: dto.filter.assignee_ids,
      featureIds: dto.filter.feature_ids,
      epicIds: dto.filter.epic_ids,
    },
  };
}

function toFilterPayload(filter: BoardFilter): Schemas["BoardFilterRequestDto"] {
  return {
    card_types: filter.cardTypes,
    priorities: filter.priorities,
    assignee_ids: filter.assigneeIds,
    feature_ids: filter.featureIds,
    epic_ids: filter.epicIds,
  };
}

function toBoardColumn(dto: BoardColumnDto): CardStateColumn {
  return {
    state: toCardState(dto.state),
    totalCount: dto.total_count,
    cards: dto.cards.map(toCardSummary),
  };
}

export async function listBoards(projectId: string): Promise<Board[]> {
  const params: BoardListParams = { project_id: projectId };
  const response = await api.get<BoardDto[]>(BOARDS_PATH, { params });

  return response.data.map(toBoard);
}

export async function createBoard({ projectId, name, filter }: NewBoard): Promise<Board> {
  const payload: Schemas["CreateBoardRequestDto"] = {
    project_id: projectId,
    name,
    filter: toFilterPayload(filter),
  };
  const response = await api.post<BoardDto>(BOARDS_PATH, payload);

  return toBoard(response.data);
}

export async function updateBoard({ boardId, name, filter }: BoardUpdate): Promise<Board> {
  const payload: Schemas["UpdateBoardRequestDto"] = { name, filter: toFilterPayload(filter) };
  const response = await api.patch<BoardDto>(boardPath(boardId), payload);

  return toBoard(response.data);
}

export async function deleteBoard(boardId: string): Promise<void> {
  await api.delete(boardPath(boardId));
}

export async function listBoardColumns({
  boardId,
  assigneeId,
  isUnassigned,
}: BoardColumnsQuery): Promise<CardStateColumn[]> {
  const params: BoardColumnsParams = {
    assignee_id: assigneeId,
    unassigned: isUnassigned || undefined,
  };
  const response = await api.get<BoardColumnDto[]>(
    fillPath("/api/v1/boards/{boardId}/columns", { boardId }),
    { params }
  );

  return response.data.map(toBoardColumn);
}
