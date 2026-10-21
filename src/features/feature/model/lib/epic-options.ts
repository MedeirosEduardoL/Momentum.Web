import type { SelectOption } from "@/shared/ui/select-field";
import type { EpicSummary } from "../types/feature.types";

export const NO_EPIC = "";

export const NO_EPIC_OPTION: SelectOption = { value: NO_EPIC, label: "Sem epic" };

export function toEpicOptions(epics: EpicSummary[]): SelectOption[] {
  return epics.map(epic => ({ value: epic.id, label: epic.title }));
}
