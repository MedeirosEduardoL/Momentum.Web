import type { BoardColumnTone } from "@/shared/ui/board-column";
import type { FeatureState } from "../types/feature.types";

export const GROUP_STATES: FeatureState[] = ["to_do", "in_progress", "done"];

export const GROUP_STATE_TONES: Record<FeatureState, BoardColumnTone> = {
  to_do: "neutral",
  in_progress: "info",
  done: "success",
};

export type GroupColumn<TGroup> = {
  state: FeatureState;
  groups: TGroup[];
};

export function toGroupColumns<TGroup extends { state: FeatureState }>(
  groups: TGroup[]
): GroupColumn<TGroup>[] {
  return GROUP_STATES.map(state => ({
    state,
    groups: groups.filter(group => group.state === state),
  }));
}
