type ProgressBarProps = {
  label: string;
  value: number;
};

export function ProgressBar({ label, value }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-raised"
      >
        <div className="h-full rounded-full bg-ink-muted" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-ink-muted tabular-nums">{value}%</span>
    </div>
  );
}
