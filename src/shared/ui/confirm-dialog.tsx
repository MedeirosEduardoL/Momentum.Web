import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isDestructive = false,
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={isOpen => !isOpen && onCancel()}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Voltar
          </Button>
          <Button
            variant={isDestructive ? "danger" : "primary"}
            isLoading={isConfirming}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
