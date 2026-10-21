import { describe, expect, it } from "vitest";
import type { CardListFilters } from "../types/card.types";
import { refineCardList } from "./card-list-filters";

const filters: CardListFilters = { type: "issue", includesArchived: false, page: 3 };

describe("refineCardList", () => {
  it("aplica o filtro novo e volta para a primeira página", () => {
    expect(refineCardList(filters, { stateId: "state-1" })).toEqual({
      type: "issue",
      stateId: "state-1",
      includesArchived: false,
      page: 1,
    });
  });

  it("tira o filtro que volta a valer para todos", () => {
    expect(refineCardList(filters, { type: undefined })).toEqual({
      includesArchived: false,
      page: 1,
    });
  });

  it("não altera os filtros recebidos", () => {
    refineCardList(filters, { includesArchived: true });

    expect(filters).toEqual({ type: "issue", includesArchived: false, page: 3 });
  });
});
