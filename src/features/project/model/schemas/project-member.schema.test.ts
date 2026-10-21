import { describe, expect, it } from "vitest";
import { projectMemberSchema } from "./project-member.schema";

describe("projectMemberSchema", () => {
  it.each(["member", "administrator"])("aceita a pessoa escolhida com o papel %j", role => {
    expect(projectMemberSchema.safeParse({ userId: "user-2", role }).success).toBe(true);
  });

  it("exige a escolha de uma pessoa", () => {
    const result = projectMemberSchema.safeParse({ userId: "", role: "member" });

    expect(result.error?.issues[0].message).toBe("Escolha quem entra no time.");
  });

  it("recusa papel que não existe no projeto", () => {
    expect(projectMemberSchema.safeParse({ userId: "user-2", role: "owner" }).success).toBe(false);
  });
});
