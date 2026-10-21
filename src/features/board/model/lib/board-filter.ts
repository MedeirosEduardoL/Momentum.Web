import type { BoardFilter, BoardFilterOptions } from "../types/board.types";

export const NO_FILTER: BoardFilter = {
  cardTypes: [],
  priorities: [],
  assigneeIds: [],
  featureIds: [],
  epicIds: [],
};

function keepExisting(ids: string[], existingIds: string[]) {
  return ids.filter(id => existingIds.includes(id));
}

export function keepExistingReferences(
  filter: BoardFilter,
  { team, features, epics }: BoardFilterOptions
): BoardFilter {
  const teamIds = team.map(member => member.userId);
  const featureIds = features.map(feature => feature.id);
  const epicIds = epics.map(epic => epic.id);

  return {
    ...filter,
    assigneeIds: keepExisting(filter.assigneeIds, teamIds),
    featureIds: keepExisting(filter.featureIds, featureIds),
    epicIds: keepExisting(filter.epicIds, epicIds),
  };
}

function countReferences({ assigneeIds, featureIds, epicIds }: BoardFilter) {
  return assigneeIds.length + featureIds.length + epicIds.length;
}

export function hasMissingReferences(filter: BoardFilter, options: BoardFilterOptions) {
  return countReferences(keepExistingReferences(filter, options)) < countReferences(filter);
}
