import type { ReactNode } from "react";
import { QueryContent } from "@/shared/ui/query-content";
import { Screen } from "@/shared/ui/screen";
import { useGetEpic } from "../api/feature.queries";
import { useEditEpic } from "../model/hooks/use-edit-epic";
import type { Epic } from "../model/types/feature.types";
import { GroupForm } from "./group-form";

type EditEpicFormProps = {
  epicId: string;
  backLink: ReactNode;
  onSaved: () => void;
};

type EpicFieldsProps = {
  epic: Epic;
  onSaved: () => void;
};

function EpicFields({ epic, onSaved }: EpicFieldsProps) {
  const edition = useEditEpic({ epic, onSaved });

  return <GroupForm {...edition} submitLabel="Salvar epic" />;
}

export function EditEpicForm({ epicId, backLink, onSaved }: EditEpicFormProps) {
  const epic = useGetEpic(epicId);

  return (
    <QueryContent
      query={epic}
      loadingLabel="Carregando o epic…"
      errorTitle="Não foi possível carregar o epic"
    >
      {loadedEpic => (
        <Screen backLink={backLink} title="Editar epic">
          <EpicFields epic={loadedEpic} onSaved={onSaved} />
        </Screen>
      )}
    </QueryContent>
  );
}
