import { describe, expect, it } from "vitest";
import type { Card } from "@/features/card";
import type { CardInterviewAccess, CardInterviewSummary } from "../types/card-interview.types";
import {
  canCloseInterview,
  canConductInterview,
  canStartInterview,
  explainConductRestriction,
  explainStartRestriction,
  isInterviewOpen,
  isInterviewStarter,
} from "./card-interview-access";

const card: Card = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "tech_debt",
  title: "Pagar a dívida do build",
  state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  priority: "medium",
  assignee: null,
  featureId: null,
  progress: 0,
  taskCount: 0,
  doneTaskCount: 0,
  subitemCounts: {
    task: { total: 0, done: 0 },
    bug: { total: 0, done: 0 },
    impediment: { total: 0, done: 0 },
  },
  isArchived: false,
  updatedAt: "2026-10-13T12:00:00Z",
  description: "",
  fields: { type: "tech_debt", impact: "Build lento" },
  createdAt: "2026-10-12T09:00:00Z",
};

const starter: CardInterviewAccess = {
  userId: "user-1",
  isAiEnabled: true,
  canAdministerProject: false,
};
const teammate: CardInterviewAccess = { ...starter, userId: "user-2", isAiEnabled: false };
const projectAdministrator: CardInterviewAccess = { ...teammate, canAdministerProject: true };

const openInterview: CardInterviewSummary = {
  id: "interview-1",
  cardId: "card-1",
  status: "open",
  startedBy: { userId: "user-1", name: "Ana Souza" },
  roundCount: 1,
  createdAt: "2026-10-13T12:00:00Z",
  closedAt: null,
};
const closedInterview: CardInterviewSummary = {
  ...openInterview,
  id: "interview-0",
  status: "closed",
  closedAt: "2026-10-13T15:00:00Z",
};
const orphanInterview: CardInterviewSummary = { ...openInterview, startedBy: null };

describe("isInterviewOpen e isInterviewStarter", () => {
  it("reconhece a entrevista aberta e quem a iniciou", () => {
    expect(isInterviewOpen(openInterview)).toBe(true);
    expect(isInterviewOpen(closedInterview)).toBe(false);
    expect(isInterviewStarter(starter, openInterview)).toBe(true);
    expect(isInterviewStarter(teammate, openInterview)).toBe(false);
  });

  it("não trata como iniciador quem ainda não tem a conta carregada", () => {
    expect(isInterviewStarter({ ...starter, userId: null }, orphanInterview)).toBe(false);
  });
});

describe("canStartInterview", () => {
  it("deixa iniciar quem tem a permissão de IA, em card sem entrevista aberta", () => {
    expect(canStartInterview(starter, card, [])).toBe(true);
    expect(canStartInterview(starter, card, [closedInterview])).toBe(true);
  });

  it("não deixa iniciar quem não tem a permissão de IA", () => {
    expect(canStartInterview(teammate, card, [])).toBe(false);
    expect(canStartInterview(projectAdministrator, card, [])).toBe(false);
  });

  it("não deixa iniciar a segunda entrevista aberta do card", () => {
    expect(canStartInterview(starter, card, [openInterview, closedInterview])).toBe(false);
  });

  it("não deixa iniciar em card arquivado nem antes de a lista carregar", () => {
    expect(canStartInterview(starter, { ...card, isArchived: true }, [])).toBe(false);
    expect(canStartInterview(starter, card, undefined)).toBe(false);
  });
});

describe("canConductInterview", () => {
  it("só quem iniciou, e continua com a permissão de IA, conduz a entrevista aberta", () => {
    expect(canConductInterview(starter, openInterview)).toBe(true);
    expect(canConductInterview(teammate, openInterview)).toBe(false);
    expect(canConductInterview(projectAdministrator, openInterview)).toBe(false);
    expect(canConductInterview({ ...starter, isAiEnabled: false }, openInterview)).toBe(false);
  });

  it("ninguém conduz a entrevista encerrada", () => {
    expect(canConductInterview(starter, closedInterview)).toBe(false);
  });
});

describe("canCloseInterview", () => {
  it("encerra quem iniciou, mesmo sem a permissão de IA, ou o administrador do projeto", () => {
    expect(canCloseInterview({ ...starter, isAiEnabled: false }, openInterview)).toBe(true);
    expect(canCloseInterview(projectAdministrator, openInterview)).toBe(true);
    expect(canCloseInterview(projectAdministrator, orphanInterview)).toBe(true);
  });

  it("não oferece encerrar ao resto do time nem na entrevista já encerrada", () => {
    expect(canCloseInterview(teammate, openInterview)).toBe(false);
    expect(canCloseInterview(starter, closedInterview)).toBe(false);
  });
});

describe("explainStartRestriction", () => {
  it("não explica nada a quem pode iniciar", () => {
    expect(explainStartRestriction(starter, card)).toBeNull();
  });

  it("diz a quem não tem a permissão de IA quem a concede", () => {
    expect(explainStartRestriction(teammate, card)).toBe(
      "Só inicia entrevista quem o administrador da organização marcou como “Pode usar a IA” na lista de membros."
    );
  });

  it("diz que card arquivado não recebe entrevista, antes de qualquer outro motivo", () => {
    expect(explainStartRestriction(teammate, { ...card, isArchived: true })).toBe(
      "Card arquivado não recebe entrevista."
    );
  });
});

describe("explainConductRestriction", () => {
  it("não explica nada a quem conduz nem na entrevista encerrada", () => {
    expect(explainConductRestriction(starter, openInterview)).toBeNull();
    expect(explainConductRestriction(teammate, closedInterview)).toBeNull();
  });

  it("diz ao time quem conduz a entrevista", () => {
    expect(explainConductRestriction(teammate, openInterview)).toBe(
      "Só Ana Souza conduz esta entrevista. Você acompanha as perguntas e as respostas."
    );
  });

  it("diz a quem iniciou que perdeu a permissão, e que ainda pode encerrar", () => {
    expect(explainConductRestriction({ ...starter, isAiEnabled: false }, openInterview)).toBe(
      "A marcação “Pode usar a IA” foi retirada de você: peça ao administrador da organização. Você ainda pode encerrar esta entrevista."
    );
  });

  it("diz quem encerra a entrevista de quem saiu da organização", () => {
    expect(explainConductRestriction(teammate, orphanInterview)).toBe(
      "Quem iniciou esta entrevista saiu da organização. Só o administrador do projeto pode encerrá-la."
    );
  });
});
