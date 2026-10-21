import { api } from "@/shared/api/client";
import { fillPath } from "@/shared/api/fill-path";
import type { components, paths } from "@/shared/api/generated/openapi";
import type {
  NewProject,
  Project,
  ProjectMember,
  ProjectMemberAssignment,
  ProjectMemberRemoval,
} from "../model/types/project.types";

type Schemas = components["schemas"];
type ProjectDto = Schemas["ProjectResponseDto"];
type ProjectMemberDto = Schemas["ProjectMemberResponseDto"];

const PROJECTS_PATH = "/api/v1/projects" satisfies keyof paths;

function memberPath({ projectId, userId }: ProjectMemberRemoval) {
  return fillPath("/api/v1/projects/{projectId}/members/{userId}", { projectId, userId });
}

function toProject(dto: ProjectDto): Project {
  return { id: dto.project_id, name: dto.name, key: dto.key, role: dto.role };
}

function toProjectMember(dto: ProjectMemberDto): ProjectMember {
  return { userId: dto.user_id, name: dto.name, email: dto.email, role: dto.role };
}

export async function listProjects(): Promise<Project[]> {
  const response = await api.get<ProjectDto[]>(PROJECTS_PATH);
  return response.data.map(toProject);
}

export async function createProject(project: NewProject): Promise<Project> {
  const payload: Schemas["CreateProjectRequestDto"] = project;
  const response = await api.post<ProjectDto>(PROJECTS_PATH, payload);

  return toProject(response.data);
}

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const response = await api.get<ProjectMemberDto[]>(
    fillPath("/api/v1/projects/{projectId}/members", { projectId })
  );

  return response.data.map(toProjectMember);
}

export async function setProjectMember({
  role,
  ...member
}: ProjectMemberAssignment): Promise<void> {
  const payload: Schemas["SetProjectMemberRequestDto"] = { role };

  await api.put(memberPath(member), payload);
}

export async function removeProjectMember(member: ProjectMemberRemoval): Promise<void> {
  await api.delete(memberPath(member));
}
