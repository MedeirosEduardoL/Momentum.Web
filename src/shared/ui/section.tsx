import type { ReactNode } from "react";

type SectionProps = {
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function Section({ title, description, action, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-ink-muted">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </header>
      {children}
    </section>
  );
}
