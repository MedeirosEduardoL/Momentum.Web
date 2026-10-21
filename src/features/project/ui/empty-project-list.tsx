import { FolderOpen } from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";

export function EmptyProjectList() {
  return (
    <EmptyState
      icon={<FolderOpen className="size-6" />}
      title="Você ainda não está em nenhum time"
      description="Peça a um administrador da organização para incluir você no time de um projeto."
    />
  );
}
