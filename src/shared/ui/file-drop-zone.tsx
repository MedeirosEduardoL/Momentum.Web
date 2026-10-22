import { Upload } from "lucide-react";
import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "./button";

type FileDropZoneProps = {
  label: string;
  hint?: string;
  isBusy?: boolean;
  onFiles: (files: File[]) => void;
};

function hasFiles(event: DragEvent<HTMLDivElement>) {
  return event.dataTransfer.types.includes("Files");
}

export function FileDropZone({ label, hint, isBusy = false, onFiles }: FileDropZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasFiles(event)) {
      return;
    }

    event.preventDefault();
    setIsOver(true);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsOver(false);

    if (!isBusy) {
      onFiles(Array.from(event.dataTransfer.files));
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong bg-well px-4 py-6 text-center transition-colors duration-150 ease-out",
        isOver && "border-accent-text bg-accent-soft"
      )}
    >
      <Upload aria-hidden className="size-5 text-ink-subtle" />
      <p className="text-ink-muted">Arraste os arquivos para cá ou</p>
      <Button
        variant="secondary"
        size="sm"
        isLoading={isBusy}
        aria-describedby={hint ? hintId : undefined}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
      {hint && (
        <p id={hintId} className="text-sm text-ink-subtle">
          {hint}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        tabIndex={-1}
        aria-hidden
        onChange={handleChange}
      />
    </div>
  );
}
