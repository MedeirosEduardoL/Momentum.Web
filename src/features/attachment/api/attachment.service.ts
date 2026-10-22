import type { AxiosProgressEvent } from "axios";
import { api } from "@/shared/api/client";
import { fillPath } from "@/shared/api/fill-path";
import type { components, paths } from "@/shared/api/generated/openapi";
import type {
  Attachment,
  AttachmentTarget,
  AttachmentTargetKind,
} from "../model/types/attachment.types";

type AttachmentDto = components["schemas"]["AttachmentResponseDto"];

const ATTACHMENTS_PATH = "/api/v1/attachments" satisfies keyof paths;
const UPLOAD_TIMEOUT_MS = 180_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;

const TARGET_FIELDS: Record<AttachmentTargetKind, string> = {
  card: "card_id",
  cardTask: "card_task_id",
  feature: "feature_id",
  epic: "epic_id",
};

export function toAttachment(dto: AttachmentDto): Attachment {
  return {
    id: dto.attachment_id,
    fileName: dto.file_name,
    contentType: dto.content_type,
    sizeBytes: dto.size_bytes,
    uploadedBy: dto.uploaded_by,
    createdAt: dto.created_at,
  };
}

export async function listAttachments(target: AttachmentTarget): Promise<Attachment[]> {
  const response = await api.get<AttachmentDto[]>(ATTACHMENTS_PATH, {
    params: { [TARGET_FIELDS[target.kind]]: target.id },
  });

  return response.data.map(toAttachment);
}

export async function uploadAttachment(
  target: AttachmentTarget,
  file: File,
  onProgress?: (percent: number) => void
): Promise<Attachment> {
  const form = new FormData();
  form.append(TARGET_FIELDS[target.kind], target.id);
  form.append("file", file);

  const response = await api.post<AttachmentDto>(ATTACHMENTS_PATH, form, {
    timeout: UPLOAD_TIMEOUT_MS,
    onUploadProgress: (event: AxiosProgressEvent) =>
      onProgress?.(Math.round((event.progress ?? 0) * 100)),
  });

  return toAttachment(response.data);
}

export async function downloadAttachmentContent(attachmentId: string): Promise<Blob> {
  const response = await api.get<Blob>(
    fillPath("/api/v1/attachments/{attachmentId}/content", { attachmentId }),
    { responseType: "blob", timeout: DOWNLOAD_TIMEOUT_MS }
  );

  return response.data;
}

export async function deleteAttachment(attachmentId: string) {
  await api.delete(fillPath("/api/v1/attachments/{attachmentId}", { attachmentId }));
}
