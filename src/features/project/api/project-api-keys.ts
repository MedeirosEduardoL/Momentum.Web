export const projectKeys = {
  all: ["project"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  members: (projectId: string) => [...projectKeys.all, "members", projectId] as const,
};
