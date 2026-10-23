import { api } from "@/shared/api/client";
import { fillPath } from "@/shared/api/fill-path";
import type { components, paths } from "@/shared/api/generated/openapi";
import type { Epic, EpicSummary, EpicUpdate, NewEpic } from "../model/types/feature.types";

type Schemas = components["schemas"];
type EpicDto = Schemas["EpicResponseDto"];
type EpicSummaryDto = Schemas["EpicSummaryResponseDto"];
type EpicListParams = NonNullable<paths["/api/v1/epics"]["get"]["parameters"]["query"]>;

const EPICS_PATH = "/api/v1/epics" satisfies keyof paths;

function epicPath(epicId: string) {
  return fillPath("/api/v1/epics/{epicId}", { epicId });
}

function toEpicSummary(dto: EpicSummaryDto): EpicSummary {
  return {
    id: dto.epic_id,
    projectId: dto.project_id,
    title: dto.title,
    progress: dto.progress,
    state: dto.state,
    featureCount: dto.feature_count,
    cardCount: dto.card_count,
  };
}

function toEpic(dto: EpicDto): Epic {
  return { ...toEpicSummary(dto), description: dto.description };
}

export async function listEpics(projectId: string): Promise<EpicSummary[]> {
  const params: EpicListParams = { project_id: projectId };
  const response = await api.get<EpicSummaryDto[]>(EPICS_PATH, { params });

  return response.data.map(toEpicSummary);
}

export async function listBoardEpics(boardId: string): Promise<EpicSummary[]> {
  const response = await api.get<EpicSummaryDto[]>(
    fillPath("/api/v1/boards/{boardId}/epics", { boardId })
  );

  return response.data.map(toEpicSummary);
}

export async function getEpic(epicId: string): Promise<Epic> {
  const response = await api.get<EpicDto>(epicPath(epicId));

  return toEpic(response.data);
}

export async function createEpic(epic: NewEpic): Promise<Epic> {
  const payload: Schemas["CreateEpicRequestDto"] = {
    project_id: epic.projectId,
    title: epic.title,
    description: epic.description,
  };
  const response = await api.post<EpicDto>(EPICS_PATH, payload);

  return toEpic(response.data);
}

export async function updateEpic({ epicId, ...text }: EpicUpdate): Promise<Epic> {
  const payload: Schemas["UpdateEpicRequestDto"] = text;
  const response = await api.patch<EpicDto>(epicPath(epicId), payload);

  return toEpic(response.data);
}

export async function deleteEpic(epicId: string): Promise<void> {
  await api.delete(epicPath(epicId));
}
