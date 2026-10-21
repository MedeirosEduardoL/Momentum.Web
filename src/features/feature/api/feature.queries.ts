import { useQuery } from "@tanstack/react-query";
import { getEpic, listEpics } from "./epic.service";
import { featureKeys } from "./feature-api-keys";
import { getFeature, listFeatures } from "./feature.service";

const DERIVED_FROM_CARDS_STALE_TIME = 0;

export function useListFeatures(projectId: string) {
  return useQuery({
    queryKey: featureKeys.list(projectId),
    queryFn: () => listFeatures(projectId),
    staleTime: DERIVED_FROM_CARDS_STALE_TIME,
  });
}

export function useGetFeature(featureId: string) {
  return useQuery({
    queryKey: featureKeys.byId(featureId),
    queryFn: () => getFeature(featureId),
    staleTime: DERIVED_FROM_CARDS_STALE_TIME,
  });
}

export function useListEpics(projectId: string) {
  return useQuery({
    queryKey: featureKeys.epics(projectId),
    queryFn: () => listEpics(projectId),
    staleTime: DERIVED_FROM_CARDS_STALE_TIME,
  });
}

export function useGetEpic(epicId: string) {
  return useQuery({
    queryKey: featureKeys.epicById(epicId),
    queryFn: () => getEpic(epicId),
    staleTime: DERIVED_FROM_CARDS_STALE_TIME,
  });
}
