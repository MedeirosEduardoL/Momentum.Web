import { describe, expect, it } from "vitest";
import type { Card } from "@/features/card";
import { explainGenerateRestriction } from "./card-brief-access";

const card = { id: "card-1", isArchived: false } as Card;

describe("explainGenerateRestriction", () => {
  it("deixa gerar quem tem a permissão de IA", () => {
    expect(explainGenerateRestriction(card, true)).toBeNull();
  });

  it("diz a quem não tem a permissão que é o administrador da organização quem a concede", () => {
    expect(explainGenerateRestriction(card, false)).toBe(
      "Só gera o briefing quem o administrador da organização marcou como “Pode usar a IA” na lista de membros."
    );
  });

  it("recusa card arquivado mesmo para quem tem a permissão", () => {
    expect(explainGenerateRestriction({ ...card, isArchived: true }, true)).toBe(
      "Card arquivado não recebe briefing."
    );
  });
});
