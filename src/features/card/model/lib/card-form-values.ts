import { NO_SEVERITY, type CardFormValues, type QuickCardFormValues } from "../schemas/card.schema";
import type {
  Card,
  CardAssigneeFilter,
  CardChanges,
  CardState,
  CardTypeFields,
  NewCard,
  QuickCardDefaults,
  SavedCardFilter,
} from "../types/card.types";
import { NO_ASSIGNEE, NO_FEATURE } from "./card-options";

type TypeValues = Pick<CardFormValues, "userStory" | "spike" | "issue" | "techDebt">;

function emptyTypeValues(): TypeValues {
  return {
    userStory: { acceptanceCriteria: [] },
    spike: { question: "", deadline: "", conclusion: "" },
    issue: {
      stepsToReproduce: "",
      expectedBehavior: "",
      observedBehavior: "",
      severity: NO_SEVERITY,
      location: "",
    },
    techDebt: { impact: "" },
  };
}

function toTypeValues(fields: CardTypeFields): Partial<TypeValues> {
  switch (fields.type) {
    case "user_story":
      return {
        userStory: { acceptanceCriteria: fields.acceptanceCriteria.map(text => ({ text })) },
      };
    case "spike":
      return {
        spike: {
          question: fields.question,
          deadline: fields.deadline ?? "",
          conclusion: fields.conclusion,
        },
      };
    case "issue":
      return {
        issue: {
          stepsToReproduce: fields.stepsToReproduce,
          expectedBehavior: fields.expectedBehavior,
          observedBehavior: fields.observedBehavior,
          severity: fields.severity ?? NO_SEVERITY,
          location: fields.location,
        },
      };
    case "tech_debt":
      return { techDebt: { impact: fields.impact } };
  }
}

export function toNewCardValues(states: CardState[]): CardFormValues {
  return {
    cardType: "user_story",
    title: "",
    description: "",
    cardStateId: states[0]?.id ?? "",
    priority: "medium",
    assigneeId: NO_ASSIGNEE,
    featureId: NO_FEATURE,
    ...emptyTypeValues(),
  };
}

export function toCardFormValues(card: Card): CardFormValues {
  return {
    cardType: card.type,
    title: card.title,
    description: card.description,
    cardStateId: card.state.id,
    priority: card.priority,
    assigneeId: card.assignee?.userId ?? NO_ASSIGNEE,
    featureId: card.featureId ?? NO_FEATURE,
    ...emptyTypeValues(),
    ...toTypeValues(card.fields),
  };
}

export function toCardTypeFields({
  cardType,
  userStory,
  spike,
  issue,
  techDebt,
}: CardFormValues): CardTypeFields {
  switch (cardType) {
    case "user_story":
      return {
        type: cardType,
        acceptanceCriteria: userStory.acceptanceCriteria
          .map(criterion => criterion.text)
          .filter(Boolean),
      };
    case "spike":
      return {
        type: cardType,
        question: spike.question,
        deadline: spike.deadline || null,
        conclusion: spike.conclusion,
      };
    case "issue":
      return {
        type: cardType,
        stepsToReproduce: issue.stepsToReproduce,
        expectedBehavior: issue.expectedBehavior,
        observedBehavior: issue.observedBehavior,
        severity: issue.severity || null,
        location: issue.location,
      };
    case "tech_debt":
      return { type: cardType, impact: techDebt.impact };
  }
}

export function toNewCard(projectId: string, values: CardFormValues): NewCard {
  return {
    projectId,
    title: values.title,
    description: values.description,
    cardStateId: values.cardStateId || null,
    priority: values.priority,
    assigneeId: values.assigneeId || null,
    featureId: values.featureId || null,
    fields: toCardTypeFields(values),
  };
}

function onlyOne<TValue>(values: TValue[]) {
  return values.length === 1 ? values[0] : undefined;
}

function chooseQuickAssignee(assigneeFilter: CardAssigneeFilter, saved: SavedCardFilter) {
  if (assigneeFilter.isUnassigned) {
    return NO_ASSIGNEE;
  }

  return assigneeFilter.assigneeId ?? onlyOne(saved.assigneeIds) ?? NO_ASSIGNEE;
}

export function toQuickCardDefaults(
  cardStateId: string,
  assigneeFilter: CardAssigneeFilter,
  saved: SavedCardFilter
): QuickCardDefaults {
  return {
    cardType: onlyOne(saved.cardTypes) ?? "user_story",
    cardStateId,
    priority: onlyOne(saved.priorities) ?? "medium",
    assigneeId: chooseQuickAssignee(assigneeFilter, saved),
    featureId: onlyOne(saved.featureIds) ?? NO_FEATURE,
  };
}

export function toQuickNewCard(
  projectId: string,
  defaults: QuickCardDefaults,
  values: QuickCardFormValues
): NewCard {
  return toNewCard(projectId, { ...toNewCardValues([]), ...defaults, ...values });
}

export function toCardChanges(values: CardFormValues): CardChanges {
  return {
    title: values.title,
    description: values.description,
    fields: toCardTypeFields(values),
  };
}
