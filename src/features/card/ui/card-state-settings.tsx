import { Button } from "@/shared/ui/button";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { Modal } from "@/shared/ui/modal";
import { QueryContent } from "@/shared/ui/query-content";
import { Section } from "@/shared/ui/section";
import { SelectField } from "@/shared/ui/select-field";
import { TextField } from "@/shared/ui/text-field";
import { useListCardStates } from "../api/card.queries";
import { useCardStateSettings } from "../model/hooks/use-card-state-settings";
import { CARD_STATE_CATEGORY_LABELS, CARD_STATE_CATEGORY_OPTIONS } from "../model/lib/card-options";
import type { CardState } from "../model/types/card.types";

type CardStateSettings = ReturnType<typeof useCardStateSettings>;

type CardStateRowProps = {
  state: CardState;
  isFirst: boolean;
  isLast: boolean;
  canAdminister: boolean;
  settings: CardStateSettings;
};

function CardStateRow({ state, isFirst, isLast, canAdminister, settings }: CardStateRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="flex-1 font-medium">{state.name}</span>
      <span className="text-sm text-ink-muted">{CARD_STATE_CATEGORY_LABELS[state.category]}</span>
      {canAdminister && (
        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Subir ${state.name}`}
            disabled={isFirst || settings.isBusy}
            onClick={() => settings.move(state, state.position - 1)}
          >
            Subir
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Descer ${state.name}`}
            disabled={isLast || settings.isBusy}
            onClick={() => settings.move(state, state.position + 1)}
          >
            Descer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Editar ${state.name}`}
            onClick={() => settings.startEditing(state)}
          >
            Editar
          </Button>
          <ConfirmButton
            title={`Excluir o estado ${state.name}?`}
            description="Só sai o estado que não tem card, e o projeto precisa de pelo menos um estado."
            confirmLabel="Excluir estado"
            disabled={settings.isBusy}
            onConfirm={() => settings.remove(state)}
          >
            Excluir
          </ConfirmButton>
        </div>
      )}
    </li>
  );
}

type CardStateFormModalProps = {
  settings: CardStateSettings;
};

function CardStateFormModal({ settings }: CardStateFormModalProps) {
  const { errors } = settings.form.formState;

  return (
    <Modal
      open={settings.editing !== null}
      onOpenChange={open => !open && settings.stopEditing()}
      title={settings.editing?.kind === "existing" ? "Editar estado" : "Novo estado"}
      description="A categoria diz se o card está a fazer, em andamento, concluído ou cancelado; é ela que a conclusão, o progresso e a IA leem."
    >
      <form onSubmit={settings.onSubmit} noValidate className="flex flex-col gap-4">
        <TextField label="Nome" error={errors.name?.message} {...settings.form.register("name")} />
        <SelectField
          label="Categoria"
          options={CARD_STATE_CATEGORY_OPTIONS}
          error={errors.category?.message}
          {...settings.form.register("category")}
        />
        <div>
          <Button type="submit" isLoading={settings.isSaving}>
            Salvar estado
          </Button>
        </div>
      </form>
    </Modal>
  );
}

type CardStateSettingsProps = {
  projectId: string;
  projectName: string;
  canAdminister: boolean;
};

export function CardStateSettings({
  projectId,
  projectName,
  canAdminister,
}: CardStateSettingsProps) {
  const states = useListCardStates(projectId);
  const settings = useCardStateSettings(projectId);

  return (
    <Section
      title={`Estados de ${projectName}`}
      description="O fluxo dos cards deste projeto, na ordem das colunas do board."
      action={
        canAdminister && (
          <Button size="sm" onClick={settings.startNew}>
            Novo estado
          </Button>
        )
      }
    >
      <QueryContent
        query={states}
        loadingLabel="Carregando os estados…"
        errorTitle="Não foi possível carregar os estados"
      >
        {list => (
          <ol className="flex flex-col divide-y divide-line panel">
            {list.map((state, index) => (
              <CardStateRow
                key={state.id}
                state={state}
                isFirst={index === 0}
                isLast={index === list.length - 1}
                canAdminister={canAdminister}
                settings={settings}
              />
            ))}
          </ol>
        )}
      </QueryContent>
      <CardStateFormModal settings={settings} />
    </Section>
  );
}
