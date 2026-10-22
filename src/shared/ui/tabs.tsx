import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type TabItem<TValue extends string> = {
  value: TValue;
  label: string;
  icon?: ReactNode;
  count?: number;
  content: ReactNode;
};

type TabsProps<TValue extends string> = {
  label: string;
  tabs: TabItem<TValue>[];
  value: TValue;
  onValueChange: (value: TValue) => void;
  className?: string;
};

const STEPS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };

function hasCount(count: number | undefined): count is number {
  return count !== undefined && count > 0;
}

function targetIndexOf(key: string, current: number, total: number) {
  if (key === "Home") {
    return 0;
  }

  if (key === "End") {
    return total - 1;
  }

  return key in STEPS ? (current + STEPS[key] + total) % total : null;
}

export function Tabs<TValue extends string>({
  label,
  tabs,
  value,
  onValueChange,
  className,
}: TabsProps<TValue>) {
  const baseId = useId();
  const [visited, setVisited] = useState<ReadonlySet<TValue>>(() => new Set([value]));
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (!visited.has(value)) {
    setVisited(new Set([...visited, value]));
  }

  function idsOf(tab: TValue) {
    return { tab: `${baseId}-tab-${tab}`, panel: `${baseId}-panel-${tab}` };
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = tabs.findIndex(tab => tab.value === value);
    const target = targetIndexOf(event.key, current, tabs.length);

    if (target === null) {
      return;
    }

    event.preventDefault();
    onValueChange(tabs[target].value);
    tabRefs.current[target]?.focus();
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-4", className)}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className="flex gap-5 overflow-x-auto border-b border-line"
      >
        {tabs.map((tab, index) => {
          const isSelected = tab.value === value;

          return (
            <button
              key={tab.value}
              ref={button => {
                tabRefs.current[index] = button;
              }}
              id={idsOf(tab.value).tab}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={idsOf(tab.value).panel}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onValueChange(tab.value)}
              className={cn(
                "-mb-px inline-flex h-9 shrink-0 items-center gap-1.5 border-b-2 border-transparent text-base font-medium whitespace-nowrap text-ink-muted transition-colors duration-150 ease-out hover:text-ink [&_svg]:size-4",
                isSelected && "border-accent font-semibold text-accent-text"
              )}
            >
              {tab.icon}
              {tab.label}
              {hasCount(tab.count) && (
                <>
                  {" "}
                  <span className="rounded-full bg-surface-raised px-1.5 text-xs font-semibold text-ink-muted">
                    {tab.count}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      {tabs
        .filter(tab => visited.has(tab.value))
        .map(tab => (
          <div
            key={tab.value}
            id={idsOf(tab.value).panel}
            role="tabpanel"
            aria-labelledby={idsOf(tab.value).tab}
            hidden={tab.value !== value}
            className="min-w-0"
          >
            {tab.content}
          </div>
        ))}
    </div>
  );
}
