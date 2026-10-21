import { describe, expect, it } from "vitest";
import { describeInvitationValidity } from "./invitation-validity";

const LOCAL_NOON = 12;
const expiresAt = new Date(2026, 9, 19, LOCAL_NOON);

function minutesFromExpiry(minutes: number) {
  return new Date(expiresAt.getTime() + minutes * 60_000);
}

describe("describeInvitationValidity", () => {
  it("diz até quando o convite vale", () => {
    expect(describeInvitationValidity(expiresAt.toISOString(), minutesFromExpiry(-1))).toBe(
      "Expira em 19/10/2026"
    );
  });

  it("diz que o convite expirou depois do prazo", () => {
    expect(describeInvitationValidity(expiresAt.toISOString(), minutesFromExpiry(1))).toBe(
      "Expirou em 19/10/2026"
    );
  });

  it("trata o instante exato do prazo como expirado", () => {
    expect(describeInvitationValidity(expiresAt.toISOString(), minutesFromExpiry(0))).toBe(
      "Expirou em 19/10/2026"
    );
  });
});
