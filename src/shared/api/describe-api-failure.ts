import { formatWaitTime } from "@/shared/lib/format-wait-time";
import { getApiErrorMessage, getRetryAfterSeconds } from "./api-error";

export function describeApiFailure(error: unknown) {
  const message = getApiErrorMessage(error);
  const waitInSeconds = getRetryAfterSeconds(error);

  return waitInSeconds === null
    ? message
    : `${message} Disponível de novo em ${formatWaitTime(waitInSeconds)}.`;
}
