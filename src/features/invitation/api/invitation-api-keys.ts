export const invitationKeys = {
  all: ["invitation"] as const,
  preview: (token: string | null) => [...invitationKeys.all, "preview", token] as const,
  pending: () => [...invitationKeys.all, "pending"] as const,
};
