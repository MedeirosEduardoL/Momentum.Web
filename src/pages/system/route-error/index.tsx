import { useRouter } from "@tanstack/react-router";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

export function RouteErrorPage() {
  const router = useRouter();

  return (
    <EmptyState
      title="Algo deu errado"
      description="Não foi possível carregar esta tela."
      action={
        <Button variant="secondary" onClick={() => router.invalidate()}>
          Tentar de novo
        </Button>
      }
    />
  );
}
