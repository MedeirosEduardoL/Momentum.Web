import { describe, expect, it } from "vitest";
import type { Project } from "../types/project.types";
import { canAdministerProject, PROJECT_ROLE_LABELS, PROJECT_ROLE_OPTIONS } from "./project-role";

const project: Project = { id: "project-1", name: "Momentum", key: "MOM", role: "administrator" };

describe("canAdministerProject", () => {
  it("deixa cuidar do time quem tem o papel efetivo de administrador do projeto", () => {
    expect(canAdministerProject(project)).toBe(true);
  });

  it("não deixa o membro do time cuidar dele", () => {
    expect(canAdministerProject({ ...project, role: "member" })).toBe(false);
  });
});

describe("PROJECT_ROLE_OPTIONS", () => {
  it("oferece os dois papéis com o rótulo do glossário, começando pelo de menor poder", () => {
    expect(PROJECT_ROLE_OPTIONS).toEqual([
      { value: "member", label: "Membro" },
      { value: "administrator", label: "Administrador do projeto" },
    ]);
  });

  it("usa os mesmos rótulos das listas", () => {
    PROJECT_ROLE_OPTIONS.forEach(option =>
      expect(option.label).toBe(PROJECT_ROLE_LABELS[option.value])
    );
  });
});
