import { describe, expect, it } from "vitest";
import { fromCardListFilters, toCardListFilters, toCardListSearch } from "./card-list-search";

const STATE_ID = "0b6f2a1e-3c4d-4e5f-8a9b-1c2d3e4f5a6b";
const USER_ID = "9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d";
const FEATURE_ID = "4d3c2b1a-0f9e-4d8c-b7a6-5f4e3d2c1b0a";

describe("filtro por feature na URL", () => {
  it("mantém a feature válida e a leva para o filtro da lista", () => {
    const search = toCardListSearch({ feature: FEATURE_ID });

    expect(search).toEqual({ feature: FEATURE_ID });
    expect(toCardListFilters(search)).toEqual({
      featureId: FEATURE_ID,
      includesArchived: false,
      page: 1,
    });
  });

  it.each([undefined, null, 7, "", "feature-1", "' OR 1=1"])(
    "descarta a feature %j, que não é identificador",
    feature => {
      expect(toCardListSearch({ feature })).toEqual({});
    }
  );

  it("escreve a feature escolhida na URL", () => {
    expect(
      fromCardListFilters({ featureId: FEATURE_ID, includesArchived: false, page: 1 })
    ).toEqual({ feature: FEATURE_ID });
  });
});

describe("toCardListSearch", () => {
  it("mantém os filtros válidos da URL", () => {
    expect(
      toCardListSearch({
        tipo: "issue",
        estado: STATE_ID,
        responsavel: USER_ID,
        arquivados: true,
        pagina: 3,
      })
    ).toEqual({
      tipo: "issue",
      estado: STATE_ID,
      responsavel: USER_ID,
      arquivados: true,
      pagina: 3,
    });
  });

  it.each(["user_story", "spike", "issue", "tech_debt"])("mantém o tipo de card %j", tipo => {
    expect(toCardListSearch({ tipo })).toEqual({ tipo });
  });

  it.each([undefined, null, 1, "", "bug", "USER_STORY", "toString"])("descarta o tipo %j", tipo => {
    expect(toCardListSearch({ tipo })).toEqual({});
  });

  it.each([undefined, null, 12, "", "abc", `${STATE_ID}0`, "' OR 1=1"])(
    "descarta o estado e o responsável %j, que não são identificadores",
    value => {
      expect(toCardListSearch({ estado: value, responsavel: value })).toEqual({});
    }
  );

  it.each([undefined, null, false, "true", 1])("descarta arquivados %j", arquivados => {
    expect(toCardListSearch({ arquivados })).toEqual({});
  });

  it.each([undefined, null, 0, 1, -2, 2.5, "2", Number.NaN])("descarta a página %j", pagina => {
    expect(toCardListSearch({ pagina })).toEqual({});
  });

  it("ignora outros parâmetros da URL", () => {
    expect(toCardListSearch({ tipo: "spike", origem: "email" })).toEqual({ tipo: "spike" });
  });
});

describe("toCardListFilters", () => {
  it("sem nada na URL, lista a primeira página sem os arquivados", () => {
    expect(toCardListFilters({})).toEqual({ includesArchived: false, page: 1 });
  });

  it("leva cada parâmetro da URL para o filtro da lista", () => {
    expect(
      toCardListFilters({
        tipo: "tech_debt",
        estado: STATE_ID,
        responsavel: USER_ID,
        arquivados: true,
        pagina: 2,
      })
    ).toEqual({
      type: "tech_debt",
      stateId: STATE_ID,
      assigneeId: USER_ID,
      includesArchived: true,
      page: 2,
    });
  });
});

describe("fromCardListFilters", () => {
  it("deixa a URL limpa quando os filtros são os padrões", () => {
    expect(fromCardListFilters({ includesArchived: false, page: 1 })).toEqual({});
  });

  it("escreve na URL só o que foi escolhido", () => {
    expect(
      fromCardListFilters({
        type: "user_story",
        assigneeId: USER_ID,
        includesArchived: true,
        page: 4,
      })
    ).toEqual({ tipo: "user_story", responsavel: USER_ID, arquivados: true, pagina: 4 });
  });

  it("volta ao mesmo filtro quando a URL é lida de novo", () => {
    const filters = { type: "spike", stateId: STATE_ID, includesArchived: false, page: 2 } as const;

    expect(toCardListFilters(toCardListSearch({ ...fromCardListFilters(filters) }))).toEqual(
      filters
    );
  });
});

describe("filtro sem responsável na URL", () => {
  it("lê responsavel=nenhum como só os cards sem responsável", () => {
    const search = toCardListSearch({ responsavel: "nenhum" });

    expect(search.responsavel).toBe("nenhum");
    expect(toCardListFilters(search)).toMatchObject({ assigneeId: undefined, isUnassigned: true });
  });

  it("escreve responsavel=nenhum quando o filtro é sem responsável", () => {
    expect(
      fromCardListFilters({ isUnassigned: true, includesArchived: false, page: 1 })
    ).toMatchObject({
      responsavel: "nenhum",
    });
  });
});
