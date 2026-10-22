import { useState } from "react";
import { toast } from "sonner";
import { toastApiError } from "@/shared/api/toast-api-error";
import { useUploadAttachmentMutation } from "../../api/attachment.mutations";
import { isWithinTheSizeLimit } from "../lib/attachment-files";
import type { AttachmentTarget, AttachmentUploadProgress } from "../types/attachment.types";

export function useUploadAttachments(target: AttachmentTarget) {
  const upload = useUploadAttachmentMutation(target);
  const [progress, setProgress] = useState<AttachmentUploadProgress | null>(null);

  async function sendOne(file: File) {
    if (!isWithinTheSizeLimit(file)) {
      toast.error(
        `${file.name} não foi enviado: o arquivo precisa ter conteúdo e no máximo 20 MB.`
      );
      return;
    }

    setProgress({ fileName: file.name, percent: 0 });

    try {
      await upload.mutateAsync({
        file,
        onProgress: percent => setProgress({ fileName: file.name, percent }),
      });
    } catch (error) {
      toastApiError(error);
    }
  }

  async function send(files: File[]) {
    for (const file of files) {
      await sendOne(file);
    }

    setProgress(null);
  }

  return { send, progress, isSending: progress !== null };
}
