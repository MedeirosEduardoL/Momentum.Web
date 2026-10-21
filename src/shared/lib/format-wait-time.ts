import { formatCount } from "./format-count";

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

export function formatWaitTime(seconds: number) {
  const wholeSeconds = Math.max(1, Math.ceil(seconds));

  if (wholeSeconds < SECONDS_PER_MINUTE) {
    return formatCount(wholeSeconds, "segundo");
  }

  const minutes = Math.ceil(wholeSeconds / SECONDS_PER_MINUTE);

  if (minutes < MINUTES_PER_HOUR) {
    return formatCount(minutes, "minuto");
  }

  const hours = Math.ceil(minutes / MINUTES_PER_HOUR);

  if (hours < HOURS_PER_DAY) {
    return formatCount(hours, "hora");
  }

  return formatCount(Math.ceil(hours / HOURS_PER_DAY), "dia");
}
