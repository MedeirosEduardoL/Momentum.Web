import { describe, expect, it } from "vitest";
import { otherSignedInAccount } from "./signed-in-account";

const account = { id: "user-1", name: "Ana Souza", email: "ana@exemplo.test" };

describe("otherSignedInAccount", () => {
  it("devolve a conta logada quando ela não é a convidada", () => {
    expect(otherSignedInAccount(account, "bia@exemplo.test")).toBe(account);
  });

  it("não devolve nada sem sessão ou quando a conta logada é a convidada", () => {
    expect(otherSignedInAccount(null, "bia@exemplo.test")).toBeNull();
    expect(otherSignedInAccount(undefined, "bia@exemplo.test")).toBeNull();
    expect(otherSignedInAccount(account, "ana@exemplo.test")).toBeNull();
  });
});
