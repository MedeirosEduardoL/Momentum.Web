import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import {
  deleteAttachment,
  downloadAttachmentContent,
  listAttachments,
  uploadAttachment,
} from "./attachment.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const attachmentDto = {
  attachment_id: "attachment-1",
  card_id: null,
  card_task_id: "task-1",
  feature_id: null,
  epic_id: null,
  file_name: "log.txt",
  content_type: "text/plain",
  size_bytes: 1024,
  uploaded_by: "user-1",
  created_at: "2026-10-22T10:00:00Z",
};

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset();
  vi.mocked(api.delete).mockReset();
});

describe("attachment.service", () => {
  it("lista os anexos do item pelo campo do tipo dele", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [attachmentDto] });

    const attachments = await listAttachments({ kind: "cardTask", id: "task-1" });

    expect(api.get).toHaveBeenCalledWith("/api/v1/attachments", {
      params: { card_task_id: "task-1" },
    });
    expect(attachments).toEqual([
      {
        id: "attachment-1",
        fileName: "log.txt",
        contentType: "text/plain",
        sizeBytes: 1024,
        uploadedBy: "user-1",
        createdAt: "2026-10-22T10:00:00Z",
      },
    ]);
  });

  it("envia o arquivo em multipart com o id do item e avisa o progresso", async () => {
    vi.mocked(api.post).mockImplementation((_path, _body, config) => {
      config?.onUploadProgress?.({ progress: 0.5, loaded: 1, bytes: 1, lengthComputable: true });
      return Promise.resolve({ data: attachmentDto });
    });
    const onProgress = vi.fn();
    const file = new File(["conteúdo"], "log.txt", { type: "text/plain" });

    await uploadAttachment({ kind: "feature", id: "feature-1" }, file, onProgress);

    const [path, form] = vi.mocked(api.post).mock.calls[0];
    expect(path).toBe("/api/v1/attachments");
    expect((form as FormData).get("feature_id")).toBe("feature-1");
    expect((form as FormData).get("file")).toBe(file);
    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it("baixa o conteúdo como blob e exclui pelo id", async () => {
    const blob = new Blob(["conteúdo"]);
    vi.mocked(api.get).mockResolvedValue({ data: blob });
    vi.mocked(api.delete).mockResolvedValue({ data: null });

    await expect(downloadAttachmentContent("attachment-1")).resolves.toBe(blob);
    await deleteAttachment("attachment-1");

    expect(api.get).toHaveBeenCalledWith(
      "/api/v1/attachments/attachment-1/content",
      expect.objectContaining({ responseType: "blob" })
    );
    expect(api.delete).toHaveBeenCalledWith("/api/v1/attachments/attachment-1");
  });
});
