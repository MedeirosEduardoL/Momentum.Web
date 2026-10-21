import { useQuery } from "@tanstack/react-query";
import { cardBriefKeys } from "./card-brief-api-keys";
import { getCardBrief } from "./card-brief.service";

export function useGetCardBrief(cardId: string) {
  return useQuery({
    queryKey: cardBriefKeys.byCard(cardId),
    queryFn: () => getCardBrief(cardId),
  });
}
