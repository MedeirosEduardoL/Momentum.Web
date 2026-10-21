import type { CSSProperties } from "react";
import { Toaster as SonnerToaster } from "sonner";

const TOKEN_STYLE = {
  "--normal-bg": "var(--color-glass-strong)",
  "--normal-border": "var(--color-glass-line)",
  "--normal-text": "var(--color-ink)",
  fontFamily: "var(--font-sans)",
} as CSSProperties;

const TOAST_STYLE: CSSProperties = {
  boxShadow: "var(--shadow-overlay)",
};

type ToasterProps = {
  theme: "light" | "dark";
};

export function Toaster({ theme }: ToasterProps) {
  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      closeButton
      style={TOKEN_STYLE}
      toastOptions={{ style: TOAST_STYLE }}
    />
  );
}
