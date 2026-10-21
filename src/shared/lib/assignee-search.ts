export const WITHOUT_ASSIGNEE_SEARCH = "nenhum";

type AssigneeChoice = {
  assigneeId?: string;
  isUnassigned?: boolean;
};

export function toAssigneeSearch({ assigneeId, isUnassigned }: AssigneeChoice) {
  return isUnassigned ? WITHOUT_ASSIGNEE_SEARCH : assigneeId;
}

export function fromAssigneeSearch(value?: string): AssigneeChoice {
  const isUnassigned = value === WITHOUT_ASSIGNEE_SEARCH;

  return { assigneeId: isUnassigned ? undefined : value, isUnassigned: isUnassigned || undefined };
}
