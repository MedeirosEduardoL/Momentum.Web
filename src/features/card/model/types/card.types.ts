import type { ProjectMember } from "@/features/project";
import type { components } from "@/shared/api/generated/openapi";

type Schemas = components["schemas"];

export type CardType = Schemas["CardType"];
export type CardPriority = Schemas["CardPriority"];
export type CardStateCategory = Schemas["CardStateCategory"];
export type IssueSeverity = Schemas["IssueSeverity"];
export type CardTaskState = Schemas["CardTaskState"];
export type CardTaskKind = Schemas["CardTaskKind"];
export type CardRelationKind = Schemas["CardRelationKind"];

export type CardState = {
  id: string;
  name: string;
  category: CardStateCategory;
  position: number;
};

export type CardStateDraft = {
  projectId: string;
  name: string;
  category: CardStateCategory;
};

export type CardStateUpdate = {
  cardStateId: string;
  name?: string;
  category?: CardStateCategory;
  position?: number;
};

export type CardAssignee = {
  userId: string;
  name: string;
};

export type UserStoryFields = {
  type: "user_story";
  acceptanceCriteria: string[];
};

export type SpikeFields = {
  type: "spike";
  question: string;
  deadline: string | null;
  conclusion: string;
};

export type IssueFields = {
  type: "issue";
  stepsToReproduce: string;
  expectedBehavior: string;
  observedBehavior: string;
  severity: IssueSeverity | null;
  location: string;
};

export type TechDebtFields = {
  type: "tech_debt";
  impact: string;
};

export type CardTypeFields = UserStoryFields | SpikeFields | IssueFields | TechDebtFields;

export type CardSubitemCount = {
  total: number;
  done: number;
};

export type CardSubitemCounts = Record<CardTaskKind, CardSubitemCount>;

export type CardSummary = {
  id: string;
  projectId: string;
  identifier: string;
  type: CardType;
  title: string;
  state: CardState;
  priority: CardPriority;
  assignee: CardAssignee | null;
  featureId: string | null;
  progress: number;
  taskCount: number;
  doneTaskCount: number;
  subitemCounts: CardSubitemCounts;
  isArchived: boolean;
  updatedAt: string;
};

export type Card = CardSummary & {
  description: string;
  fields: CardTypeFields;
  createdAt: string;
};

export type CardListFilters = {
  type?: CardType;
  stateId?: string;
  assigneeId?: string;
  isUnassigned?: boolean;
  featureId?: string;
  includesArchived: boolean;
  page: number;
};

export type CardAssigneeFilter = Pick<CardListFilters, "assigneeId" | "isUnassigned">;

export type CardListQuery = CardListFilters & {
  projectId: string;
  search?: string;
};

export type CardPage = {
  cards: CardSummary[];
  page: number;
  totalPages: number;
};

export type CardLaneCell = {
  state: CardState;
  cards: CardSummary[];
};

export type CardStateColumn = CardLaneCell & {
  totalCount: number;
};

export type CardLane = {
  id: string;
  title: string | null;
  assignee?: CardAssignee | null;
  cells: CardLaneCell[];
};

export type CardLaneGrouping = CardAssigneeFilter & {
  team: CardAssignee[];
  savedAssigneeIds?: string[];
};

export type CardPlace = {
  cardStateId: string;
  assignee?: CardAssignee | null;
};

export type CardMove = CardPlace & {
  cardId: string;
};

export type CardMoveHandler = (card: CardSummary, place: CardPlace) => void;

export type SavedCardFilter = {
  cardTypes: CardType[];
  priorities: CardPriority[];
  assigneeIds: string[];
  featureIds: string[];
};

export type QuickCardDefaults = {
  cardType: CardType;
  cardStateId: string;
  priority: CardPriority;
  assigneeId: string;
  featureId: string;
};

export type CardOptions = {
  states: CardState[];
  team: ProjectMember[];
};

export type NewCard = {
  projectId: string;
  title: string;
  description: string;
  cardStateId: string | null;
  priority: CardPriority;
  assigneeId: string | null;
  featureId: string | null;
  fields: CardTypeFields;
};

export type CardChanges = {
  title?: string;
  description?: string;
  cardStateId?: string;
  priority?: CardPriority;
  isArchived?: boolean;
  fields?: CardTypeFields;
};

export type CardUpdate = CardChanges & {
  cardId: string;
  expectedUpdatedAt?: string;
};

export type CardAssignment = {
  cardId: string;
  userId: string | null;
};

export type CardFeatureAssignment = {
  cardId: string;
  featureId: string | null;
};

export type CardTask = {
  id: string;
  cardId: string;
  kind: CardTaskKind;
  title: string;
  description: string;
  state: CardTaskState;
  assignee: CardAssignee | null;
  updatedAt: string;
};

export type NewCardTask = {
  cardId: string;
  kind: CardTaskKind;
  title: string;
  assigneeId: string | null;
};

export type CardTaskChanges = {
  cardTaskId: string;
  title?: string;
  description?: string;
  state?: CardTaskState;
  expectedUpdatedAt?: string;
};

export type CardTaskAssignment = {
  cardTaskId: string;
  userId: string | null;
};

export type RelatedCard = {
  id: string;
  identifier: string;
  type: CardType;
  title: string;
  stateName: string;
};

export type CardRelation = {
  id: string;
  relation: CardRelationKind;
  card: RelatedCard;
};

export type NewCardRelation = {
  cardId: string;
  relatedCardId: string;
  relation: CardRelationKind;
};
