import type { AttachmentTarget } from "../model/types/attachment.types";

export const attachmentKeys = {
  all: ["attachment"] as const,
  byTarget: (target: AttachmentTarget) => [...attachmentKeys.all, target.kind, target.id] as const,
  content: (attachmentId: string) => [...attachmentKeys.all, "content", attachmentId] as const,
};
