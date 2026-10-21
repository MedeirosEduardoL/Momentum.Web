import type { ReactNode } from "react";
import { type Account, useGetCurrentAccount } from "@/features/account";
import { getApiErrorMessage } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { LoadingState } from "@/shared/ui/loading-state";
import { Notice } from "@/shared/ui/notice";
import { Panel } from "@/shared/ui/panel";
import { TextField } from "@/shared/ui/text-field";
import { useAcceptInvitation } from "../model/hooks/use-accept-invitation";
import { otherSignedInAccount } from "../model/lib/signed-in-account";

type InvitationAcceptanceFormProps = {
  token: string | null;
  onAccepted: () => void;
  onSessionNotOpened: () => void;
  footer?: ReactNode;
};

type SignedInAsAnotherAccountProps = {
  account: Account | null;
  invitedEmail: string;
};

function SignedInAsAnotherAccount({ account, invitedEmail }: SignedInAsAnotherAccountProps) {
  if (!account) {
    return null;
  }

  return (
    <Notice>
      Você está conectado como {account.name} ({account.email}). Ao aceitar o convite, a sessão
      passa para a conta {invitedEmail}.
    </Notice>
  );
}

export function InvitationAcceptanceForm({
  token,
  onAccepted,
  onSessionNotOpened,
  footer,
}: InvitationAcceptanceFormProps) {
  const { form, onSubmit, view, preview, previewError, retryPreview, isSaving } =
    useAcceptInvitation({ token, onAccepted, onSessionNotOpened });
  const account = useGetCurrentAccount();
  const { errors } = form.formState;

  if (view === "loading") {
    return (
      <Panel title="Aceitar convite">
        <LoadingState label="Carregando o convite…" />
      </Panel>
    );
  }

  if (view === "unavailable") {
    return (
      <Panel
        title="Não foi possível carregar o convite"
        description={getApiErrorMessage(previewError)}
      >
        <Button variant="secondary" onClick={retryPreview}>
          Tentar de novo
        </Button>
      </Panel>
    );
  }

  if (view === "invalid" || !preview) {
    return (
      <Panel
        title="Convite inválido"
        description="Este convite é inválido, expirou ou foi cancelado. Peça um novo ao administrador da organização."
        footer={footer}
      />
    );
  }

  return (
    <Panel
      title="Aceitar convite"
      description={`Você recebeu um convite para a organização ${preview.organizationName}.`}
      footer={footer}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <SignedInAsAnotherAccount
          account={otherSignedInAccount(account.data, preview.email)}
          invitedEmail={preview.email}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="username"
          value={preview.email}
          readOnly
        />
        {!preview.accountExists && (
          <TextField
            label="Nome"
            autoComplete="name"
            error={errors.name?.message}
            {...form.register("name")}
          />
        )}
        <TextField
          label={preview.accountExists ? "Senha da sua conta" : "Senha nova"}
          type="password"
          autoComplete={preview.accountExists ? "current-password" : "new-password"}
          hint={preview.accountExists ? undefined : "De 10 a 128 caracteres."}
          error={errors.password?.message}
          {...form.register("password")}
        />
        <Button type="submit" isLoading={isSaving}>
          Aceitar convite
        </Button>
      </form>
    </Panel>
  );
}
