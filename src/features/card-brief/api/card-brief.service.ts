import { hasErrorCode } from "@/shared/api/api-error";
import { api } from "@/shared/api/client";
import { fillPath } from "@/shared/api/fill-path";
import type { components } from "@/shared/api/generated/openapi";
import type { CardBrief } from "../model/types/card-brief.types";

type CardBriefDto = components["schemas"]["CardBriefResponseDto"];

const CARD_BRIEFS_PATH = "/api/v1/card-briefs";
const BRIEF_NOT_FOUND = "CardBriefNotFound";
const GENERATION_TIMEOUT_MS = 150_000;

function toCardBrief(dto: CardBriefDto): CardBrief {
  return {
    cardId: dto.card_id,
    fileName: dto.file_name,
    content: dto.content,
    promptVersion: dto.prompt_version,
    generatedAt: dto.generated_at,
    isOutdated: dto.outdated,
  };
}

export async function getCardBrief(cardId: string): Promise<CardBrief | null> {
  try {
    const response = await api.get<CardBriefDto>(
      fillPath("/api/v1/card-briefs/{cardId}", { cardId })
    );
    return toCardBrief(response.data);
  } catch (error) {
    if (hasErrorCode(error, BRIEF_NOT_FOUND)) {
      return null;
    }

    throw error;
  }
}

export async function generateCardBrief(cardId: string): Promise<CardBrief> {
  const response = await api.post<CardBriefDto>(
    CARD_BRIEFS_PATH,
    { card_id: cardId },
    { timeout: GENERATION_TIMEOUT_MS }
  );

  return toCardBrief(response.data);
}
