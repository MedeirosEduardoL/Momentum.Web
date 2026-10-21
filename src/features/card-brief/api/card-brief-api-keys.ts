export const cardBriefKeys = {
  all: ["card-brief"] as const,
  byCard: (cardId: string) => [...cardBriefKeys.all, cardId] as const,
};
