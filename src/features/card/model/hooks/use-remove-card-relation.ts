import { toast } from "sonner";
import { toastApiError } from "@/shared/api/toast-api-error";
import { useDeleteCardRelationMutation } from "../../api/card.mutations";
import type { CardRelation } from "../types/card.types";

export function useRemoveCardRelation() {
  const removal = useDeleteCardRelationMutation();

  return async function removeCardRelation(relation: CardRelation) {
    try {
      await removal.mutateAsync(relation.id);
      toast.success(`A relação com ${relation.card.identifier} foi desfeita.`);
    } catch (error) {
      toastApiError(error);
    }
  };
}
