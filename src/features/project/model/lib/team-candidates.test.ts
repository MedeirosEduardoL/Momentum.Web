import { describe, expect, it } from "vitest";
import type { OrganizationMember } from "@/features/organization";
import type { ProjectMember } from "../types/project.types";
import { listTeamCandidates } from "./team-candidates";

const ana: OrganizationMember = {
  userId: "user-1",
  name: "Ana Souza",
  email: "ana@exemplo.test",
  role: "administrator",
  isAiEnabled: false,
};
const bia: OrganizationMember = {
  userId: "user-2",
  name: "Bia Lima",
  email: "bia@exemplo.test",
  role: "member",
  isAiEnabled: false,
};
const anaInTeam: ProjectMember = { ...ana, role: "administrator" };

describe("listTeamCandidates", () => {
  it("oferece só quem é da organização e ainda não está no time", () => {
    expect(listTeamCandidates([ana, bia], [anaInTeam])).toEqual([bia]);
  });

  it("oferece todos os membros da organização quando o time está vazio", () => {
    expect(listTeamCandidates([ana, bia], [])).toEqual([ana, bia]);
  });

  it("não oferece ninguém quando todos já estão no time", () => {
    expect(listTeamCandidates([ana], [anaInTeam])).toEqual([]);
  });
});
