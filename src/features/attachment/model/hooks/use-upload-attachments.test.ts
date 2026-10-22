import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { uploadAttachment } from "../../api/attachment.service";
import { MAXIMUM_ATTACHMENT_BYTES } from "../lib/attachment-files";
import type { Attachment } from "../types/attachment.types";
import { useUploadAttachments } from "./use-upload-attachments";

vi.mock("../../api/attachment.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const target = { kind: "card", id: "card-1" } as const;

function fileOf(name: string, size: number) {
  return { name, size } as File;
}

function attachmentOf(file: File): Attachment {
  return {
    id: `anexo-${file.name}`,
    fileName: file.name,
    contentType: "image/png",
    sizeBytes: file.size,
    uploadedBy: "pessoa-1",
    createdAt: "2026-10-22T12:00:00Z",
  };
}

function renderUpload() {
  return renderHook(() => useUploadAttachments(target), {
    wrapper: createQueryWrapper().wrapper,
  });
}

beforeEach(() => {
  vi.mocked(uploadAttachment).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe("useUploadAttachments", () => {
  it("envia os arquivos um de cada vez, na ordem escolhida", async () => {
    const order: string[] = [];
    vi.mocked(uploadAttachment).mockImplementation(async (_, file) => {
      order.push(`começou ${file.name}`);
      await Promise.resolve();
      order.push(`terminou ${file.name}`);
      return attachmentOf(file);
    });
    const { result } = renderUpload();

    await act(() => result.current.send([fileOf("tela.png", 10), fileOf("log.txt", 20)]));

    expect(order).toEqual([
      "começou tela.png",
      "terminou tela.png",
      "começou log.txt",
      "terminou log.txt",
    ]);
    expect(result.current.isSending).toBe(false);
  });

  it("não envia o arquivo acima de 20 MB e segue com os outros", async () => {
    vi.mocked(uploadAttachment).mockImplementation(async (_, file) => attachmentOf(file));
    const { result } = renderUpload();

    await act(() =>
      result.current.send([
        fileOf("video.mp4", MAXIMUM_ATTACHMENT_BYTES + 1),
        fileOf("tela.png", 10),
      ])
    );

    expect(toast.error).toHaveBeenCalledWith(
      "video.mp4 não foi enviado: o arquivo precisa ter conteúdo e no máximo 20 MB."
    );
    expect(uploadAttachment).toHaveBeenCalledTimes(1);
    expect(vi.mocked(uploadAttachment).mock.calls[0][1].name).toBe("tela.png");
  });

  it("mostra a recusa do Core e continua com o próximo arquivo", async () => {
    vi.mocked(uploadAttachment)
      .mockRejectedValueOnce(
        apiError(422, "AttachmentLimitReached", "O item já tem o máximo de 100 anexos.")
      )
      .mockImplementation(async (_, file) => attachmentOf(file));
    const { result } = renderUpload();

    await act(() => result.current.send([fileOf("a.png", 10), fileOf("b.png", 10)]));

    expect(toast.error).toHaveBeenCalledWith("O item já tem o máximo de 100 anexos.");
    expect(uploadAttachment).toHaveBeenCalledTimes(2);
    expect(result.current.progress).toBeNull();
  });
});
