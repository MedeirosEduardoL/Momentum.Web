import { PasswordResetRequestForm } from "@/features/account";
import { TextLink } from "@/shared/ui/text-link";

export function PasswordResetRequestPage() {
  return (
    <PasswordResetRequestForm
      footer={<TextLink to="/entrar">Voltar para a tela de entrada</TextLink>}
    />
  );
}
