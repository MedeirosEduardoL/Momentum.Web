import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-1 p-8 text-center">
      {icon && (
        <div aria-hidden className="mb-2 text-ink-subtle">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="max-w-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </section>
  );
}
