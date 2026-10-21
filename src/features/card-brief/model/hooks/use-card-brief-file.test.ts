import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { copyText } from "@/shared/lib/copy-text";
import { downloadTextFile } from "@/shared/lib/download-text-file";
import type { CardBrief } from "../types/card-brief.types";
import { useCardBriefFile } from "./use-card-brief-file";

vi.mock("@/shared/lib/copy-text");
vi.mock("@/shared/lib/download-text-file");
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const brief: CardBrief = {
  cardId: "card-1",
  fileName: "MOM-12.md",
  content: "# MOM-12 · Filtrar cards por tipo",
  promptVersion: "card-brief-v1",
  generatedAt: "2026-10-17T12:00:00Z",
  isOutdated: false,
};

beforeEach(() => {
  vi.mocked(copyText).mockReset();
  vi.mocked(downloadTextFile).mockReset();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
});

describe("useCardBriefFile", () => {
  it("copia o conteúdo como veio e confirma", async () => {
    vi.mocked(copyText).mockResolvedValue(true);
    const { result } = renderHook(() => useCardBriefFile(brief));

    await act(() => result.current.copy());

    expect(copyText).toHaveBeenCalledWith(brief.content);
    expect(toast.success).toHaveBeenCalledWith("Briefing copiado.");
  });

  it("manda baixar quando a cópia é recusada", async () => {
    vi.mocked(copyText).mockResolvedValue(false);
    const { result } = renderHook(() => useCardBriefFile(brief));

    await act(() => result.current.copy());

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível copiar o briefing. Baixe o arquivo."
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("baixa o conteúdo com o nome do arquivo do Core", () => {
    const { result } = renderHook(() => useCardBriefFile(brief));

    result.current.download();

    expect(downloadTextFile).toHaveBeenCalledWith("MOM-12.md", brief.content);
  });
});
