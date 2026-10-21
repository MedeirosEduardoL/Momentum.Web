import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import { generateCardBrief, getCardBrief } from "./card-brief.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const briefDto = {
  card_id: "card-1",
  file_name: "MOM-12.md",
  content: "# MOM-12 · Filtrar cards por tipo",
  prompt_version: "card-brief-v1",
  generated_at: "2026-10-17T12:00:00Z",
  outdated: true,
};

const brief = {
  cardId: "card-1",
  fileName: "MOM-12.md",
  content: "# MOM-12 · Filtrar cards por tipo",
  promptVersion: "card-brief-v1",
  generatedAt: "2026-10-17T12:00:00Z",
  isOutdated: true,
};

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset();
});

describe("getCardBrief", () => {
  it("lê o último briefing do card", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: briefDto });

    await expect(getCardBrief("card-1")).resolves.toEqual(brief);
    expect(api.get).toHaveBeenCalledWith("/api/v1/card-briefs/card-1");
  });

  it("devolve nada quando o card ainda não tem briefing", async () => {
    vi.mocked(api.get).mockRejectedValue(
      apiError(404, "CardBriefNotFound", "Este card ainda não tem briefing.")
    );

    await expect(getCardBrief("card-1")).resolves.toBeNull();
  });

  it("repassa qualquer outra recusa", async () => {
    const notFound = apiError(404, "CardNotFound", "Card não encontrado.");
    vi.mocked(api.get).mockRejectedValue(notFound);

    await expect(getCardBrief("card-1")).rejects.toBe(notFound);
  });
});

describe("generateCardBrief", () => {
  it("pede o briefing com a espera longa da chamada à IA", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ...briefDto, outdated: false } });

    await expect(generateCardBrief("card-1")).resolves.toEqual({ ...brief, isOutdated: false });
    expect(api.post).toHaveBeenCalledWith(
      "/api/v1/card-briefs",
      { card_id: "card-1" },
      { timeout: 150_000 }
    );
  });
});
