import { ChevronDown } from "lucide-react";
import { useId, type ChangeEvent, type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export type SelectOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

type SelectVariant = "field" | "quiet";

type SelectFieldProps<TValue extends string> = Omit<ComponentProps<"select">, "children"> & {
  label: string;
  options: SelectOption<TValue>[];
  error?: string;
  isLabelHidden?: boolean;
  isLabelInline?: boolean;
  variant?: SelectVariant;
  onValueChange?: (value: TValue) => void;
};

const SELECT_CLASSES: Record<SelectVariant, string> = {
  field:
    "h-9 min-w-40 border border-line-strong glass-control pr-9 pl-3 text-base text-ink hover:border-ink-subtle aria-invalid:border-danger",
  quiet:
    "field-sizing-content h-7 pr-7 pl-2 text-sm text-ink-muted hover:bg-surface-raised hover:text-ink",
};

const CHEVRON_CLASSES: Record<SelectVariant, string> = {
  field: "right-3 size-4",
  quiet: "right-2 size-3.5",
};

export function SelectField<TValue extends string>({
  label,
  options,
  error,
  isLabelHidden = false,
  isLabelInline = false,
  variant = "field",
  onValueChange,
  onChange,
  id,
  className,
  ...selectProps
}: SelectFieldProps<TValue>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = error ? `${selectId}-error` : undefined;

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = options.find(option => option.value === event.target.value);

    onChange?.(event);

    if (selected) {
      onValueChange?.(selected.value);
    }
  }

  return (
    <div
      className={cn(isLabelInline ? "flex items-center gap-2" : "flex flex-col gap-1.5", className)}
    >
      <label
        htmlFor={selectId}
        className={cn(
          "text-sm font-medium text-ink-muted",
          isLabelInline && "shrink-0 whitespace-nowrap",
          isLabelHidden && "sr-only"
        )}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "peer w-full cursor-pointer appearance-none rounded-md transition-colors duration-150 ease-out disabled:cursor-default disabled:opacity-50",
            SELECT_CLASSES[variant]
          )}
          onChange={handleChange}
          {...selectProps}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-subtle peer-disabled:opacity-50",
            CHEVRON_CLASSES[variant]
          )}
        />
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
