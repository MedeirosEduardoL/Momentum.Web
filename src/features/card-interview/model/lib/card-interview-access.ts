import type { Card } from "@/features/card";
import type {
  CardInterview,
  CardInterviewAccess,
  CardInterviewSummary,
} from "../types/card-interview.types";

type Interview = CardInterview | CardInterviewSummary;

const ARCHIVED_CARD = "Card arquivado não recebe entrevista.";
const NOT_ENABLED =
  "Só inicia entrevista quem o administrador da organização marcou como “Pode usar a IA” na lista de membros.";
const NO_LONGER_ENABLED =
  "A marcação “Pode usar a IA” foi retirada de você: peça ao administrador da organização. Você ainda pode encerrar esta entrevista.";
const STARTER_LEFT =
  "Quem iniciou esta entrevista saiu da organização. Só o administrador do projeto pode encerrá-la.";

export function isInterviewOpen(interview: Interview) {
  return interview.status === "open";
}

export function isInterviewStarter(access: CardInterviewAccess, interview: Interview) {
  return access.userId !== null && interview.startedBy?.userId === access.userId;
}

export function canStartInterview(
  access: CardInterviewAccess,
  card: Card,
  interviews: CardInterviewSummary[] | undefined
) {
  return (
    interviews !== undefined &&
    access.isAiEnabled &&
    !card.isArchived &&
    !interviews.some(isInterviewOpen)
  );
}

export function canConductInterview(access: CardInterviewAccess, interview: Interview) {
  return isInterviewOpen(interview) && isInterviewStarter(access, interview) && access.isAiEnabled;
}

export function canCloseInterview(access: CardInterviewAccess, interview: Interview) {
  return (
    isInterviewOpen(interview) &&
    (isInterviewStarter(access, interview) || access.canAdministerProject)
  );
}

export function explainStartRestriction(access: CardInterviewAccess, card: Card) {
  if (card.isArchived) {
    return ARCHIVED_CARD;
  }

  return access.isAiEnabled ? null : NOT_ENABLED;
}

export function explainConductRestriction(access: CardInterviewAccess, interview: Interview) {
  if (!isInterviewOpen(interview) || canConductInterview(access, interview)) {
    return null;
  }

  if (isInterviewStarter(access, interview)) {
    return NO_LONGER_ENABLED;
  }

  return interview.startedBy
    ? `Só ${interview.startedBy.name} conduz esta entrevista. Você acompanha as perguntas e as respostas.`
    : STARTER_LEFT;
}
