import { describe, expect, it } from "vitest";
import { toApiBaseUrl } from "./api-base-url";

describe("toApiBaseUrl", () => {
  it("fica vazio sem endereço configurado, para chamar a API na mesma origem", () => {
    expect(toApiBaseUrl(undefined)).toBe("");
    expect(toApiBaseUrl("  ")).toBe("");
  });

  it("usa o endereço configurado sem a barra do fim", () => {
    expect(toApiBaseUrl("https://gateway.exemplo.test")).toBe("https://gateway.exemplo.test");
    expect(toApiBaseUrl("https://gateway.exemplo.test//")).toBe("https://gateway.exemplo.test");
  });
});
