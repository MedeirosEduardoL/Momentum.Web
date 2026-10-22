import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlob } from "@/shared/lib/download-blob";
import { networkFailure } from "@/test/api-errors";
import { downloadAttachmentContent } from "../../api/attachment.service";
import type { Attachment } from "../types/attachment.types";
import { useDownloadAttachment } from "./use-download-attachment";

vi.mock("../../api/attachment.service");
vi.mock("@/shared/lib/download-blob");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const attachment: Attachment = {
  id: "anexo-1",
  fileName: "relatorio.pdf",
  contentType: "application/pdf",
  sizeBytes: 2048,
  uploadedBy: "pessoa-1",
  createdAt: "2026-10-22T12:00:00Z",
};

beforeEach(() => {
  vi.mocked(downloadAttachmentContent).mockReset();
  vi.mocked(downloadBlob).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe("useDownloadAttachment", () => {
  it("baixa o conteúdo pela sessão e salva com o nome do anexo", async () => {
    const content = new Blob(["%PDF"]);
    vi.mocked(downloadAttachmentContent).mockResolvedValue(content);
    const { result } = renderHook(() => useDownloadAttachment());

    await act(() => result.current.download(attachment));

    expect(downloadAttachmentContent).toHaveBeenCalledWith("anexo-1");
    expect(downloadBlob).toHaveBeenCalledWith("relatorio.pdf", content);
    expect(result.current.downloadingId).toBeNull();
  });

  it("avisa a falha sem salvar nada", async () => {
    vi.mocked(downloadAttachmentContent).mockRejectedValue(networkFailure);
    const { result } = renderHook(() => useDownloadAttachment());

    await act(() => result.current.download(attachment));

    expect(downloadBlob).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(result.current.downloadingId).toBeNull();
  });
});
