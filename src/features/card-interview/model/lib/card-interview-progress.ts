import type {
  CardInterview,
  CardInterviewAnswer,
  CardInterviewRound,
  CardInterviewStep,
} from "../types/card-interview.types";

export const CARD_INTERVIEW_LIMITS = {
  rounds: 10,
  answer: 2000,
};

function isAwaitingAnswers(round: CardInterviewRound) {
  return round.questions.length > 0 && round.answers === null;
}

function hasAnswers(round: CardInterviewRound) {
  return round.answers !== null && round.answers.length > 0;
}

export function isLastRound(round: CardInterviewRound) {
  return round.number >= CARD_INTERVIEW_LIMITS.rounds;
}

export function nextInterviewStep(interview: CardInterview): CardInterviewStep {
  const lastRound = interview.rounds.at(-1);

  if (interview.isFinished) {
    return { kind: "finished" };
  }

  if (lastRound && isAwaitingAnswers(lastRound)) {
    return { kind: "answer", round: lastRound };
  }

  if (interview.rounds.length >= CARD_INTERVIEW_LIMITS.rounds) {
    return { kind: "round-limit" };
  }

  return { kind: "ask" };
}

export function listReadableRounds(interview: CardInterview, isConducting: boolean) {
  const step = nextInterviewStep(interview);
  const roundBeingAnswered = isConducting && step.kind === "answer" ? step.round : null;

  return interview.rounds.filter(
    round => round.questions.length > 0 && round !== roundBeingAnswered
  );
}

export function hasAnsweredRound(interview: CardInterview) {
  return interview.rounds.some(hasAnswers);
}

export function shouldRequestProposal(
  interview: CardInterview,
  answers: CardInterviewAnswer[],
  round: CardInterviewRound
) {
  return round.questions.length === 0 && (answers.length > 0 || hasAnsweredRound(interview));
}

export function findAnswer(round: CardInterviewRound, question: number) {
  return round.answers?.find(answer => answer.question === question)?.answer ?? null;
}
