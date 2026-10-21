import type { ReactNode } from "react";
import { useRequestPasswordResetMutation } from "../api/account.mutations";
import { EmailRequestForm } from "./email-request-form";

type PasswordResetRequestFormProps = {
  footer?: ReactNode;
};

export function PasswordResetRequestForm({ footer }: PasswordResetRequestFormProps) {
  const request = useRequestPasswordResetMutation();

  return (
    <EmailRequestForm
      title="Esqueci a senha"
      description="Informe o e-mail da conta e enviaremos um link para escolher uma senha nova."
      submitLabel="Enviar link"
      sentDescription="Se houver uma conta com este e-mail, enviamos um link para escolher uma senha nova. Ele vale por 1 hora."
      request={request}
      footer={footer}
    />
  );
}
