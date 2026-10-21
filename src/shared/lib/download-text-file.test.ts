import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadTextFile } from "./download-text-file";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("downloadTextFile", () => {
  it("baixa o texto como arquivo markdown com o nome dado e libera o endereço", async () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:briefing");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadTextFile("MOM-12.md", "# MOM-12");

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/markdown;charset=utf-8");
    await expect(blob.text()).resolves.toBe("# MOM-12");
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("blob:briefing");
    expect(link.download).toBe("MOM-12.md");
    expect(link.isConnected).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:briefing");
  });
});
