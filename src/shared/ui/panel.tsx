import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

export function Panel({ title, description, footer, children }: PanelProps) {
  return (
    <section className="glass flex w-full max-w-sm flex-col gap-5 rounded-lg border border-glass-line p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && <p className="text-ink-muted">{description}</p>}
      </header>
      {children}
      {footer && (
        <footer className="flex flex-col gap-1 border-t border-line pt-4 text-sm text-ink-muted">
          {footer}
        </footer>
      )}
    </section>
  );
}
