import { MailPlus } from "lucide-react";
import { ORGANIZATION_ROLE_LABELS } from "@/features/organization";
import type { Project } from "@/features/project";
import { Button } from "@/shared/ui/button";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { EmptyState } from "@/shared/ui/empty-state";
import { QueryContent } from "@/shared/ui/query-content";
import { useListPendingInvitations } from "../api/invitation.queries";
import { useInvitationActions } from "../model/hooks/use-invitation-actions";
import { describeInvitationProjects } from "../model/lib/invitation-projects";
import { describeInvitationValidity } from "../model/lib/invitation-validity";
import type { PendingInvitation } from "../model/types/invitation.types";

type PendingInvitationListProps = {
  projects: Project[];
};

type PendingInvitationRowProps = {
  invitation: PendingInvitation;
  projects: Project[];
  listedAt: Date;
  isResending: boolean;
  onResend: (invitation: PendingInvitation) => void;
  onCancel: (invitation: PendingInvitation) => Promise<void>;
};

function PendingInvitationRow({
  invitation,
  projects,
  listedAt,
  isResending,
  onResend,
  onCancel,
}: PendingInvitationRowProps) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{invitation.email}</span>
        <span className="text-sm text-ink-muted">
          {ORGANIZATION_ROLE_LABELS[invitation.role]} ·{" "}
          {describeInvitationValidity(invitation.expiresAt, listedAt)}
        </span>
        <span className="truncate text-sm text-ink-subtle">
          {describeInvitationProjects(invitation.projects, projects)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        isLoading={isResending}
        onClick={() => onResend(invitation)}
      >
        Reenviar
      </Button>
      <ConfirmButton
        title={`Cancelar o convite de ${invitation.email}?`}
        description="O link que esta pessoa recebeu deixa de valer."
        confirmLabel="Cancelar convite"
        onConfirm={() => onCancel(invitation)}
      >
        Cancelar
      </ConfirmButton>
    </li>
  );
}

export function PendingInvitationList({ projects }: PendingInvitationListProps) {
  const invitations = useListPendingInvitations();
  const { resend, cancel, resendingInvitationId } = useInvitationActions();
  const listedAt = new Date(invitations.dataUpdatedAt);

  return (
    <QueryContent
      query={invitations}
      loadingLabel="Carregando os convites…"
      errorTitle="Não foi possível carregar os convites"
    >
      {list =>
        list.length === 0 ? (
          <EmptyState
            icon={<MailPlus className="size-6" />}
            title="Nenhum convite pendente"
            description="Convide uma pessoa por e-mail, já com o papel dela na organização e nos projetos."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-line panel">
            {list.map(invitation => (
              <PendingInvitationRow
                key={invitation.id}
                invitation={invitation}
                projects={projects}
                listedAt={listedAt}
                isResending={resendingInvitationId === invitation.id}
                onResend={resend}
                onCancel={cancel}
              />
            ))}
          </ul>
        )
      }
    </QueryContent>
  );
}
