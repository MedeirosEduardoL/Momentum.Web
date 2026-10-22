import type { GroupsView } from "@/features/feature";

type SecondaryView = Exclude<GroupsView, "features">;

export type GroupsSearch = {
  visao?: SecondaryView;
};

const SECONDARY_VIEWS: Record<SecondaryView, true> = { epics: true, hierarquia: true };

function isSecondaryView(value: unknown): value is SecondaryView {
  return typeof value === "string" && Object.hasOwn(SECONDARY_VIEWS, value);
}

export function toGroupsSearch(search: Record<string, unknown>): GroupsSearch {
  return { visao: isSecondaryView(search.visao) ? search.visao : undefined };
}

export function toGroupsView(search: GroupsSearch): GroupsView {
  return search.visao ?? "features";
}

export function fromGroupsView(view: GroupsView): GroupsSearch {
  return { visao: view === "features" ? undefined : view };
}
