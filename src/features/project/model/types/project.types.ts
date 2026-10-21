import type { components } from "@/shared/api/generated/openapi";

export type ProjectRole = components["schemas"]["ProjectRole"];

export type Project = {
  id: string;
  name: string;
  key: string;
  role: ProjectRole;
};

export type NewProject = {
  name: string;
  key: string;
};

export type ProjectMember = {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
};

export type ProjectMemberRemoval = {
  projectId: string;
  userId: string;
};

export type ProjectMemberAssignment = ProjectMemberRemoval & {
  role: ProjectRole;
};
