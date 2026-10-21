import { useState } from "react";
import { AccountIdentity, useGetCurrentAccount } from "@/features/account";
import { CheckboxField } from "@/shared/ui/checkbox-field";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { QueryContent } from "@/shared/ui/query-content";
import { Section } from "@/shared/ui/section";
import { SelectField } from "@/shared/ui/select-field";
import { useGetCurrentOrganization, useListOrganizationMembers } from "../api/organization.queries";
import { useOrganizationMemberActions } from "../model/hooks/use-organization-member-actions";
import {
  isOrganizationAdministrator,
  ORGANIZATION_ROLE_LABELS,
  ORGANIZATION_ROLE_OPTIONS,
} from "../model/lib/organization-role";
import type {
  OrganizationMember,
  OrganizationMemberAiPermissionChange,
  OrganizationMemberRoleChange,
  OrganizationRole,
} from "../model/types/organization.types";

const AI_PERMISSION_LABEL = "Pode usar a IA";

type OwnRoleConfirmationProps = {
  role: OrganizationRole | null;
  onConfirm: (role: OrganizationRole) => void;
  onCancel: () => void;
};

function OwnRoleConfirmation({ role, onConfirm, onCancel }: OwnRoleConfirmationProps) {
  if (role === null) {
    return null;
  }

  return (
    <ConfirmDialog
      open
      title="Mudar o seu próprio papel?"
      description={`Você passa a ser ${ORGANIZATION_ROLE_LABELS[role].toLowerCase()}. Se deixar de administrar a organização, perde o acesso à administração, e só outro administrador desfaz.`}
      confirmLabel="Mudar o meu papel"
      onConfirm={() => onConfirm(role)}
      onCancel={onCancel}
    />
  );
}

type OrganizationMemberRowProps = {
  member: OrganizationMember;
  isSelf: boolean;
  canAdminister: boolean;
  canRemove: boolean;
  isChanging: boolean;
  pendingRoleChange: OrganizationMemberRoleChange | null;
  pendingAiPermissionChange: OrganizationMemberAiPermissionChange | null;
  onRoleChange: (change: OrganizationMemberRoleChange) => void;
  onAiPermissionChange: (change: OrganizationMemberAiPermissionChange) => void;
  onRemove: (member: OrganizationMember) => Promise<void>;
};

function OrganizationMemberRow({
  member,
  isSelf,
  canAdminister,
  canRemove,
  isChanging,
  pendingRoleChange,
  pendingAiPermissionChange,
  onRoleChange,
  onAiPermissionChange,
  onRemove,
}: OrganizationMemberRowProps) {
  const [ownRole, setOwnRole] = useState<OrganizationRole | null>(null);
  const pendingRole = pendingRoleChange?.userId === member.userId ? pendingRoleChange.role : null;

  function changeRole(role: OrganizationRole) {
    if (isSelf) {
      setOwnRole(role);
      return;
    }

    onRoleChange({ userId: member.userId, role });
  }

  function confirmOwnRole(role: OrganizationRole) {
    setOwnRole(null);
    onRoleChange({ userId: member.userId, role });
  }
  const pendingAiPermission =
    pendingAiPermissionChange?.userId === member.userId
      ? pendingAiPermissionChange.isAiEnabled
      : null;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <AccountIdentity userId={member.userId} name={member.name} email={member.email} />
      {canAdminister ? (
        <CheckboxField
          label={AI_PERMISSION_LABEL}
          aria-label={`${member.name} pode usar a IA`}
          className="shrink-0 text-sm text-ink-muted"
          checked={pendingAiPermission ?? member.isAiEnabled}
          disabled={isChanging}
          onChange={event =>
            onAiPermissionChange({ userId: member.userId, isAiEnabled: event.target.checked })
          }
        />
      ) : (
        member.isAiEnabled && <span className="text-sm text-ink-muted">{AI_PERMISSION_LABEL}</span>
      )}
      {canAdminister ? (
        <SelectField
          isLabelHidden
          label={`Papel de ${member.name} na organização`}
          options={ORGANIZATION_ROLE_OPTIONS}
          value={pendingRole ?? member.role}
          disabled={isChanging}
          onValueChange={changeRole}
        />
      ) : (
        <span className="text-sm text-ink-muted">{ORGANIZATION_ROLE_LABELS[member.role]}</span>
      )}
      {canRemove && (
        <ConfirmButton
          title={`Remover ${member.name} da organização?`}
          description="Esta pessoa sai de todos os times e tem as sessões encerradas. O acesso dela à organização termina na hora."
          confirmLabel="Remover"
          onConfirm={() => onRemove(member)}
        >
          Remover
        </ConfirmButton>
      )}
      <OwnRoleConfirmation
        role={ownRole}
        onConfirm={confirmOwnRole}
        onCancel={() => setOwnRole(null)}
      />
    </li>
  );
}

export function OrganizationMemberList() {
  const members = useListOrganizationMembers();
  const organization = useGetCurrentOrganization();
  const account = useGetCurrentAccount();
  const {
    changeRole,
    changeAiPermission,
    remove,
    pendingRoleChange,
    pendingAiPermissionChange,
    isChanging,
  } = useOrganizationMemberActions();
  const canAdminister = isOrganizationAdministrator(organization.data);

  return (
    <Section
      title="Membros"
      description="As pessoas que participam da organização, o papel de cada uma e quem pode usar a IA."
    >
      <QueryContent
        query={members}
        loadingLabel="Carregando os membros…"
        errorTitle="Não foi possível carregar os membros"
      >
        {list =>
          list.length === 0 ? (
            <EmptyState title="A organização ainda não tem membros" />
          ) : (
            <ul className="flex flex-col divide-y divide-line panel">
              {list.map(member => (
                <OrganizationMemberRow
                  key={member.userId}
                  member={member}
                  isSelf={member.userId === account.data?.id}
                  canAdminister={canAdminister}
                  canRemove={canAdminister && member.userId !== account.data?.id}
                  isChanging={isChanging}
                  pendingRoleChange={pendingRoleChange}
                  pendingAiPermissionChange={pendingAiPermissionChange}
                  onRoleChange={changeRole}
                  onAiPermissionChange={changeAiPermission}
                  onRemove={remove}
                />
              ))}
            </ul>
          )
        }
      </QueryContent>
    </Section>
  );
}
