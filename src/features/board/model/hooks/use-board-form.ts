import { useForm } from "react-hook-form";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { keepExistingReferences, NO_FILTER } from "../lib/board-filter";
import { boardSchema, type BoardFormValues } from "../schemas/board.schema";
import type { Board, BoardDefinition, BoardFilterOptions } from "../types/board.types";

type BoardFormOptions = {
  board?: BoardDefinition;
  options: BoardFilterOptions;
  save: (definition: BoardDefinition) => Promise<Board>;
  isSaving: boolean;
  onSaved: (board: Board) => void;
};

const NO_BOARD: BoardDefinition = { name: "", filter: NO_FILTER };
const FILTER_ERROR_FIELD = "root.filter";

const boardResolver = zodResolver(boardSchema);

export function useBoardForm({
  board = NO_BOARD,
  options,
  save,
  isSaving,
  onSaved,
}: BoardFormOptions) {
  const form = useForm<BoardFormValues>({
    resolver: boardResolver,
    defaultValues: { name: board.name, ...board.filter },
  });

  const onSubmit = form.handleSubmit(async ({ name, ...filter }) => {
    try {
      onSaved(await save({ name, filter: keepExistingReferences(filter, options) }));
    } catch (error) {
      applyApiErrors(form, error, { filter: FILTER_ERROR_FIELD });
    }
  });

  return { form, onSubmit, isSaving, filterError: form.formState.errors.root?.filter?.message };
}
