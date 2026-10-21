import { hasErrorCode } from "@/shared/api/api-error";

const CHANGED_MEANWHILE = "CardChangedMeanwhile";
const TASK_CHANGED_MEANWHILE = "CardTaskChangedMeanwhile";
const ASSIGNEE_OUTSIDE_PROJECT = "CardAssigneeOutsideProject";
const FEATURE_INVALID = "CardFeatureInvalid";

export function wasCardChangedMeanwhile(error: unknown) {
  return hasErrorCode(error, CHANGED_MEANWHILE);
}

export function wasCardTaskChangedMeanwhile(error: unknown) {
  return hasErrorCode(error, TASK_CHANGED_MEANWHILE);
}

export function isAssigneeOutsideProject(error: unknown) {
  return hasErrorCode(error, ASSIGNEE_OUTSIDE_PROJECT);
}

export function isFeatureOutsideProject(error: unknown) {
  return hasErrorCode(error, FEATURE_INVALID);
}
