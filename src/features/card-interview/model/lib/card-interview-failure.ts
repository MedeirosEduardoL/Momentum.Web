import { hasErrorCode } from "@/shared/api/api-error";

const NOT_ENABLED = "InterviewNotEnabled";
const ROUND_LIMIT_REACHED = "InterviewRoundLimitReached";
const ROUND_ATTEMPTS_EXHAUSTED = "InterviewRoundAttemptsExhausted";
const PROPOSAL_OUTDATED = "InterviewProposalOutdated";

export function isInterviewNotEnabled(error: unknown) {
  return hasErrorCode(error, NOT_ENABLED);
}

export function isRoundLimitReached(error: unknown) {
  return hasErrorCode(error, ROUND_LIMIT_REACHED);
}

export function areRoundAttemptsExhausted(error: unknown) {
  return hasErrorCode(error, ROUND_ATTEMPTS_EXHAUSTED);
}

export function isProposalOutdated(error: unknown) {
  return hasErrorCode(error, PROPOSAL_OUTDATED);
}
