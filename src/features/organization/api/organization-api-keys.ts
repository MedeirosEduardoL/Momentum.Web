export const organizationKeys = {
  all: ["organization"] as const,
  current: () => [...organizationKeys.all, "current"] as const,
  members: () => [...organizationKeys.all, "members"] as const,
};
