import { MoreHorizontal } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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

type MenuPlacement = { isFloating: false } | { isFloating: true; style: CSSProperties };

const NAVIGATION_STEPS: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };
const MENU_GAP_PX = 4;
const INLINE: MenuPlacement = { isFloating: false };

function placementOf(trigger: HTMLElement): MenuPlacement {
  if (trigger.closest('[role="dialog"]')) {
    return INLINE;
  }

  const bounds = trigger.getBoundingClientRect();

  return {
    isFloating: true,
    style: { top: bounds.bottom + MENU_GAP_PX, right: window.innerWidth - bounds.right },
  };
}

export function ActionMenu({ label, items }: ActionMenuProps) {
  const [placement, setPlacement] = useState<MenuPlacement | null>(null);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isOpen = placement !== null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    itemRefs.current[0]?.focus();

    function isInside(target: EventTarget | null) {
      return [containerRef.current, menuRef.current].some(element =>
        element?.contains(target as Node)
      );
    }

    function closeOnOutsidePress(event: PointerEvent) {
      if (!isInside(event.target)) {
        setPlacement(null);
      }
    }

    function closeOnMove(event: Event) {
      if (!isInside(event.target)) {
        setPlacement(null);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    window.addEventListener("scroll", closeOnMove, true);
    window.addEventListener("resize", closeOnMove);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      window.removeEventListener("scroll", closeOnMove, true);
      window.removeEventListener("resize", closeOnMove);
    };
  }, [isOpen]);

  function toggle() {
    setPlacement(current =>
      current || !triggerRef.current ? null : placementOf(triggerRef.current)
    );
  }

  function closeToTrigger() {
    setPlacement(null);
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
      event.stopPropagation();
      closeToTrigger();
    } else if (event.key in NAVIGATION_STEPS) {
      event.preventDefault();
      moveFocus(NAVIGATION_STEPS[event.key]);
    } else if (event.key === "Tab") {
      setPlacement(null);
    }
  }

  function select(item: ActionMenuItem) {
    closeToTrigger();
    item.onSelect();
  }

  const menu = placement && (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      aria-label={label}
      onKeyDown={handleKeyDown}
      style={placement.isFloating ? placement.style : undefined}
      className={cn(
        "glass-strong flex min-w-48 flex-col rounded-md border border-glass-line p-1 shadow-overlay",
        placement.isFloating ? "fixed z-50" : "absolute top-full right-0 z-30 mt-1"
      )}
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
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={toggle}
        className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-raised hover:text-ink aria-expanded:bg-surface-raised aria-expanded:text-ink"
      >
        <MoreHorizontal aria-hidden className="size-4" />
      </button>
      {placement?.isFloating && menu ? createPortal(menu, document.body) : menu}
    </div>
  );
}
