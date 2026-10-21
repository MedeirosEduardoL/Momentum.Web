import { EmptyState } from "@/shared/ui/empty-state";
import { TextLink } from "@/shared/ui/text-link";

export function NotFoundPage() {
  return (
    <EmptyState
      title="Página não encontrada"
      description="O endereço não existe ou mudou."
      action={<TextLink to="/">Voltar ao início</TextLink>}
    />
  );
}
