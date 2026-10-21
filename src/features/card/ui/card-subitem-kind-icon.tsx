import { Bug, ListChecks, OctagonAlert, type LucideIcon } from "lucide-react";
import type { CardTaskKind } from "../model/types/card.types";

type CardSubitemKindIconProps = {
  kind: CardTaskKind;
};

const KIND_ICONS: Record<CardTaskKind, LucideIcon> = {
  task: ListChecks,
  bug: Bug,
  impediment: OctagonAlert,
};

export function CardSubitemKindIcon({ kind }: CardSubitemKindIconProps) {
  const Icon = KIND_ICONS[kind];

  return <Icon aria-hidden className="size-3.5 shrink-0" />;
}
