import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadBlob } from "./download-blob";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("downloadBlob", () => {
  it("baixa o conteúdo com o nome dado e libera o endereço temporário", () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:anexo");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const blob = new Blob(["conteúdo"]);

    downloadBlob("ata.pdf", blob);

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe("ata.pdf");
    expect(link.isConnected).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:anexo");
  });
});
