import type { Card } from "@/features/card";

const ARCHIVED_CARD = "Card arquivado não recebe briefing.";
const AI_PERMISSION_REQUIRED =
  "Só gera o briefing quem o administrador da organização marcou como “Pode usar a IA” na lista de membros.";

export function explainGenerateRestriction(card: Card, isAiEnabled: boolean) {
  if (card.isArchived) {
    return ARCHIVED_CARD;
  }

  return isAiEnabled ? null : AI_PERMISSION_REQUIRED;
}
