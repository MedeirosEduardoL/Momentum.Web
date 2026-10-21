import { Columns3 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

type EmptyBoardListProps = {
  canAdminister: boolean;
  cardsLink: ReactNode;
  onCreate: () => void;
};

const TITLE = "Este projeto ainda não tem board";

export function EmptyBoardList({ canAdminister, cardsLink, onCreate }: EmptyBoardListProps) {
  if (canAdminister) {
    return (
      <EmptyState
        icon={<Columns3 className="size-6" />}
        title={TITLE}
        description="Um board mostra os cards do projeto em colunas, uma por estado. Crie o primeiro: sem filtro, ele mostra todos os cards."
        action={<Button onClick={onCreate}>Criar o primeiro board</Button>}
      />
    );
  }

  return (
    <EmptyState
      icon={<Columns3 className="size-6" />}
      title={TITLE}
      description="Só o administrador do projeto cria boards: peça a ele o primeiro. Enquanto isso, os cards estão na lista do projeto."
      action={cardsLink}
    />
  );
}
