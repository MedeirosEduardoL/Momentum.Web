import { useState } from "react";

export function useConfirmation(onConfirm: () => Promise<unknown>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  async function confirm() {
    setIsConfirming(true);

    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
      setIsOpen(false);
    }
  }

  return {
    isOpen,
    isConfirming,
    open: () => setIsOpen(true),
    cancel: () => setIsOpen(false),
    confirm,
  };
}
