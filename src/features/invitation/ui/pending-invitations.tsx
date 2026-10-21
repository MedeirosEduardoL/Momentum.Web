import { useState } from "react";
import { useListProjects } from "@/features/project";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { QueryContent } from "@/shared/ui/query-content";
import { Section } from "@/shared/ui/section";
import { InvitationForm } from "./invitation-form";
import { PendingInvitationList } from "./pending-invitation-list";

export function PendingInvitations() {
  const projects = useListProjects();
  const [isInviting, setIsInviting] = useState(false);

  return (
    <Section
      title="Convites"
      description="Convites enviados que ainda não foram aceitos. Cada convite vale 7 dias a partir do último envio."
      action={
        <Button size="sm" disabled={!projects.data} onClick={() => setIsInviting(true)}>
          Convidar pessoa
        </Button>
      }
    >
      <QueryContent
        query={projects}
        loadingLabel="Carregando os projetos…"
        errorTitle="Não foi possível carregar os projetos"
      >
        {list => (
          <>
            <PendingInvitationList projects={list} />
            <Modal
              open={isInviting}
              onOpenChange={setIsInviting}
              title="Convidar pessoa"
              description="A pessoa recebe por e-mail um link para entrar na organização, que vale 7 dias."
            >
              <InvitationForm projects={list} onInvited={() => setIsInviting(false)} />
            </Modal>
          </>
        )}
      </QueryContent>
    </Section>
  );
}
