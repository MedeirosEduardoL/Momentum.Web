import type { ReactNode } from "react";
import { Notice } from "@/shared/ui/notice";
import { QueryContent } from "@/shared/ui/query-content";
import { useListBoardColumns } from "../api/board.queries";
import type { BoardColumns, BoardColumnsQuery, BoardFilter } from "../model/types/board.types";

type BoardColumnsContentProps = {
  query: BoardColumnsQuery;
  savedFilter: BoardFilter;
  renderColumns: (columns: BoardColumns) => ReactNode;
};

function describeEmptyBoard({ assigneeId, isUnassigned }: BoardColumnsQuery) {
  if (isUnassigned) {
    return "Nenhum card sem responsável casa com o filtro do board.";
  }

  return assigneeId
    ? "Nenhum card deste responsável casa com o filtro do board."
    : "Nenhum card casa com o filtro deste board.";
}

export function BoardColumnsContent({
  query,
  savedFilter,
  renderColumns,
}: BoardColumnsContentProps) {
  const columns = useListBoardColumns(query);

  async function reload() {
    const reloaded = await columns.refetch();

    return reloaded.isSuccess ? reloaded.data : undefined;
  }

  return (
    <QueryContent
      query={columns}
      loadingLabel="Carregando os cards do board…"
      errorTitle="Não foi possível carregar o board"
    >
      {columnList => (
        <>
          {columnList.every(column => column.totalCount === 0) && (
            <Notice>{describeEmptyBoard(query)}</Notice>
          )}
          {renderColumns({ columns: columnList, savedFilter, reload })}
        </>
      )}
    </QueryContent>
  );
}
