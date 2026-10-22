import { describe, expect, it } from "vitest";
import { formatFileSize } from "./format-file-size";

describe("formatFileSize", () => {
  it("mostra bytes até 1 KB", () => {
    expect(formatFileSize(0)).toBe("0 bytes");
    expect(formatFileSize(1023)).toBe("1.023 bytes");
  });

  it("passa para KB e MB com uma casa decimal e vírgula", () => {
    expect(formatFileSize(1536)).toBe("1,5 KB");
    expect(formatFileSize(20 * 1024 * 1024)).toBe("20 MB");
    expect(formatFileSize(3.45 * 1024 * 1024)).toBe("3,5 MB");
  });
});
