import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useConfirmation } from "@/shared/ui/use-confirmation";

type ConfirmButtonProps = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
  disabled?: boolean;
  children: ReactNode;
};

export function ConfirmButton({
  title,
  description,
  confirmLabel,
  onConfirm,
  disabled,
  children,
}: ConfirmButtonProps) {
  const confirmation = useConfirmation(onConfirm);

  return (
    <>
      <Button variant="ghost" size="sm" disabled={disabled} onClick={confirmation.open}>
        {children}
      </Button>
      <ConfirmDialog
        open={confirmation.isOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        isDestructive
        isConfirming={confirmation.isConfirming}
        onConfirm={confirmation.confirm}
        onCancel={confirmation.cancel}
      />
    </>
  );
}
