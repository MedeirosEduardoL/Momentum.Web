import { useQuery } from "@tanstack/react-query";
import type { AttachmentTarget } from "../model/types/attachment.types";
import { attachmentKeys } from "./attachment-api-keys";
import { downloadAttachmentContent, listAttachments } from "./attachment.service";

export function useListAttachments(target: AttachmentTarget) {
  return useQuery({
    queryKey: attachmentKeys.byTarget(target),
    queryFn: () => listAttachments(target),
  });
}

export function useAttachmentContent(attachmentId: string, isEnabled: boolean) {
  return useQuery({
    queryKey: attachmentKeys.content(attachmentId),
    queryFn: () => downloadAttachmentContent(attachmentId),
    enabled: isEnabled,
    staleTime: Infinity,
  });
}
