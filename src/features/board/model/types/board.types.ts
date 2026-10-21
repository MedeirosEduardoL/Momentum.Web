import type { CardPriority, CardStateColumn, CardType } from "@/features/card";
import type { EpicSummary, FeatureSummary } from "@/features/feature";
import type { ProjectMember } from "@/features/project";

export type BoardFilter = {
  cardTypes: CardType[];
  priorities: CardPriority[];
  assigneeIds: string[];
  featureIds: string[];
  epicIds: string[];
};

export type BoardDefinition = {
  name: string;
  filter: BoardFilter;
};

export type Board = BoardDefinition & {
  id: string;
  projectId: string;
};

export type NewBoard = BoardDefinition & {
  projectId: string;
};

export type BoardUpdate = BoardDefinition & {
  boardId: string;
};

export type BoardView = {
  boardId?: string;
  assigneeId?: string;
  isUnassigned?: boolean;
  isGroupedByAssignee: boolean;
};

export type BoardAssigneeView = Pick<BoardView, "assigneeId" | "isUnassigned">;

export type BoardColumnsQuery = BoardAssigneeView & {
  boardId: string;
};

export type BoardColumns = {
  columns: CardStateColumn[];
  savedFilter: BoardFilter;
  reload: () => Promise<CardStateColumn[] | undefined>;
};

export type BoardFilterOptions = {
  team: ProjectMember[];
  features: FeatureSummary[];
  epics: EpicSummary[];
};
