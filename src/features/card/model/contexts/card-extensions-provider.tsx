import type { ReactNode } from "react";
import { CardExtensionsContext, type CardExtensions } from "./card-extensions-context";

type CardExtensionsProviderProps = {
  value: CardExtensions;
  children: ReactNode;
};

export function CardExtensionsProvider({ value, children }: CardExtensionsProviderProps) {
  return <CardExtensionsContext value={value}>{children}</CardExtensionsContext>;
}
