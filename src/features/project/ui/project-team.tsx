import { useState } from "react";
import { useGetCurrentAccount } from "@/features/account";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Modal } from "@/shared/ui/modal";
import { QueryContent } from "@/shared/ui/query-content";
import { Section } from "@/shared/ui/section";
import { useListProjectMembers } from "../api/project.queries";
import { useProjectMemberActions } from "../model/hooks/use-project-member-actions";
import { canAdministerProject } from "../model/lib/project-role";
import type { Project } from "../model/types/project.types";
import { ProjectMemberForm } from "./project-member-form";
import { ProjectMemberRow } from "./project-member-row";

type ProjectTeamProps = {
  project: Project;
};

export function ProjectTeam({ project }: ProjectTeamProps) {
  const team = useListProjectMembers(project.id);
  const { changeRole, remove, pendingRoleChange } = useProjectMemberActions(project.id);
  const account = useGetCurrentAccount();
  const [isAdding, setIsAdding] = useState(false);
  const canAdminister = canAdministerProject(project);

  return (
    <Section
      title={`Time de ${project.name}`}
      description={`As pessoas que são membros do projeto ${project.key} e o papel de cada uma.`}
      action={
        canAdminister && (
          <Button size="sm" disabled={!team.data} onClick={() => setIsAdding(true)}>
            Incluir no time
          </Button>
        )
      }
    >
      <QueryContent
        query={team}
        loadingLabel="Carregando o time…"
        errorTitle="Não foi possível carregar o time"
      >
        {members => (
          <>
            {members.length === 0 ? (
              <EmptyState
                title="O time ainda não tem ninguém"
                description="Só quem está no time, ou administra a organização, enxerga o projeto."
              />
            ) : (
              <ul className="flex flex-col divide-y divide-line panel">
                {members.map(member => (
                  <ProjectMemberRow
                    key={member.userId}
                    member={member}
                    isSelf={member.userId === account.data?.id}
                    canAdminister={canAdminister}
                    pendingRoleChange={pendingRoleChange}
                    onRoleChange={changeRole}
                    onRemove={remove}
                  />
                ))}
              </ul>
            )}
            <Modal
              open={isAdding}
              onOpenChange={setIsAdding}
              title="Incluir no time"
              description={`Escolha alguém da organização para o time de ${project.name}.`}
            >
              <ProjectMemberForm
                projectId={project.id}
                team={members}
                onAdded={() => setIsAdding(false)}
              />
            </Modal>
          </>
        )}
      </QueryContent>
    </Section>
  );
}
