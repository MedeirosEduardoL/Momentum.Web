import { MoreHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type ActionMenuItem = {
  label: string;
  icon?: ReactNode;
  isDestructive?: boolean;
  onSelect: () => void;
};

type ActionMenuProps = {
  label: string;
  items: ActionMenuItem[];
};

const NAVIGATION_STEPS: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };

export function ActionMenu({ label, items }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    itemRefs.current[0]?.focus();

    function closeOnOutsidePress(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);

    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [isOpen]);

  function closeToTrigger() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function moveFocus(step: number) {
    const buttons = itemRefs.current.filter(button => button !== null);
    const current = buttons.findIndex(button => button === document.activeElement);

    buttons[(current + step + buttons.length) % buttons.length]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeToTrigger();
    } else if (event.key in NAVIGATION_STEPS) {
      event.preventDefault();
      moveFocus(NAVIGATION_STEPS[event.key]);
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  }

  function select(item: ActionMenuItem) {
    closeToTrigger();
    item.onSelect();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen(open => !open)}
        className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-raised hover:text-ink aria-expanded:bg-surface-raised aria-expanded:text-ink"
      >
        <MoreHorizontal aria-hidden className="size-4" />
      </button>
      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleKeyDown}
          className="glass-strong absolute top-full right-0 z-30 mt-1 flex min-w-48 flex-col rounded-md border border-glass-line p-1 shadow-overlay"
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={button => {
                itemRefs.current[index] = button;
              }}
              type="button"
              role="menuitem"
              onClick={() => select(item)}
              className={cn(
                "flex h-8 items-center gap-2 rounded-sm px-2 text-left text-sm whitespace-nowrap transition-colors duration-150 ease-out hover:bg-surface-raised focus-visible:bg-surface-raised [&_svg]:size-4 [&_svg]:shrink-0",
                item.isDestructive ? "text-danger" : "text-ink"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
