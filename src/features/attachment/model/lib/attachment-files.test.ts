import { describe, expect, it } from "vitest";
import { isPreviewable, isWithinTheSizeLimit, MAXIMUM_ATTACHMENT_BYTES } from "./attachment-files";

function fileOf(size: number) {
  return { size } as File;
}

describe("isPreviewable", () => {
  it("aceita só as imagens que o navegador mostra sem risco", () => {
    expect(["image/png", "image/jpeg", "image/gif", "image/webp"].every(isPreviewable)).toBe(true);
    expect(isPreviewable("image/svg+xml")).toBe(false);
    expect(isPreviewable("text/html")).toBe(false);
    expect(isPreviewable("application/pdf")).toBe(false);
  });
});

describe("isWithinTheSizeLimit", () => {
  it("aceita de 1 byte a 20 MB", () => {
    expect(isWithinTheSizeLimit(fileOf(1))).toBe(true);
    expect(isWithinTheSizeLimit(fileOf(MAXIMUM_ATTACHMENT_BYTES))).toBe(true);
  });

  it("recusa o arquivo vazio e o que passa de 20 MB", () => {
    expect(isWithinTheSizeLimit(fileOf(0))).toBe(false);
    expect(isWithinTheSizeLimit(fileOf(MAXIMUM_ATTACHMENT_BYTES + 1))).toBe(false);
  });
});
