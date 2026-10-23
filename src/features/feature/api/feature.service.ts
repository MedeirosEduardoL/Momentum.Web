import { api } from "@/shared/api/client";
import { fillPath } from "@/shared/api/fill-path";
import type { components, paths } from "@/shared/api/generated/openapi";
import { putOrDelete } from "@/shared/api/put-or-delete";
import type {
  Feature,
  FeatureEpicAssignment,
  FeatureSummary,
  FeatureUpdate,
  NewFeature,
} from "../model/types/feature.types";

type Schemas = components["schemas"];
type FeatureDto = Schemas["FeatureResponseDto"];
type FeatureSummaryDto = Schemas["FeatureSummaryResponseDto"];
type FeatureListParams = NonNullable<paths["/api/v1/features"]["get"]["parameters"]["query"]>;

const FEATURES_PATH = "/api/v1/features" satisfies keyof paths;

function featurePath(featureId: string) {
  return fillPath("/api/v1/features/{featureId}", { featureId });
}

function featureEpicPath(featureId: string) {
  return fillPath("/api/v1/features/{featureId}/epic", { featureId });
}

function toFeatureSummary(dto: FeatureSummaryDto): FeatureSummary {
  return {
    id: dto.feature_id,
    projectId: dto.project_id,
    epicId: dto.epic_id,
    title: dto.title,
    progress: dto.progress,
    state: dto.state,
    cardCount: dto.card_count,
  };
}

function toFeature(dto: FeatureDto): Feature {
  return { ...toFeatureSummary(dto), description: dto.description };
}

export async function listFeatures(projectId: string): Promise<FeatureSummary[]> {
  const params: FeatureListParams = { project_id: projectId };
  const response = await api.get<FeatureSummaryDto[]>(FEATURES_PATH, { params });

  return response.data.map(toFeatureSummary);
}

export async function listBoardFeatures(boardId: string): Promise<FeatureSummary[]> {
  const response = await api.get<FeatureSummaryDto[]>(
    fillPath("/api/v1/boards/{boardId}/features", { boardId })
  );

  return response.data.map(toFeatureSummary);
}

export async function getFeature(featureId: string): Promise<Feature> {
  const response = await api.get<FeatureDto>(featurePath(featureId));

  return toFeature(response.data);
}

export async function createFeature(feature: NewFeature): Promise<Feature> {
  const payload: Schemas["CreateFeatureRequestDto"] = {
    project_id: feature.projectId,
    title: feature.title,
    description: feature.description,
    epic_id: feature.epicId,
  };
  const response = await api.post<FeatureDto>(FEATURES_PATH, payload);

  return toFeature(response.data);
}

export async function updateFeature({ featureId, ...text }: FeatureUpdate): Promise<Feature> {
  const payload: Schemas["UpdateFeatureRequestDto"] = text;
  const response = await api.patch<FeatureDto>(featurePath(featureId), payload);

  return toFeature(response.data);
}

export async function deleteFeature(featureId: string): Promise<void> {
  await api.delete(featurePath(featureId));
}

export function setFeatureEpic({ featureId, epicId }: FeatureEpicAssignment): Promise<void> {
  const payload: Schemas["SetFeatureEpicRequestDto"] | null =
    epicId === null ? null : { epic_id: epicId };

  return putOrDelete(featureEpicPath(featureId), payload);
}
