import { WITHOUT_ASSIGNEE_SEARCH } from "@/shared/lib/assignee-search";

const ID_PATTERN = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function readId(value: unknown) {
  return typeof value === "string" && ID_PATTERN.test(value) ? value : undefined;
}

export function readAssigneeSearch(value: unknown) {
  return value === WITHOUT_ASSIGNEE_SEARCH ? WITHOUT_ASSIGNEE_SEARCH : readId(value);
}
