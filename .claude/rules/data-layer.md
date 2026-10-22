---
paths:
  - "src/features/**/api/**"
  - "src/shared/api/**"
  - "src/app/api/**"
---

# Dados e API: service → query → mutation

Axios e TanStack Query sobre o contrato do Momentum.Core.

## Contrato com o Core

- A API responde JSON snake_case, sem envelope. Os tipos dela vêm de
  `src/shared/api/generated/`, gerados do `../Momentum.Core/openapi.json` (`npm run api:types`) e nunca
  editados à mão — o hook de edição bloqueia.
- O service da feature adapta o DTO para o tipo interno camelCase; nenhuma outra camada vê
  snake_case.
- Erro chega como `application/problem+json`: `title`, `status`, `trace_id` e `errors[]` com
  `code`, `details`, `property` e `metadata`. O client de `shared/api` o converte num erro tipado;
  a UI reage pelo `code` (contrato estável), mostra o `details` (já em português) e nunca mostra
  mensagem técnica.
- `424` (falha em serviço externo, como o provedor de IA ou outra integração) e `429` (limite) pedem "tente
  de novo" com o tempo de `metadata`, não "erro interno".
- Mudou o `openapi.json` do Core: regere os tipos e ajuste os services na mesma entrega do Web.

## Client HTTP

Vive em `shared/api/client.ts` (`api`): timeout, credenciais, `X-Requested-With` em toda
requisição, cancelamento pelo `signal` e normalização de erro em `ApiError` (`api-error.ts`). Sem
`baseURL`: front e API ficam na mesma origem, atrás do Kong (ADR 0003 do Core), e o caminho da
chamada é o mesmo do `openapi.json` (`/api/v1/cards`). No desenvolvimento, o proxy do Vite repassa
`/api` ao Kong local (`127.0.0.1:8010`). Comportamento de sessão (401, redirect) é ligado por
callback que `app/` registra, sem inverter a dependência. Políticas diferentes viram clients
nomeados pela política (`api`, `silentApi`), não pelo domínio. Resposta em `text/event-stream` a
um `POST` passa por `postEventStream` (`shared/api/event-stream.ts`), com `fetch` e não
`EventSource`: manda o `X-Requested-With`, renova a sessão no 401 e repete uma vez, e entrega os
eventos sem saber o que eles significam.

## Query keys

```ts
export const cardKeys = {
  all: ["card"] as const,
  list: (filters?: CardFilters) => [...cardKeys.all, "list", filters] as const,
  byId: (cardId: string) => [...cardKeys.all, "detail", cardId] as const,
};
```

## Service — HTTP e adaptação, sem React

```ts
export async function listCards(filters?: CardFilters): Promise<CardSummary[]> {
  const response = await api.get<PagedCardsDto>("/api/v1/cards", { params: toCardQuery(filters) });
  return response.data.items.map(toCardSummary);
}
```

## Query e mutation

```ts
export function useListCards(filters?: CardFilters) {
  return useQuery({
    queryKey: cardKeys.list(filters),
    queryFn: () => listCards(filters),
    staleTime: LIST_STALE_TIME,
  });
}

export function useUpdateCardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCard,
    onSuccess: card => {
      queryClient.setQueryData(cardKeys.byId(card.id), card);
      queryClient.invalidateQueries({ queryKey: cardKeys.list() });
    },
  });
}
```

## Regras

- Query keys determinísticas, sempre da factory da feature.
- Políticas compartilhadas (`staleTime`, retry) em `shared/api/query-config.ts`.
- Estado remoto fica em Query, nunca em Zustand.
- Service não conhece React; query e mutation não conhecem componente.
- Mutation invalida ou atualiza as queries afetadas; arrastar card no board usa atualização
  otimista com rollback no erro.
- Service, query e mutation com lógica têm teste: service com mock do client, query e mutation com
  mock do service.
