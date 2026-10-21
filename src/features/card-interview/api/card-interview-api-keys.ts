export const cardInterviewKeys = {
  all: ["card-interview"] as const,
  byCard: (cardId: string) => [...cardInterviewKeys.all, "list", cardId] as const,
  byId: (interviewId: string) => [...cardInterviewKeys.all, "detail", interviewId] as const,
  proposals: (interviewId: string) => [...cardInterviewKeys.all, "proposals", interviewId] as const,
};
