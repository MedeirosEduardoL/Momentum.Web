import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AttachmentTarget } from "../model/types/attachment.types";
import { attachmentKeys } from "./attachment-api-keys";
import { deleteAttachment, uploadAttachment } from "./attachment.service";

type UploadVariables = {
  file: File;
  onProgress?: (percent: number) => void;
};

function useRefreshAttachments(target: AttachmentTarget) {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: attachmentKeys.byTarget(target) });
}

export function useUploadAttachmentMutation(target: AttachmentTarget) {
  const refresh = useRefreshAttachments(target);

  return useMutation({
    mutationFn: ({ file, onProgress }: UploadVariables) =>
      uploadAttachment(target, file, onProgress),
    onSettled: refresh,
  });
}

export function useDeleteAttachmentMutation(target: AttachmentTarget) {
  const refresh = useRefreshAttachments(target);

  return useMutation({
    mutationFn: deleteAttachment,
    onSettled: refresh,
  });
}
