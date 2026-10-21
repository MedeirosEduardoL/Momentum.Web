import { AccountIdentity } from "@/features/account";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { SelectField } from "@/shared/ui/select-field";
import { PROJECT_ROLE_LABELS, PROJECT_ROLE_OPTIONS } from "../model/lib/project-role";
import type {
  ProjectMember,
  ProjectMemberAssignment,
  ProjectRole,
} from "../model/types/project.types";

type ProjectMemberRowProps = {
  member: ProjectMember;
  isSelf: boolean;
  canAdminister: boolean;
  pendingRoleChange: ProjectMemberAssignment | null;
  onRoleChange: (userId: string, role: ProjectRole) => void;
  onRemove: (member: ProjectMember) => Promise<void>;
};

function removalOf(member: ProjectMember, isSelf: boolean) {
  return isSelf
    ? {
        title: "Sair do time do projeto?",
        description:
          "Você deixa de enxergar o projeto, a não ser que administre a organização, e os cards em que você é responsável ficam sem responsável.",
        label: "Sair do time",
      }
    : {
        title: `Tirar ${member.name} do time?`,
        description:
          "Quem sai do time deixa de enxergar o projeto, a não ser que seja administrador da organização, e os cards em que é responsável ficam sem responsável.",
        label: "Tirar do time",
      };
}

export function ProjectMemberRow({
  member,
  isSelf,
  canAdminister,
  pendingRoleChange,
  onRoleChange,
  onRemove,
}: ProjectMemberRowProps) {
  const pendingRole = pendingRoleChange?.userId === member.userId ? pendingRoleChange.role : null;
  const removal = removalOf(member, isSelf);

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <AccountIdentity userId={member.userId} name={member.name} email={member.email} />
      {canAdminister ? (
        <>
          <SelectField
            isLabelHidden
            label={`Papel de ${member.name} no projeto`}
            options={PROJECT_ROLE_OPTIONS}
            value={pendingRole ?? member.role}
            disabled={pendingRoleChange !== null}
            onValueChange={role => onRoleChange(member.userId, role)}
          />
          <ConfirmButton
            title={removal.title}
            description={removal.description}
            confirmLabel={removal.label}
            onConfirm={() => onRemove(member)}
          >
            {removal.label}
          </ConfirmButton>
        </>
      ) : (
        <span className="text-sm text-ink-muted">{PROJECT_ROLE_LABELS[member.role]}</span>
      )}
    </li>
  );
}
