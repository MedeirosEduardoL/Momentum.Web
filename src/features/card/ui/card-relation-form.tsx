import { Button } from "@/shared/ui/button";
import { Notice } from "@/shared/ui/notice";
import { QueryContent } from "@/shared/ui/query-content";
import { SearchField } from "@/shared/ui/search-field";
import { SelectField } from "@/shared/ui/select-field";
import { useCreateCardRelation } from "../model/hooks/use-create-card-relation";
import {
  CARD_RELATION_OPTIONS,
  NO_CARD_OPTION,
  toProjectOptions,
  toRelatedCardOptions,
} from "../model/lib/card-options";
import { CARD_LIMITS } from "../model/schemas/card.schema";
import type { Card } from "../model/types/card.types";

type CardRelationFormProps = {
  card: Card;
  onCreated: () => void;
};

export function CardRelationForm({ card, onCreated }: CardRelationFormProps) {
  const { form, onSubmit, isSaving, projects, candidates, ...search } = useCreateCardRelation({
    card,
    onCreated,
  });
  const { errors } = form.formState;

  return (
    <QueryContent
      query={projects}
      loadingLabel="Carregando os projetos…"
      errorTitle="Não foi possível carregar os projetos"
    >
      {projectList => (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <SelectField
            label="Relação"
            options={CARD_RELATION_OPTIONS}
            error={errors.relation?.message}
            {...form.register("relation")}
          />
          <SelectField
            label="Projeto do outro card"
            options={toProjectOptions(projectList)}
            value={search.candidateProjectId}
            onValueChange={search.changeProject}
          />
          <SearchField
            label="Buscar o outro card"
            hint="Pelo identificador no projeto escolhido ou por um trecho do título. Card arquivado não aparece."
            maxLength={CARD_LIMITS.search}
            onSearch={search.changeSearch}
          />
          <QueryContent
            query={candidates}
            loadingLabel="Carregando os cards…"
            errorTitle="Não foi possível carregar os cards"
          >
            {page => {
              const cardOptions = toRelatedCardOptions(page.cards, card.id);

              return (
                <>
                  <SelectField
                    label="Card"
                    options={[NO_CARD_OPTION, ...cardOptions]}
                    disabled={candidates.isPlaceholderData}
                    error={errors.relatedCardId?.message}
                    {...form.register("relatedCardId")}
                  />
                  {cardOptions.length === 0 && (
                    <Notice>
                      {search.searchTerm
                        ? "Nenhum card deste projeto combina com a busca."
                        : "Este projeto não tem outro card para relacionar."}
                    </Notice>
                  )}
                  {page.totalPages > 1 && (
                    <p className="text-sm text-ink-subtle">
                      Há mais cards do que os mostrados: refine a busca para achar o que procura.
                    </p>
                  )}
                </>
              );
            }}
          </QueryContent>
          <Button type="submit" isLoading={isSaving}>
            Criar relação
          </Button>
        </form>
      )}
    </QueryContent>
  );
}
