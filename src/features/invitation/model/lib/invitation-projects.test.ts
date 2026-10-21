import { describe, expect, it } from "vitest";
import type { Project } from "@/features/project";
import {
  describeInvitationProjects,
  toDefaultProjectRoles,
  toInvitationProjects,
} from "./invitation-projects";

const momentum: Project = { id: "project-1", name: "Momentum", key: "MOM", role: "administrator" };
const support: Project = { id: "project-2", name: "Suporte", key: "SUP", role: "administrator" };

describe("toDefaultProjectRoles", () => {
  it("começa com a pessoa fora do time de todos os projetos", () => {
    expect(toDefaultProjectRoles([momentum, support])).toEqual({
      "project-1": "none",
      "project-2": "none",
    });
  });
});

describe("toInvitationProjects", () => {
  it("leva para o convite só os projetos em que a pessoa entra no time", () => {
    const projects = toInvitationProjects({
      "project-1": "administrator",
      "project-2": "none",
      "project-3": "member",
    });

    expect(projects).toEqual([
      { projectId: "project-1", role: "administrator" },
      { projectId: "project-3", role: "member" },
    ]);
  });

  it("devolve lista vazia quando a pessoa não entra em nenhum time", () => {
    expect(toInvitationProjects({ "project-1": "none" })).toEqual([]);
  });
});

describe("describeInvitationProjects", () => {
  it("escreve cada projeto do convite com o papel nele", () => {
    const description = describeInvitationProjects(
      [
        { projectId: "project-1", role: "administrator" },
        { projectId: "project-2", role: "member" },
      ],
      [momentum, support]
    );

    expect(description).toBe("Momentum (Administrador do projeto), Suporte (Membro)");
  });

  it("diz que o convite não tem projeto", () => {
    expect(describeInvitationProjects([], [momentum])).toBe("Sem projeto");
  });

  it("deixa de fora o projeto que não está mais na lista", () => {
    const description = describeInvitationProjects(
      [
        { projectId: "project-1", role: "member" },
        { projectId: "project-9", role: "member" },
      ],
      [momentum]
    );

    expect(description).toBe("Momentum (Membro)");
  });
});
