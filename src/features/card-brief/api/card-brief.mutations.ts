import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cardBriefKeys } from "./card-brief-api-keys";
import { generateCardBrief } from "./card-brief.service";

export function useGenerateCardBriefMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateCardBrief,
    onSettled: (_brief, _error, cardId) =>
      queryClient.invalidateQueries({ queryKey: cardBriefKeys.byCard(cardId) }),
  });
}
