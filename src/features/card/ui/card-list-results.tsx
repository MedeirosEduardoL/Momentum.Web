import { StickyNote } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { EmptyState } from "@/shared/ui/empty-state";
import { Pagination } from "@/shared/ui/pagination";
import { QueryContent } from "@/shared/ui/query-content";
import { useListCards } from "../api/card.queries";
import type { CardListQuery, CardSummary } from "../model/types/card.types";
import { CardListItem } from "./card-list-item";

type CardListResultsProps = {
  query: CardListQuery;
  onPageChange: (page: number) => void;
  renderCardLink: (card: CardSummary) => ReactNode;
};

export function CardListResults({ query, onPageChange, renderCardLink }: CardListResultsProps) {
  const cards = useListCards(query);

  return (
    <QueryContent
      query={cards}
      loadingLabel="Carregando os cards…"
      errorTitle="Não foi possível carregar os cards"
    >
      {page => (
        <>
          {page.cards.length === 0 ? (
            <EmptyState
              icon={<StickyNote className="size-6" />}
              title="Nenhum card por aqui"
              description="Nenhum card do board casa com estes filtros: mude os filtros ou crie um card."
            />
          ) : (
            <div
              aria-busy={cards.isPlaceholderData}
              className={cn(
                "panel overflow-x-auto transition-opacity duration-150 ease-out",
                cards.isPlaceholderData && "opacity-60"
              )}
            >
              <table className="w-full min-w-[40rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line text-xs text-ink-subtle">
                    <th scope="col" className="px-3 py-2 font-medium">
                      ID
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Título
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Tipo
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Estado
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Responsável
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Prioridade
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium max-xl:hidden">
                      Progresso
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {page.cards.map(card => (
                    <CardListItem key={card.id} card={card} titleLink={renderCardLink(card)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {page.totalPages > 1 && (
            <Pagination page={page.page} totalPages={page.totalPages} onPageChange={onPageChange} />
          )}
        </>
      )}
    </QueryContent>
  );
}
