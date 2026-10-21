import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cardInterviewKeys } from "./card-interview-api-keys";
import {
  decideCardInterviewProposal,
  requestCardInterviewProposal,
} from "./card-interview-proposal.service";
import {
  askCardInterviewRound,
  closeCardInterview,
  startCardInterview,
} from "./card-interview.service";

function useRefreshCardInterviews() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: cardInterviewKeys.all });
}

export function useStartCardInterviewMutation() {
  const refreshCardInterviews = useRefreshCardInterviews();

  return useMutation({ mutationFn: startCardInterview, onSettled: refreshCardInterviews });
}

export function useCloseCardInterviewMutation() {
  const refreshCardInterviews = useRefreshCardInterviews();

  return useMutation({ mutationFn: closeCardInterview, onSettled: refreshCardInterviews });
}

export function useAskCardInterviewRoundMutation() {
  const refreshCardInterviews = useRefreshCardInterviews();

  return useMutation({ mutationFn: askCardInterviewRound, onSettled: refreshCardInterviews });
}

export function useRequestCardInterviewProposalMutation() {
  const refreshCardInterviews = useRefreshCardInterviews();

  return useMutation({
    mutationFn: requestCardInterviewProposal,
    onSettled: refreshCardInterviews,
  });
}

export function useDecideCardInterviewProposalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: decideCardInterviewProposal,
    onSettled: () => queryClient.invalidateQueries(),
  });
}
