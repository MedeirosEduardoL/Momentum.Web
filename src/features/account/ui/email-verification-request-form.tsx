import type { ReactNode } from "react";
import { useRequestEmailVerificationMutation } from "../api/account.mutations";
import { EmailRequestForm } from "./email-request-form";

type EmailVerificationRequestFormProps = {
  footer?: ReactNode;
};

export function EmailVerificationRequestForm({ footer }: EmailVerificationRequestFormProps) {
  const request = useRequestEmailVerificationMutation();

  return (
    <EmailRequestForm
      title="Link inválido ou expirado"
      description="Informe o e-mail da conta para receber um link de confirmação novo."
      submitLabel="Reenviar link"
      sentDescription="Se houver uma conta aguardando confirmação com este e-mail, enviamos um link novo. Ele vale por 24 horas."
      request={request}
      footer={footer}
    />
  );
}
