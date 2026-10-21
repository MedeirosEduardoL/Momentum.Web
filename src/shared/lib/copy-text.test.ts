import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./copy-text";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("copyText", () => {
  it("copia o texto e diz que deu certo", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyText("# MOM-12")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("# MOM-12");
  });

  it("diz que não copiou quando o navegador recusa ou não tem a área de transferência", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error()) },
    });
    await expect(copyText("texto")).resolves.toBe(false);

    vi.stubGlobal("navigator", {});
    await expect(copyText("texto")).resolves.toBe(false);
  });
});
