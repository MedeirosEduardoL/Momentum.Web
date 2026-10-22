import { describe, expect, it } from "vitest";
import { fromGroupsView, toGroupsSearch, toGroupsView } from "./groups-search";

describe("groups-search", () => {
  it("abre no board de features quando a URL não pede outra visão", () => {
    expect(toGroupsView(toGroupsSearch({}))).toBe("features");
    expect(toGroupsView(toGroupsSearch({ visao: "qualquer" }))).toBe("features");
  });

  it("lê e grava as visões de epics e de hierarquia", () => {
    expect(toGroupsView(toGroupsSearch({ visao: "epics" }))).toBe("epics");
    expect(fromGroupsView("hierarquia")).toEqual({ visao: "hierarquia" });
    expect(fromGroupsView("features")).toEqual({ visao: undefined });
  });
});
