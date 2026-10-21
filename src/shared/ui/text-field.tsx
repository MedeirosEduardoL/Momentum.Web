import { useId, type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

type TextFieldProps = ComponentProps<"input"> & {
  label: string;
  hint?: string;
  error?: string;
  isLabelHidden?: boolean;
  inputClassName?: string;
};

export function TextField({
  label,
  hint,
  error,
  isLabelHidden = false,
  id,
  className,
  inputClassName,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={inputId}
        className={cn("text-sm font-medium text-ink-muted", isLabelHidden && "sr-only")}
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-9 rounded-md border border-line-strong glass-control px-3 text-base text-ink transition-colors duration-150 ease-out placeholder:text-ink-subtle hover:border-ink-subtle disabled:opacity-50 aria-invalid:border-danger",
          inputClassName
        )}
        {...inputProps}
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
