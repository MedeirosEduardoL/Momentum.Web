import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEpic, deleteEpic, updateEpic } from "./epic.service";
import { featureKeys } from "./feature-api-keys";
import { createFeature, deleteFeature, setFeatureEpic, updateFeature } from "./feature.service";

function useRefreshFeatures() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: featureKeys.all });
}

export function useCreateFeatureMutation() {
  const refreshFeatures = useRefreshFeatures();

  return useMutation({ mutationFn: createFeature, onSettled: refreshFeatures });
}

export function useUpdateFeatureMutation() {
  const refreshFeatures = useRefreshFeatures();

  return useMutation({ mutationFn: updateFeature, onSettled: refreshFeatures });
}

export function useSetFeatureEpicMutation() {
  const refreshFeatures = useRefreshFeatures();

  return useMutation({ mutationFn: setFeatureEpic, onSettled: refreshFeatures });
}

export function useDeleteFeatureMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFeature,
    onSuccess: (_nothing, featureId) =>
      queryClient.removeQueries({ queryKey: featureKeys.byId(featureId) }),
    onSettled: () => queryClient.invalidateQueries(),
  });
}

export function useCreateEpicMutation() {
  const refreshFeatures = useRefreshFeatures();

  return useMutation({ mutationFn: createEpic, onSettled: refreshFeatures });
}

export function useUpdateEpicMutation() {
  const refreshFeatures = useRefreshFeatures();

  return useMutation({ mutationFn: updateEpic, onSettled: refreshFeatures });
}

export function useDeleteEpicMutation() {
  const queryClient = useQueryClient();
  const refreshFeatures = useRefreshFeatures();

  return useMutation({
    mutationFn: deleteEpic,
    onSuccess: (_nothing, epicId) =>
      queryClient.removeQueries({ queryKey: featureKeys.epicById(epicId) }),
    onSettled: refreshFeatures,
  });
}
