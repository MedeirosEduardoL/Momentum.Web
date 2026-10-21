import { useNavigate } from "@tanstack/react-router";
import { InvitationAcceptanceForm } from "@/features/invitation";
import { TextLink } from "@/shared/ui/text-link";

type InvitationAcceptancePageProps = {
  token: string | null;
};

export function InvitationAcceptancePage({ token }: InvitationAcceptancePageProps) {
  const navigate = useNavigate();

  return (
    <InvitationAcceptanceForm
      token={token}
      onAccepted={() => navigate({ to: "/", replace: true })}
      onSessionNotOpened={() =>
        navigate({ to: "/entrar", search: { aviso: "convite-aceito" }, replace: true })
      }
      footer={<TextLink to="/entrar">Ir para a tela de entrada</TextLink>}
    />
  );
}
