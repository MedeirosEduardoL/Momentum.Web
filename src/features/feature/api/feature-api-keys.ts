export const featureKeys = {
  all: ["feature"] as const,
  list: (projectId: string) => [...featureKeys.all, "list", projectId] as const,
  byId: (featureId: string) => [...featureKeys.all, "detail", featureId] as const,
  epics: (projectId: string) => [...featureKeys.all, "epics", projectId] as const,
  epicById: (epicId: string) => [...featureKeys.all, "epic", epicId] as const,
};
