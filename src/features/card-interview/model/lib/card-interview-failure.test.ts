import { describe, expect, it } from "vitest";
import { apiError } from "@/test/api-errors";
import {
  areRoundAttemptsExhausted,
  isInterviewNotEnabled,
  isProposalOutdated,
  isRoundLimitReached,
} from "./card-interview-failure";

describe("recusas do Core reconhecidas pelo código", () => {
  it.each([
    [isInterviewNotEnabled, "InterviewNotEnabled"],
    [isRoundLimitReached, "InterviewRoundLimitReached"],
    [areRoundAttemptsExhausted, "InterviewRoundAttemptsExhausted"],
    [isProposalOutdated, "InterviewProposalOutdated"],
  ])("%o reconhece %s e só ele", (recognizes, code) => {
    expect(recognizes(apiError(422, code, "Recusa do Core."))).toBe(true);
    expect(recognizes(apiError(422, "InterviewClosed", "Esta entrevista já foi encerrada."))).toBe(
      false
    );
    expect(recognizes(null)).toBe(false);
  });
});
