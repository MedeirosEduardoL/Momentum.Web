import { useEffect, useRef } from "react";
import { LoadingState } from "@/shared/ui/loading-state";
import { Modal } from "@/shared/ui/modal";
import { Notice } from "@/shared/ui/notice";
import { useAttachmentContent } from "../api/attachment.queries";
import type { Attachment } from "../model/types/attachment.types";

type AttachmentPreviewDialogProps = {
  attachment: Attachment | null;
  onClose: () => void;
};

type PreviewImageProps = {
  content: Blob;
  attachment: Attachment;
};

function PreviewImage({ content, attachment }: PreviewImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const address = URL.createObjectURL(new Blob([content], { type: attachment.contentType }));

    if (imageRef.current) {
      imageRef.current.src = address;
    }

    return () => URL.revokeObjectURL(address);
  }, [content, attachment.contentType]);

  return (
    <img
      ref={imageRef}
      alt={attachment.fileName}
      className="max-h-[70dvh] w-full rounded-md object-contain"
    />
  );
}

export function AttachmentPreviewDialog({ attachment, onClose }: AttachmentPreviewDialogProps) {
  const content = useAttachmentContent(attachment?.id ?? "", attachment !== null);

  return (
    <Modal
      open={attachment !== null}
      size="lg"
      title={attachment?.fileName ?? "Anexo"}
      onOpenChange={open => !open && onClose()}
    >
      {content.isError && <Notice tone="danger">Não foi possível abrir a imagem agora.</Notice>}
      {content.isPending && <LoadingState label="Abrindo a imagem" />}
      {attachment && content.data && (
        <PreviewImage content={content.data} attachment={attachment} />
      )}
    </Modal>
  );
}
