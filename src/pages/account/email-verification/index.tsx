import { useNavigate } from "@tanstack/react-router";
import { EmailVerificationForm } from "@/features/account";
import { TextLink } from "@/shared/ui/text-link";

type EmailVerificationPageProps = {
  token: string | null;
};

export function EmailVerificationPage({ token }: EmailVerificationPageProps) {
  const navigate = useNavigate();

  return (
    <EmailVerificationForm
      token={token}
      onVerified={() =>
        navigate({ to: "/entrar", search: { aviso: "email-confirmado" }, replace: true })
      }
      alreadyVerifiedActions={
        <>
          <TextLink to="/entrar">Entrar</TextLink>
          <TextLink to="/esqueci-a-senha">Trocar a senha</TextLink>
        </>
      }
      footer={<TextLink to="/entrar">Ir para a tela de entrada</TextLink>}
    />
  );
}
