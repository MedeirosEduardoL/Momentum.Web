import { useId, type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

type TextAreaFieldProps = ComponentProps<"textarea"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextAreaField({
  label,
  hint,
  error,
  id,
  className,
  rows = 4,
  ...textAreaProps
}: TextAreaFieldProps) {
  const generatedId = useId();
  const textAreaId = id ?? generatedId;
  const hintId = hint ? `${textAreaId}-hint` : undefined;
  const errorId = error ? `${textAreaId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={textAreaId} className="text-sm font-medium text-ink-muted">
        {label}
      </label>
      <textarea
        id={textAreaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="resize-y rounded-md border border-line-strong glass-control px-3 py-2 text-base text-ink transition-colors duration-150 ease-out placeholder:text-ink-subtle hover:border-ink-subtle disabled:opacity-50 aria-invalid:border-danger"
        {...textAreaProps}
      />
      {hint && (
        <p id={hintId} className="text-sm text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
