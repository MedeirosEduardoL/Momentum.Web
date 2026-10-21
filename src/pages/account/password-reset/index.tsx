import { useNavigate } from "@tanstack/react-router";
import { PasswordResetForm } from "@/features/account";
import { TextLink } from "@/shared/ui/text-link";

type PasswordResetPageProps = {
  token: string | null;
};

export function PasswordResetPage({ token }: PasswordResetPageProps) {
  const navigate = useNavigate();

  return (
    <PasswordResetForm
      token={token}
      onReset={() =>
        navigate({ to: "/entrar", search: { aviso: "senha-redefinida" }, replace: true })
      }
      newLinkAction={<TextLink to="/esqueci-a-senha">Pedir um link novo</TextLink>}
      footer={<TextLink to="/entrar">Voltar para a tela de entrada</TextLink>}
    />
  );
}
