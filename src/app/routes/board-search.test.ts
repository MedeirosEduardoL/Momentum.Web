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

  it("ignora o que não é do board", () => {
    expect(toBoardSearch({ pagina: 2, tipo: "issue" })).toEqual({});
  });
});

describe("toBoardView", () => {
  it("sem nada na URL, mostra o primeiro board, todos os responsáveis e sem agrupar", () => {
    expect(toBoardView({})).toEqual({
      boardId: undefined,
      assigneeId: undefined,
      isGroupedByAssignee: false,
    });
  });

  it("leva o board, o responsável e o agrupamento da URL para a tela", () => {
    expect(toBoardView({ board: BOARD_ID, responsavel: USER_ID, agrupar: "responsavel" })).toEqual({
      boardId: BOARD_ID,
      assigneeId: USER_ID,
      isGroupedByAssignee: true,
    });
  });

  it("leva o pedido de sem responsável para a tela, sem pessoa escolhida", () => {
    expect(toBoardView({ responsavel: "nenhum" })).toEqual({
      boardId: undefined,
      assigneeId: undefined,
      isUnassigned: true,
      isGroupedByAssignee: false,
    });
  });
});

describe("fromBoardView", () => {
  it("deixa a URL limpa quando a tela está no padrão", () => {
    expect(toBoardSearch(fromBoardView({ isGroupedByAssignee: false }))).toEqual({});
  });

  it("escreve na URL o board, o responsável e o agrupamento escolhidos", () => {
    expect(
      fromBoardView({ boardId: BOARD_ID, assigneeId: USER_ID, isGroupedByAssignee: true })
    ).toEqual({ board: BOARD_ID, responsavel: USER_ID, agrupar: "responsavel" });
  });

  it("escreve na URL o pedido de só os cards sem responsável", () => {
    expect(fromBoardView({ isUnassigned: true, isGroupedByAssignee: false })).toEqual({
      board: undefined,
      responsavel: "nenhum",
      agrupar: undefined,
    });
  });
});
