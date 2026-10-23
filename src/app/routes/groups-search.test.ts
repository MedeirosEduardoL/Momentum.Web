import { describe, expect, it } from "vitest";
import { toBoardGroupsSearch, toGroupsSearch } from "./groups-search";

describe("groups-search", () => {
  it("leva o endereço antigo de features e epics à visão de features do board", () => {
    expect(toBoardGroupsSearch(toGroupsSearch({}))).toEqual({ nivel: "features" });
    expect(toBoardGroupsSearch(toGroupsSearch({ visao: "qualquer" }))).toEqual({
      nivel: "features",
    });
  });

  it("leva o board de epics à visão de epics e a hierarquia à lista", () => {
    expect(toBoardGroupsSearch(toGroupsSearch({ visao: "epics" }))).toEqual({ nivel: "epics" });
    expect(toBoardGroupsSearch(toGroupsSearch({ visao: "hierarquia" }))).toEqual({
      nivel: "features",
      exibir: "lista",
    });
  });
});
