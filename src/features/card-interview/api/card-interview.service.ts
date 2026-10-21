import { fromErrorList, networkFailure } from "@/shared/api/api-error";
import { api } from "@/shared/api/client";
import { postEventStream } from "@/shared/api/event-stream";
import { fillPath } from "@/shared/api/fill-path";
import type { components, paths } from "@/shared/api/generated/openapi";
import type {
  CardInterview,
  CardInterviewAnswer,
  CardInterviewRound,
  CardInterviewRoundRequest,
  CardInterviewStarter,
  CardInterviewSummary,
} from "../model/types/card-interview.types";

type Schemas = components["schemas"];
type InterviewDto = Schemas["InterviewResponseDto"];
type InterviewSummaryDto = Schemas["InterviewSummaryResponseDto"];
type InterviewRoundDto = Schemas["InterviewRoundResponseDto"];
type InterviewRoundEventDto = Schemas["InterviewRoundEventDto"];
type InterviewStarterDto = Schemas["InterviewStarterResponseDto"];
type InterviewAnswerDto = Schemas["InterviewAnswerDto"];
type InterviewListParams = NonNullable<
  paths["/api/v1/card-interviews"]["get"]["parameters"]["query"]
>;

const INTERVIEWS_PATH = "/api/v1/card-interviews" satisfies keyof paths;
const ROUND_EVENT = "round";
const ERROR_EVENT = "error";

function interviewPath(cardInterviewId: string) {
  return fillPath("/api/v1/card-interviews/{cardInterviewId}", { cardInterviewId });
}

function roundsPath(cardInterviewId: string) {
  return fillPath("/api/v1/card-interviews/{cardInterviewId}/rounds", { cardInterviewId });
}

function toStarter(dto: InterviewStarterDto | null): CardInterviewStarter | null {
  return dto && { userId: dto.user_id, name: dto.name };
}

function toAnswer(dto: InterviewAnswerDto): CardInterviewAnswer {
  return { question: dto.question ?? 0, answer: dto.answer ?? "" };
}

function toRound(dto: InterviewRoundDto): CardInterviewRound {
  return {
    number: dto.number,
    questions: dto.questions.map(question => ({
      title: question.title,
      body: question.body,
      recommendedAnswer: question.recommended_answer,
    })),
    answers: dto.answers && dto.answers.map(toAnswer),
  };
}

function toSummary(dto: InterviewSummaryDto): CardInterviewSummary {
  return {
    id: dto.card_interview_id,
    cardId: dto.card_id,
    status: dto.status,
    startedBy: toStarter(dto.started_by),
    roundCount: dto.round_count,
    createdAt: dto.created_at,
    closedAt: dto.closed_at,
  };
}

function toInterview(dto: InterviewDto): CardInterview {
  return {
    id: dto.card_interview_id,
    cardId: dto.card_id,
    status: dto.status,
    startedBy: toStarter(dto.started_by),
    isFinished: dto.finished,
    rounds: dto.rounds.map(toRound),
    createdAt: dto.created_at,
    closedAt: dto.closed_at,
  };
}

function toRoundPayload(answers: CardInterviewAnswer[]): Schemas["AskInterviewRoundRequestDto"] {
  return answers.length > 0 ? { answers } : {};
}

export async function listCardInterviews(cardId: string): Promise<CardInterviewSummary[]> {
  const params: InterviewListParams = { card_id: cardId };
  const response = await api.get<InterviewSummaryDto[]>(INTERVIEWS_PATH, { params });

  return response.data.map(toSummary);
}

export async function getCardInterview(interviewId: string): Promise<CardInterview> {
  const response = await api.get<InterviewDto>(interviewPath(interviewId));

  return toInterview(response.data);
}

export async function startCardInterview(cardId: string): Promise<CardInterview> {
  const payload: Schemas["StartInterviewRequestDto"] = { card_id: cardId };
  const response = await api.post<InterviewDto>(INTERVIEWS_PATH, payload);

  return toInterview(response.data);
}

export async function closeCardInterview(interviewId: string): Promise<CardInterview> {
  const payload: Schemas["UpdateInterviewRequestDto"] = { status: "closed" };
  const response = await api.patch<InterviewDto>(interviewPath(interviewId), payload);

  return toInterview(response.data);
}

export async function askCardInterviewRound({
  interviewId,
  answers,
  signal,
}: CardInterviewRoundRequest): Promise<CardInterviewRound> {
  const events = postEventStream(roundsPath(interviewId), toRoundPayload(answers), signal);

  for await (const { event, data } of events) {
    const streamed: InterviewRoundEventDto = JSON.parse(data);

    if (event === ROUND_EVENT && streamed.round) {
      return toRound(streamed.round);
    }

    if (event === ERROR_EVENT) {
      throw fromErrorList(streamed.errors);
    }
  }

  throw networkFailure();
}
