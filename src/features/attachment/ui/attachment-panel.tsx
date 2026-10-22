import { Paperclip } from "lucide-react";
import { useState } from "react";
import { useListProjectMembers } from "@/features/project";
import { toastApiError } from "@/shared/api/toast-api-error";
import { EmptyState } from "@/shared/ui/empty-state";
import { FileDropZone } from "@/shared/ui/file-drop-zone";
import { QueryContent } from "@/shared/ui/query-content";
import { useDeleteAttachmentMutation } from "../api/attachment.mutations";
import { useListAttachments } from "../api/attachment.queries";
import { useDownloadAttachment } from "../model/hooks/use-download-attachment";
import { useUploadAttachments } from "../model/hooks/use-upload-attachments";
import type { Attachment, AttachmentTarget } from "../model/types/attachment.types";
import { AttachmentPreviewDialog } from "./attachment-preview-dialog";
import { AttachmentRow } from "./attachment-row";

type AttachmentPanelProps = {
  target: AttachmentTarget;
  projectId: string;
};

const FORMER_MEMBER = "Alguém que saiu do time";

function useUploaderNames(projectId: string) {
  const team = useListProjectMembers(projectId);
  const names = new Map((team.data ?? []).map(member => [member.userId, member.name]));

  return (userId: string | null) => (userId ? (names.get(userId) ?? FORMER_MEMBER) : FORMER_MEMBER);
}

export function AttachmentPanel({ target, projectId }: AttachmentPanelProps) {
  const attachments = useListAttachments(target);
  const uploads = useUploadAttachments(target);
  const removal = useDeleteAttachmentMutation(target);
  const downloads = useDownloadAttachment();
  const nameOf = useUploaderNames(projectId);
  const [previewed, setPreviewed] = useState<Attachment | null>(null);

  async function remove(attachment: Attachment) {
    try {
      await removal.mutateAsync(attachment.id);
    } catch (error) {
      toastApiError(error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FileDropZone
        label="Escolher arquivos"
        hint="Até 20 MB por arquivo. Os anexos ficam guardados no servidor do Momentum."
        isBusy={uploads.isSending}
        onFiles={files => void uploads.send(files)}
      />
      {uploads.progress && (
        <p role="status" className="text-sm text-ink-muted">
          Enviando {uploads.progress.fileName}… {uploads.progress.percent}%
        </p>
      )}
      <QueryContent
        query={attachments}
        loadingLabel="Carregando os anexos"
        errorTitle="Não foi possível carregar os anexos"
      >
        {list =>
          list.length === 0 ? (
            <EmptyState
              icon={<Paperclip className="size-5" />}
              title="Nenhum anexo ainda"
              description="Prints, logs, planilhas e documentos que ajudam a entender este item."
            />
          ) : (
            <ul aria-label="Anexos" className="panel divide-y divide-line">
              {list.map(attachment => (
                <AttachmentRow
                  key={attachment.id}
                  attachment={attachment}
                  uploaderName={nameOf(attachment.uploadedBy)}
                  isDownloading={downloads.downloadingId === attachment.id}
                  onDownload={downloads.download}
                  onPreview={setPreviewed}
                  onDelete={remove}
                />
              ))}
            </ul>
          )
        }
      </QueryContent>
      <AttachmentPreviewDialog attachment={previewed} onClose={() => setPreviewed(null)} />
    </div>
  );
}
