import { useState } from "react";
import { toastApiError } from "@/shared/api/toast-api-error";
import { downloadBlob } from "@/shared/lib/download-blob";
import { downloadAttachmentContent } from "../../api/attachment.service";
import type { Attachment } from "../types/attachment.types";

export function useDownloadAttachment() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function download(attachment: Attachment) {
    setDownloadingId(attachment.id);

    try {
      downloadBlob(attachment.fileName, await downloadAttachmentContent(attachment.id));
    } catch (error) {
      toastApiError(error);
    } finally {
      setDownloadingId(null);
    }
  }

  return { download, downloadingId };
}
