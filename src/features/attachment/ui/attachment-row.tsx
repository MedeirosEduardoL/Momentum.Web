import { Download, Eye, File, FileImage, FileText, Trash2 } from "lucide-react";
import { formatDate } from "@/shared/lib/format-date";
import { formatFileSize } from "@/shared/lib/format-file-size";
import { Button } from "@/shared/ui/button";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { isPreviewable } from "../model/lib/attachment-files";
import type { Attachment } from "../model/types/attachment.types";

type AttachmentRowProps = {
  attachment: Attachment;
  uploaderName: string;
  isDownloading: boolean;
  onDownload: (attachment: Attachment) => void;
  onPreview: (attachment: Attachment) => void;
  onDelete: (attachment: Attachment) => Promise<unknown>;
};

function AttachmentIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith("image/")) {
    return <FileImage aria-hidden className="size-4 shrink-0 text-ink-subtle" />;
  }

  if (contentType.startsWith("text/") || contentType === "application/pdf") {
    return <FileText aria-hidden className="size-4 shrink-0 text-ink-subtle" />;
  }

  return <File aria-hidden className="size-4 shrink-0 text-ink-subtle" />;
}

export function AttachmentRow({
  attachment,
  uploaderName,
  isDownloading,
  onDownload,
  onPreview,
  onDelete,
}: AttachmentRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-2">
      <AttachmentIcon contentType={attachment.contentType} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium" title={attachment.fileName}>
          {attachment.fileName}
        </span>
        <span className="text-sm text-ink-subtle">
          {formatFileSize(attachment.sizeBytes)} · {uploaderName} ·{" "}
          {formatDate(attachment.createdAt)}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {isPreviewable(attachment.contentType) && (
          <Button variant="ghost" size="sm" onClick={() => onPreview(attachment)}>
            <Eye aria-hidden />
            Visualizar
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          isLoading={isDownloading}
          aria-label={`Baixar ${attachment.fileName}`}
          onClick={() => onDownload(attachment)}
        >
          <Download aria-hidden />
          Baixar
        </Button>
        <ConfirmButton
          title="Excluir o anexo?"
          description={`${attachment.fileName} sai deste item e o arquivo é apagado do servidor.`}
          confirmLabel="Excluir"
          onConfirm={() => onDelete(attachment)}
        >
          <Trash2 aria-hidden />
          <span className="sr-only">Excluir {attachment.fileName}</span>
        </ConfirmButton>
      </div>
    </li>
  );
}
