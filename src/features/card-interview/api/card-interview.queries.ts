import { useQuery } from "@tanstack/react-query";
import { cardInterviewKeys } from "./card-interview-api-keys";
import { listCardInterviewProposals } from "./card-interview-proposal.service";
import { getCardInterview, listCardInterviews } from "./card-interview.service";

export function useListCardInterviews(cardId: string) {
  return useQuery({
    queryKey: cardInterviewKeys.byCard(cardId),
    queryFn: () => listCardInterviews(cardId),
  });
}

export function useGetCardInterview(interviewId: string) {
  return useQuery({
    queryKey: cardInterviewKeys.byId(interviewId),
    queryFn: () => getCardInterview(interviewId),
  });
}

export function useListCardInterviewProposals(interviewId: string) {
  return useQuery({
    queryKey: cardInterviewKeys.proposals(interviewId),
    queryFn: () => listCardInterviewProposals(interviewId),
  });
}
