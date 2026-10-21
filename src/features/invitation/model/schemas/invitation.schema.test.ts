import { describe, expect, it } from "vitest";
import { invitationSchema } from "./invitation.schema";

const validValues = {
  email: " Bia@Exemplo.Test ",
  role: "member",
  projectRoles: { "project-1": "administrator", "project-2": "none" },
};

describe("invitationSchema", () => {
  it("normaliza o e-mail e mantém o papel na organização e em cada projeto", () => {
    expect(invitationSchema.parse(validValues)).toEqual({
      email: "bia@exemplo.test",
      role: "member",
      projectRoles: { "project-1": "administrator", "project-2": "none" },
    });
  });

  it("aceita o convite sem nenhum projeto", () => {
    expect(invitationSchema.safeParse({ ...validValues, projectRoles: {} }).success).toBe(true);
  });

  it.each(["", "bia", "bia@", "@exemplo.test"])("recusa o e-mail %j", email => {
    const result = invitationSchema.safeParse({ ...validValues, email });

    expect(result.error?.issues[0].message).toBe("Informe um e-mail válido.");
  });

  it("recusa papel que não existe na organização", () => {
    expect(invitationSchema.safeParse({ ...validValues, role: "owner" }).success).toBe(false);
  });

  it("recusa papel que não existe no projeto", () => {
    const result = invitationSchema.safeParse({
      ...validValues,
      projectRoles: { "project-1": "owner" },
    });

    expect(result.success).toBe(false);
  });
});
