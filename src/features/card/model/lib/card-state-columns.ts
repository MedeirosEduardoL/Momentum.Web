import { formatCount } from "@/shared/lib/format-count";
import type {
  CardAssignee,
  CardLane,
  CardLaneGrouping,
  CardMove,
  CardPlace,
  CardStateColumn,
  CardSummary,
} from "../types/card.types";
import { NO_ASSIGNEE, NO_ASSIGNEE_OPTION } from "./card-options";

const UNGROUPED_LANE = "all";
const NAME_LOCALE = "pt-BR";

function assigneeIdOf(card: CardSummary) {
  return card.assignee?.userId ?? NO_ASSIGNEE;
}

function withoutCard(column: CardStateColumn, cardId: string): CardStateColumn {
  return {
    ...column,
    totalCount: column.totalCount - 1,
    cards: column.cards.filter(card => card.id !== cardId),
  };
}

function withCardOnTop(column: CardStateColumn, card: CardSummary): CardStateColumn {
  return {
    ...column,
    totalCount: column.totalCount + 1,
    cards: [{ ...card, state: column.state }, ...column.cards],
  };
}

export function changesAssignee(card: CardSummary, place: CardPlace) {
  return place.assignee !== undefined && place.assignee?.userId !== card.assignee?.userId;
}

export function changesPlace(card: CardSummary, place: CardPlace) {
  return card.state.id !== place.cardStateId || changesAssignee(card, place);
}

function assigneeAfter(card: CardSummary, place: CardPlace) {
  return place.assignee === undefined ? card.assignee : place.assignee;
}

export function moveCard(columns: CardStateColumn[], move: CardMove | null): CardStateColumn[] {
  const card = columns.flatMap(column => column.cards).find(shown => shown.id === move?.cardId);
  const destination = columns.find(column => column.state.id === move?.cardStateId);

  if (!move || !card || !destination || !changesPlace(card, move)) {
    return columns;
  }

  const movedCard = { ...card, assignee: assigneeAfter(card, move) };

  return columns.map(column => {
    const remaining = column.state.id === card.state.id ? withoutCard(column, card.id) : column;

    return column === destination ? withCardOnTop(remaining, movedCard) : remaining;
  });
}

export function containsCard(columns: CardStateColumn[], cardId: string) {
  return columns.some(column => column.cards.some(shown => shown.id === cardId));
}

export function isTruncated(column: CardStateColumn) {
  return column.totalCount > column.cards.length;
}

export function describeColumnCount(column: CardStateColumn) {
  const total = formatCount(column.totalCount, "card");

  return isTruncated(column) ? `${column.cards.length} de ${total}` : total;
}

function countLaneCards(lane: CardLane) {
  return lane.cells.reduce((count, cell) => count + cell.cards.length, 0);
}

export function describeLaneCount(lane: CardLane) {
  return formatCount(countLaneCards(lane), "card");
}

function listCardAssignees(columns: CardStateColumn[]): CardAssignee[] {
  return columns
    .flatMap(column => column.cards)
    .flatMap(card => (card.assignee ? [card.assignee] : []));
}

function chosenAssigneeIds({ assigneeId, savedAssigneeIds = [] }: CardLaneGrouping) {
  return assigneeId ? [assigneeId] : savedAssigneeIds;
}

function filterTeam(grouping: CardLaneGrouping): CardAssignee[] {
  if (grouping.isUnassigned) {
    return [];
  }

  const chosenIds = chosenAssigneeIds(grouping);

  return chosenIds.length > 0
    ? grouping.team.filter(member => chosenIds.includes(member.userId))
    : grouping.team;
}

function showsNoAssigneeLane(grouping: CardLaneGrouping) {
  return grouping.isUnassigned || chosenAssigneeIds(grouping).length === 0;
}

function listAssignees(columns: CardStateColumn[], grouping: CardLaneGrouping): CardAssignee[] {
  const assignees = [...filterTeam(grouping), ...listCardAssignees(columns)];
  const assigneeById = new Map(assignees.map(assignee => [assignee.userId, assignee]));

  return [...assigneeById.values()].sort((one, other) =>
    one.name.localeCompare(other.name, NAME_LOCALE)
  );
}

function toAssigneeLane(columns: CardStateColumn[], assignee: CardAssignee | null): CardLane {
  const id = assignee?.userId ?? NO_ASSIGNEE;

  return {
    id,
    title: assignee?.name ?? NO_ASSIGNEE_OPTION.label,
    assignee,
    cells: columns.map(({ state, cards }) => ({
      state,
      cards: cards.filter(card => assigneeIdOf(card) === id),
    })),
  };
}

export function toCardLanes(
  columns: CardStateColumn[],
  grouping: CardLaneGrouping | null
): CardLane[] {
  if (!grouping) {
    return [{ id: UNGROUPED_LANE, title: null, cells: columns }];
  }

  const assigneeLanes = listAssignees(columns, grouping).map(assignee =>
    toAssigneeLane(columns, assignee)
  );

  return showsNoAssigneeLane(grouping)
    ? [...assigneeLanes, toAssigneeLane(columns, null)]
    : assigneeLanes;
}
