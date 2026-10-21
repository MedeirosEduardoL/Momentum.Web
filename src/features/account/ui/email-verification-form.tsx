import type { ReactNode } from "react";
import { getApiErrorMessage } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { LoadingState } from "@/shared/ui/loading-state";
import { Panel } from "@/shared/ui/panel";
import { TextField } from "@/shared/ui/text-field";
import { useEmailVerification } from "../model/hooks/use-email-verification";
import { EmailVerificationRequestForm } from "./email-verification-request-form";

type EmailVerificationFormProps = {
  token: string | null;
  onVerified: () => void;
  alreadyVerifiedActions: ReactNode;
  footer?: ReactNode;
};

export function EmailVerificationForm({
  token,
  onVerified,
  alreadyVerifiedActions,
  footer,
}: EmailVerificationFormProps) {
  const { form, onSubmit, view, failure, retryPreview, isSaving } = useEmailVerification({
    token,
    onVerified,
  });
  const { errors } = form.formState;

  if (view === "loading") {
    return (
      <Panel title="Confirmar e-mail">
        <LoadingState label="Carregando o link…" />
      </Panel>
    );
  }

  if (view === "unavailable") {
    return (
      <Panel title="Não foi possível carregar o link" description={getApiErrorMessage(failure)}>
        <Button variant="secondary" onClick={retryPreview}>
          Tentar de novo
        </Button>
      </Panel>
    );
  }

  if (view === "invalid") {
    return <EmailVerificationRequestForm footer={footer} />;
  }

  if (view === "already-verified") {
    return (
      <Panel
        title="E-mail já confirmado"
        description={getApiErrorMessage(failure)}
        footer={alreadyVerifiedActions}
      />
    );
  }

  return (
    <Panel
      title="Confirmar e-mail"
      description="Para ativar a conta, confira o seu nome e escolha a senha que você vai usar para entrar."
      footer={footer}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Nome"
          autoComplete="name"
          hint="O nome informado no cadastro; corrija se não for o seu."
          error={errors.name?.message}
          {...form.register("name")}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          hint="De 10 a 128 caracteres."
          error={errors.password?.message}
          {...form.register("password")}
        />
        <Button type="submit" isLoading={isSaving}>
          Confirmar e-mail
        </Button>
      </form>
    </Panel>
  );
}
