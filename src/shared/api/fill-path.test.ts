import { describe, expect, it } from "vitest";
import { fillPath } from "./fill-path";

describe("fillPath", () => {
  it("troca cada parâmetro do caminho do contrato pelo valor", () => {
    const path = fillPath("/api/v1/projects/{projectId}/members/{userId}", {
      projectId: "project-1",
      userId: "user-1",
    });

    expect(path).toBe("/api/v1/projects/project-1/members/user-1");
  });

  it("escapa o valor para ele não mudar o caminho", () => {
    const path = fillPath("/api/v1/invitations/{invitationId}", {
      invitationId: "../accounts/me?x=1",
    });

    expect(path).toBe("/api/v1/invitations/..%2Faccounts%2Fme%3Fx%3D1");
  });
});
