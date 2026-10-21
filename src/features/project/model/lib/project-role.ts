import type { SelectOption } from "@/shared/ui/select-field";
import type { Project, ProjectRole } from "../types/project.types";

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  administrator: "Administrador do projeto",
  member: "Membro",
};

export const PROJECT_ROLE_OPTIONS: SelectOption<ProjectRole>[] = [
  { value: "member", label: PROJECT_ROLE_LABELS.member },
  { value: "administrator", label: PROJECT_ROLE_LABELS.administrator },
];

export function canAdministerProject(project: Project) {
  return project.role === "administrator";
}
