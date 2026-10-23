import { describe, expect, it } from "vitest";
import { fromBoardView, toBoardSearch, toBoardView } from "./board-search";

const BOARD_ID = "0b6f2a1e-3c4d-4e5f-8a9b-1c2d3e4f5a6b";
const USER_ID = "9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d";

describe("toBoardSearch", () => {
  it("mantém o board, o responsável e o agrupamento válidos da URL", () => {
    expect(
      toBoardSearch({ board: BOARD_ID, responsavel: USER_ID, agrupar: "responsavel" })
    ).toEqual({ board: BOARD_ID, responsavel: USER_ID, agrupar: "responsavel" });
  });

  it.each([undefined, null, 3, "", "board-1", "' OR 1=1"])(
    "descarta o board %j, que não é identificador",
    board => {
      expect(toBoardSearch({ board })).toEqual({});
    }
  );

  it("mantém o pedido de só os cards sem responsável", () => {
    expect(toBoardSearch({ responsavel: "nenhum" })).toEqual({ responsavel: "nenhum" });
  });

  it.each([undefined, null, 3, "", "ana", "todos", "Nenhum", "sem-responsavel"])(
    "descarta o responsável %j, que não é identificador",
    responsavel => {
      expect(toBoardSearch({ responsavel })).toEqual({});
    }
  );

  it.each([undefined, null, true, "", "estado", "Responsavel"])(
    "descarta o agrupamento %j, que não existe",
    agrupar => {
      expect(toBoardSearch({ agrupar })).toEqual({});
    }
  );

  it("mantém a visão, o modo de lista e os filtros da lista válidos da URL", () => {
    expect(toBoardSearch({ nivel: "epics", exibir: "lista", pagina: 2, tipo: "issue" })).toEqual({
      nivel: "epics",
      exibir: "lista",
      pagina: 2,
      tipo: "issue",
    });
  });

  it.each(["cards", "hierarquia", "Features", 1])("descarta a visão %j, que não existe", nivel => {
    expect(toBoardSearch({ nivel, exibir: "board" })).toEqual({});
  });
});

describe("toBoardView", () => {
  it("sem nada na URL, mostra o primeiro board, todos os responsáveis e sem agrupar", () => {
    expect(toBoardView({})).toEqual({
      boardId: undefined,
      level: "cards",
      isList: false,
      assigneeId: undefined,
      isGroupedByAssignee: false,
    });
  });

  it("leva o board, o responsável e o agrupamento da URL para a tela", () => {
    expect(toBoardView({ board: BOARD_ID, responsavel: USER_ID, agrupar: "responsavel" })).toEqual({
      boardId: BOARD_ID,
      level: "cards",
      isList: false,
      assigneeId: USER_ID,
      isGroupedByAssignee: true,
    });
  });

  it("leva o pedido de sem responsável para a tela, sem pessoa escolhida", () => {
    expect(toBoardView({ responsavel: "nenhum" })).toEqual({
      boardId: undefined,
      level: "cards",
      isList: false,
      assigneeId: undefined,
      isUnassigned: true,
      isGroupedByAssignee: false,
    });
  });
});

describe("fromBoardView", () => {
  it("deixa a URL limpa quando a tela está no padrão", () => {
    expect(
      toBoardSearch(fromBoardView({ level: "cards", isList: false, isGroupedByAssignee: false }))
    ).toEqual({});
  });

  it("escreve na URL o board, o responsável e o agrupamento escolhidos", () => {
    expect(
      fromBoardView({
        boardId: BOARD_ID,
        level: "features",
        isList: true,
        assigneeId: USER_ID,
        isGroupedByAssignee: true,
      })
    ).toEqual({
      board: BOARD_ID,
      nivel: "features",
      exibir: "lista",
      responsavel: USER_ID,
      agrupar: "responsavel",
    });
  });

  it("escreve na URL o pedido de só os cards sem responsável", () => {
    expect(
      fromBoardView({
        level: "cards",
        isList: false,
        isUnassigned: true,
        isGroupedByAssignee: false,
      })
    ).toEqual({
      board: undefined,
      responsavel: "nenhum",
      agrupar: undefined,
    });
  });
});
