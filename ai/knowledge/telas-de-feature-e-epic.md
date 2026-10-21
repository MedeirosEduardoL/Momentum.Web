---
id: telas-de-feature-e-epic
titulo: Feature e epic mostram a descrição só sanitizada, são lidos sempre de novo, se criam e editam em tela própria e só se excluem a partir de uma lista
status: ativo
criado: 2026-10-13
atualizado: 2026-10-20
touches:
  - src/features/feature/api/feature.queries.ts
  - src/features/feature/api/feature.mutations.ts
  - src/features/feature/api/feature.service.ts
  - src/features/feature/api/epic.service.ts
  - src/features/feature/ui/feature-detail.tsx
  - src/features/feature/ui/epic-detail.tsx
  - src/features/feature/ui/feature-list.tsx
  - src/features/feature/ui/epic-group.tsx
  - src/features/feature/ui/create-epic-form.tsx
  - src/features/feature/ui/create-feature-form.tsx
  - src/features/feature/ui/create-epic-feature-form.tsx
  - src/features/feature/ui/edit-feature-form.tsx
  - src/features/feature/ui/edit-epic-form.tsx
  - src/features/feature/model/hooks/use-group-form.ts
  - src/features/feature/model/lib/hierarchy.ts
  - src/features/feature/index.ts
  - src/app/routes/feature.routes.tsx
simbolos:
  - useListFeatures
  - useListEpics
  - useGetFeature
  - useGetEpic
  - useDeleteFeatureMutation
  - useDeleteEpicMutation
  - setFeatureEpic
  - toHierarchy
  - useGroupForm
  - FeatureList
  - EpicGroup
  - CreateEpicForm
  - CreateFeatureForm
  - CreateEpicFeatureForm
  - EditFeatureForm
  - EditEpicForm
  - featureKeys
  - FeatureEpicInvalid
  - FeatureLimitReached
  - EpicLimitReached
relacionados: [telas-de-card, telas-de-board, guard-de-rota]
---

## PARA_QUE_SERVE

- Mostra a hierarquia de um projeto (epics, as features de cada um e as features sem epic) e a
  tela de cada feature e de cada epic, com excluir a partir das listas, e as telas de criar e de
  editar (título e descrição) de cada um.
- Entrega à feature `card` a lista de features e de epics de um projeto, para o seletor de feature
  do card, o do formulário de card novo e o filtro da lista, e à feature `board`, para os critérios
  de feature e de epic do filtro do board.
- Garante que a descrição que outra pessoa escreveu numa feature ou num epic não vire script na
  tela de quem a lê.

## POR_QUE_EXISTE

- Contrato do Core (`../Momentum.Core/ai/knowledge/feature-e-epic.md`, INV-9, e
  `ai/memory/incremental/cards.md` de lá): as listas não trazem a descrição, que só vem na leitura
  de uma feature ou de um epic, e é markdown de terceiros como a do card.
- Progresso, estado e quantidade de cards são derivados dos cards, e quem muda card é a feature
  `card`, que não conhece as chaves de cache daqui. Em vez de a feature `card` invalidar o cache
  inteiro a cada ação (uma dezena de requisições por clique na tela do card), as consultas daqui
  nascem vencidas e são refeitas a cada montagem.
- Excluir uma feature solta os cards dela no Core. Esta feature não conhece as chaves de cache de
  card e não pode importar de `card` (o import é de `card` para cá); por isso essa exclusão, e só
  ela, invalida o cache inteiro, como já fazem as mutations de membro da organização.
- A exclusão sai de uma linha de lista, e não da tela do próprio item: com a tela do item aberta,
  recarregar o cache depois de excluir pediria ao Core um item que acabou de sumir, e a tela
  mostraria o item excluído até a pessoa sair. Fora da tela do item, a leitura guardada dele pode
  ser apagada sem ninguém a estar olhando.
- A feature do card muda por `PUT` e `DELETE /api/v1/cards/{cardId}/feature`, que são rotas de
  card: a ação mora na feature `card`, que só lê daqui. A alternativa, esta feature entregar um
  seletor pronto, faria a ação de card morar fora do dono da rota.
- Feature e epic têm o mesmo formulário (título e descrição), como no Core têm o mesmo validador
  (`GroupTextReader`): um schema e um hook de formulário servem aos quatro casos. O epic de uma
  feature nova vem do endereço de onde a criação partiu (`/epics/$epicId/features/nova`), e não de
  um campo, para o formulário continuar igual.
- Criar e editar abriam num diálogo, que fechava com um clique fora ou com o Esc e perdia a
  descrição digitada (até 50 mil caracteres). Por decisão do usuário (pergunta 54 do roadmap, em
  2026-10-17) viraram telas próprias, como as do card: o texto só sai da tela quando a pessoa
  navega, e o endereço deixa voltar pelo navegador.
- A feature criada dentro de um epic tem de nascer no projeto dele: com outro projeto, o Core
  recusa com `FeatureEpicInvalid`. A tela lê o epic e tira dele o projeto, em vez de receber os
  dois pelo endereço.
- A feature e o epic informam o próprio projeto à navegação lateral como o card: o link
  "Voltar para epics e features" de `feature-links.tsx` (`reportingHierarchyLink`) leva junto um
  `ValueReporter` com o `onProjectChange` da rota (conhecimento `telas-de-card`).

## INVARIANTES

- INV-1: A descrição de feature e de epic só aparece na tela pelo `MarkdownSection`
  (`MarkdownContent`), em `feature-detail.tsx` e `epic-detail.tsx`.
- INV-2: A descrição nunca é esperada de `GET /api/v1/features` nem de `GET /api/v1/epics`:
  `FeatureSummary` e `EpicSummary` não têm o campo, e só `Feature` e `Epic` (leitura de um item)
  o têm.
- INV-3: `src/features/feature` não importa de `@/features/card`; o import entre as duas é só de
  `card` para `feature`.
- INV-4: O `index.ts` da feature exporta para outras features só queries (`useListFeatures`,
  `useListEpics`) e tipos; as telas (`ProjectHierarchy`, `FeatureDetail`, `EpicDetail`,
  `CreateEpicForm`, `CreateFeatureForm`, `CreateEpicFeatureForm`, `EditFeatureForm` e
  `EditEpicForm`) são consumidas só por `src/pages/feature`.
- INV-5: Toda consulta de feature e de epic tem `staleTime` zero
  (`DERIVED_FROM_CARDS_STALE_TIME`).
- INV-6: Toda mutation de feature e de epic, ao terminar com sucesso ou com erro, invalida
  `featureKeys.all`; a exclusão de feature invalida o cache inteiro.
- INV-7: Excluir feature e excluir epic só chamam a API pelo `onConfirm` de um `ConfirmButton`, e
  esse botão só existe em linha de lista (`FeatureList`) e no cabeçalho do epic na hierarquia
  (`EpicGroup`), nunca em `feature-detail.tsx` nem em `epic-detail.tsx`.
- INV-8: Depois de excluir com sucesso, a leitura guardada do item (`featureKeys.byId`,
  `featureKeys.epicById`) é removida do cache.
- INV-9: O epic de uma feature só muda por `PUT` e `DELETE /api/v1/features/{featureId}/epic`
  (`setFeatureEpic`); o `PATCH` leva só título e descrição.
- INV-10: A feature cujo epic não está na lista de epics aparece em "Features sem epic"; nenhuma
  feature da lista fica fora da hierarquia (`toHierarchy`).
- INV-11: O `PATCH` de feature e de epic manda sempre título e descrição; a descrição apagada vai
  como texto vazio, nunca como `null`.
- INV-12: Criar e editar feature e epic são telas próprias, cada uma com a sua rota
  (`/projetos/$projectId/epics/novo`, `/projetos/$projectId/features/nova`,
  `/epics/$epicId/features/nova`, `/features/$featureId/editar` e `/epics/$epicId/editar`), e
  nunca um diálogo: `src/features/feature` não usa `Modal`; o único diálogo da feature é a
  confirmação do `ConfirmButton`.
- INV-13: A feature criada dentro de um epic vai com o `epic_id` do epic da rota e o `project_id`
  lido desse epic (`epic.projectId`); a criada a partir de "Features sem epic" vai com `epic_id`
  nulo.

## LIMITACOES

- Sair da tela de criar ou de editar sem gravar perde o que foi escrito, sem pergunta, como no
  card.
- Depois de criar, a tela vai para a feature ou o epic novo, como o card: para criar várias em
  sequência é preciso voltar à hierarquia a cada uma.
- Não há controle de versão: duas pessoas editando a mesma descrição, a última gravação vence, e o
  Core não avisa.
- A hierarquia mostra o projeto inteiro numa tela, sem paginação nem busca: até 100 epics e 500
  features.
- O progresso na tela pode estar alguns segundos atrás do Core enquanto a consulta refeita não
  volta; o que aparece primeiro é o último valor lido.
- A tela de uma feature e a de um epic não excluem o próprio item: é preciso voltar à hierarquia.
- A hierarquia não lista os cards de cada feature: leva à lista de cards filtrada pela feature.
- Qualquer pessoa do time cria, altera e exclui: o Core não restringe, e a tela não esconde nada
  por papel.

## OBJETIVOS

- Nenhuma descrição de feature ou de epic chega ao DOM sem passar pelo sanitizador.
- O progresso que a pessoa vê ao abrir a hierarquia é o do Core naquele momento.

## NAO_OBJETIVOS

- Estado, progresso ou quantidade de cards editáveis: são derivados no Core.
- Arrastar feature entre epics ou card entre features.
- Substituir a validação de acesso do Core: quem não enxerga o projeto recebe 404 de lá.

## VERIFICACAO

- `npx vitest run src/features/feature src/app/routes/index.test.ts`
- `rg -n "dangerouslySetInnerHTML" src --glob '!**/*.test.*'` só devolve
  `src/shared/ui/markdown-content.tsx`, e `rg -n "(feature|epic)\.description"
  src/features/feature/ui --glob '!**/*.test.*'` só devolve as duas linhas em que ela é o
  `content` de um `MarkdownSection` (INV-1).
- `rg -n "description" src/features/feature/model/types/feature.types.ts` mostra o campo só em
  `Feature`, `Epic` e `GroupText` (INV-2).
- `rg -n "@/features/card" src/features/feature` não devolve nada (INV-3).
- `rg -n "@/features/feature" src --glob '!src/pages/feature/**' --glob '!**/*.test.*'` só devolve
  arquivos de `src/features/card` e de `src/features/board`, importando `useListFeatures`,
  `useListEpics` e tipos (INV-4).
- `rg -c "staleTime: DERIVED_FROM_CARDS_STALE_TIME" src/features/feature/api/feature.queries.ts`
  devolve 4, uma por consulta (INV-5).
- Em `src/features/feature/api/feature.mutations.ts`, as sete mutations têm `onSettled`, e a de
  excluir feature chama `invalidateQueries()` sem filtro (INV-6).
- `rg -n "ConfirmButton|removeFeature|removeEpic" src/features/feature/ui/feature-detail.tsx
  src/features/feature/ui/feature-properties.tsx` não devolve nada, e `epic-detail.tsx` não tem
  `ConfirmButton` nem `removeEpic` (INV-7).
- `rg -n "removeQueries" src/features/feature/api/feature.mutations.ts` devolve as duas exclusões
  (INV-8).
- `rg -n "epic_id" src/features/feature/api/feature.service.ts` não mostra `epic_id` no corpo de
  `updateFeature` (INV-9).
- `rg -n "Modal" src/features/feature` não devolve nada, e `src/app/routes/index.test.ts` confere
  as cinco rotas (INV-12).
- Em `src/features/feature/ui/create-epic-feature-form.tsx`, `useCreateFeature` recebe
  `projectId: epic.projectId` e `epicId: epic.id`; em `create-feature-form.tsx`, `epicId: null`
  (INV-13).
