import { useState } from "react";
import { useForm } from "react-hook-form";
import { useListProjects } from "@/features/project";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useCreateCardRelationMutation } from "../../api/card.mutations";
import { useListCards } from "../../api/card.queries";
import { NO_CARD } from "../lib/card-options";
import { cardRelationSchema, type CardRelationFormValues } from "../schemas/card-relation.schema";
import type { Card } from "../types/card.types";

type CreateCardRelationOptions = {
  card: Card;
  onCreated: () => void;
};

type CandidateSearch = {
  projectId: string;
  term: string;
};

const FIRST_PAGE = 1;

const cardRelationResolver = zodResolver(cardRelationSchema);

export function useCreateCardRelation({ card, onCreated }: CreateCardRelationOptions) {
  const projects = useListProjects();
  const createRelation = useCreateCardRelationMutation();
  const [search, setSearch] = useState<CandidateSearch>({ projectId: card.projectId, term: "" });
  const candidates = useListCards({
    projectId: search.projectId,
    search: search.term || undefined,
    includesArchived: false,
    page: FIRST_PAGE,
  });
  const form = useForm<CardRelationFormValues>({
    resolver: cardRelationResolver,
    defaultValues: { relation: "related", relatedCardId: NO_CARD },
  });

  function browse(nextSearch: CandidateSearch) {
    setSearch(nextSearch);
    form.setValue("relatedCardId", NO_CARD);
  }

  const onSubmit = form.handleSubmit(async values => {
    try {
      await createRelation.mutateAsync({ cardId: card.id, ...values });
      onCreated();
    } catch (error) {
      applyApiErrors(form, error);
    }
  });

  return {
    form,
    onSubmit,
    isSaving: createRelation.isPending,
    projects,
    candidates,
    candidateProjectId: search.projectId,
    searchTerm: search.term,
    changeProject: (projectId: string) => browse({ ...search, projectId }),
    changeSearch: (term: string) => browse({ ...search, term: term.trim() }),
  };
}
