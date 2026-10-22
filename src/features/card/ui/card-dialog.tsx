import { Maximize2, Pencil } from "lucide-react";
import { useState } from "react";
import { ActionMenu } from "@/shared/ui/action-menu";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { QueryContent } from "@/shared/ui/query-content";
import { useGetCard } from "../api/card.queries";
import type { Card } from "../model/types/card.types";
import { CardHeaderMeta } from "./card-header-meta";
import { CardIdentifier } from "./card-identifier";
import { CardWorkItem, type CardWorkItemRenderers, type CardWorkItemTab } from "./card-work-item";

type CardDialogProps = CardWorkItemRenderers & {
  cardId: string;
  onClose: () => void;
  onOpenPage: (card: Card) => void;
};

export function CardDialog({ cardId, onClose, onOpenPage, ...renderers }: CardDialogProps) {
  const card = useGetCard(cardId);
  const [tab, setTab] = useState<CardWorkItemTab>("detalhes");
  const [isEditing, setIsEditing] = useState(false);
  const loaded = card.data;

  function startEditing() {
    setTab("detalhes");
    setIsEditing(true);
  }

  return (
    <Modal
      open
      size="xl"
      onOpenChange={open => !open && onClose()}
      title={loaded?.title ?? "Carregando o card"}
      eyebrow={loaded && <CardIdentifier card={loaded} />}
      meta={loaded && <CardHeaderMeta card={loaded} />}
      headerActions={
        loaded && (
          <>
            {!isEditing && (
              <Button variant="secondary" size="sm" onClick={startEditing}>
                <Pencil aria-hidden />
                Editar
              </Button>
            )}
            <ActionMenu
              label={`Mais ações de ${loaded.identifier}`}
              items={[
                {
                  label: "Abrir em página inteira",
                  icon: <Maximize2 aria-hidden />,
                  onSelect: () => onOpenPage(loaded),
                },
              ]}
            />
          </>
        )
      }
    >
      <QueryContent
        query={card}
        loadingLabel="Carregando o card…"
        errorTitle="Não foi possível carregar o card"
      >
        {current => (
          <CardWorkItem
            card={current}
            tab={tab}
            onTabChange={setTab}
            isEditing={isEditing}
            onEditDone={() => setIsEditing(false)}
            {...renderers}
          />
        )}
      </QueryContent>
    </Modal>
  );
}
