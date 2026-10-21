import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type ModalSize = "md" | "lg";

type ModalProps = {
  open: boolean;
  size?: ModalSize;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  children?: ReactNode;
};

const SIZE_CLASSES: Record<ModalSize, string> = {
  md: "max-w-lg",
  lg: "max-w-3xl",
};

export function Modal({
  open,
  size = "md",
  onOpenChange,
  title,
  description,
  footer,
  children,
}: ModalProps) {
  const withoutDescription = description ? {} : { "aria-describedby": undefined };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-canvas/60 p-4 backdrop-blur-sm">
          <Dialog.Content
            {...withoutDescription}
            className={cn(
              "glass-strong flex w-full flex-col gap-4 rounded-lg border border-glass-line p-5 shadow-overlay",
              SIZE_CLASSES[size]
            )}
          >
            <header className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
                {description && (
                  <Dialog.Description className="text-ink-muted">{description}</Dialog.Description>
                )}
              </div>
              <Dialog.Close
                aria-label="Fechar"
                className="rounded-md p-1 text-ink-subtle transition-colors duration-150 ease-out hover:bg-surface-raised hover:text-ink"
              >
                <X aria-hidden className="size-4" />
              </Dialog.Close>
            </header>
            {children}
            {footer && <footer className="flex justify-end gap-2">{footer}</footer>}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
