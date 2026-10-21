import { formatDate } from "@/shared/lib/format-date";

export function describeInvitationValidity(expiresAt: string, now: Date) {
  const hasExpired = new Date(expiresAt) <= now;

  return `${hasExpired ? "Expirou" : "Expira"} em ${formatDate(expiresAt)}`;
}
