import { createContext, useContext, type ReactNode } from "react";
import type { CardTask } from "../types/card.types";

export type CardExtensions = {
  renderSubitemAttachments?: (task: CardTask, projectId: string) => ReactNode;
};

export const CardExtensionsContext = createContext<CardExtensions>({});

export function useCardExtensions() {
  return useContext(CardExtensionsContext);
}
