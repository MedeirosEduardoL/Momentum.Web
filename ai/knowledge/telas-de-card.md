---
id: telas-de-card
titulo: A tela do card mostra texto de terceiros só sanitizado, grava no Core sem apagar o que não mudou nem o que outra pessoa mudou, muda tasks, relações, feature e estados pelas rotas próprias e acha o outro card de uma relação pela busca, sem arquivados
status: ativo
criado: 2026-10-13
atualizado: 2026-10-22
touches:
  - src/features/card/api/card.service.ts
  - src/features/card/api/card-task.service.ts
  - src/features/card/api/card-relation.service.ts
  - src/features/card/api/card.mutations.ts
  - src/features/card/model/lib/card-form-values.ts
  - src/features/card/model/hooks/use-edit-card.ts
  - src/features/card/model/hooks/use-card-actions.ts
  - src/features/card/model/hooks/use-completion-confirmation.ts
  - src/features/card/model/hooks/use-card-feature.ts
  - src/features/card/model/hooks/use-create-card-relation.ts
  - src/features/card/model/hooks/use-card-state-settings.ts
  - src/features/card/model/hooks/use-create-card.ts
  - src/features/card/ui/card-relation-form.tsx
  - src/features/card/ui/card-detail.tsx
  - src/features/card/ui/card-dialog.tsx
  - src/features/card/ui/card-work-item.tsx
  - src/features/card/ui/card-details-tab.tsx
  - src/features/card/ui/card-edit-fields.tsx
  - src/features/card/model/contexts/card-extensions-context.ts
  - src/widgets/card-panels.tsx
  - src/widgets/opened-card-dialog.tsx
  - src/features/card/ui/card-properties.tsx
  - src/features/card/ui/card-type-details.tsx
  - src/features/card/ui/card-task-row.tsx
  - src/features/card/ui/card-task-dialog.tsx
  - src/features/card/ui/card-task-overview.tsx
  - src/features/card/ui/card-task-details-form.tsx
  - src/features/card/model/hooks/use-edit-card-task.ts
  - src/features/card/ui/card-relation-row.tsx
  - src/features/card/ui/card-properties.tsx
  - src/features/card/ui/card-state-settings.tsx
  - src/app/routes/card-list-search.ts
simbolos:
  - createCard
  - listCards
  - updateCard
  - setCardAssignee
  - setCardFeature
  - setCardTaskAssignee
  - updateCardTask
  - createCardRelation
  - useCardFeature
  - useCardTaskActions
  - useEditCardTask
  - CardTaskChangedMeanwhile
  - useCreateCardRelation
  - useCreateCard
  - toCardTypeFields
  - toCardChanges
  - useEditCard
  - expected_updated_at
  - useCardStateSettings
  - CardStateSettings
  - useCardActions
  - useCompletionConfirmation
  - CardCompletionDialog
  - CardTypeDetails
  - MarkdownSection
  - toCardListSearch
  - CardChangedMeanwhile
  - CardAssigneeOutsideProject
  - CardFeatureInvalid
  - CardTaskLimitReached
  - CardRelationAlreadyExists
  - CardRelationTargetInvalid
  - CardRelationLimitReached
  - CardSearchTooLong
  - cardKeys
  - ValueReporter
  - onProjectChange
  - CardDialog
  - CardWorkItem
  - CardWorkItemTab
  - CardWorkItemRenderers
  - CardExtensionsProvider
  - useCardExtensions
  - cardPanels
  - cardExtensions
relacionados: [guard-de-rota, telas-de-feature-e-epic, telas-de-board, entrevista-do-card]
---

## PARA_QUE_SERVE

- Mostra a lista, o detalhe e os formulários de card de um projeto, com os campos do tipo.
- Garante que o texto que outra pessoa escreveu num card não vire script na tela de quem o lê.
- Garante que gravar um card não apague campo que a pessoa não mexeu.
- Mostra e altera, no detalhe, as tasks, as relações e a feature do card, e deixa escolher a
  feature já no card novo.
- Abre o card numa modal sobre o board e a lista, com X para fechar, e organiza o que ele mostra em
  guias: Detalhes, Relações, Anexos, Entrevista com IA e Briefing (D-07 e ADR 0008 do Core).

## POR_QUE_EXISTE

- Contrato do Core (`../Momentum.Core/ai/memory/incremental/cards.md`, "Para o Momentum.Web"): no
  `PATCH`, campo ausente e campo nulo chegam iguais e não mudam nada, mas o grupo de campos do tipo
  é substituído inteiro. Mandar só o campo alterado do grupo apagaria os outros no Core.
- Pelo mesmo contrato o responsável tem rotas próprias: no `PATCH` não haveria como dizer "tirar o
  responsável". A feature do card e o responsável da task seguem o mesmo desenho, pelo mesmo
  motivo.
- Tasks e relações ficam sob a mesma chave de cache do card, e não em chaves próprias: mudar o
  estado de uma task muda o progresso do card, e concluir o card fecha as tasks abertas. Com
  chaves separadas, uma das duas metades da tela ficaria velha depois de cada ação.
- O outro card de uma relação se acha pela busca da lista de cards do Core (`q`, passo 5.5): pelo
  identificador do projeto escolhido ou por um trecho do título. Por decisão do usuário (pergunta
  55 do roadmap, em 2026-10-17), card arquivado fica fora da busca, como já ficava fora da lista
  paginada que ela substituiu. A escolha do projeto continua, porque a relação pode ligar cards
  de projetos diferentes da organização.
- Concluir o card fecha as tasks abertas, e reabri-las é uma por uma. O seletor de estado do
  detalhe pede confirmação, com quantas tasks serão concluídas, quando o card tem task aberta
  (pergunta 59 do roadmap), com a mesma regra e o mesmo diálogo do board.
- O Core devolve e aceita a relação com o nome lido a partir do card consultado (`blocks` ou
  `blocked_by`). Inverter os cards na tela para "traduzir" a relação criaria a relação contrária
  à que a pessoa escolheu.
- A descrição e os campos de texto do tipo são markdown escrito por terceiros (`CLAUDE.md`,
  "Conteúdo não confiável"). A alternativa, mostrar como texto do React, seria segura mas perderia
  o markdown; `dangerouslySetInnerHTML` na feature foi descartado pela regra do repositório.
- O Core responde 409 `CardChangedMeanwhile` quando o card mudou desde a versão que o formulário
  leu (`expected_updated_at`, respostas 47 e 48). Repetir o `PATCH` gravaria por cima do que a
  outra pessoa mudou; trocar os campos pela versão relida apagaria o que esta pessoa digitou. Por
  isso o texto fica na tela, sem botão para gravar por cima, e a versão atual só entra quando a
  pessoa pede. As ações rápidas (estado, prioridade, arquivar, arrastar no board) não mandam a
  versão: mudam um campo só e não sobrescrevem o texto de ninguém.
- Os estados são do projeto e moram na slice de card do Core; a aba fica na área da organização,
  ao lado do time, porque quem os administra é quem administra o projeto (resposta 49). Os boards
  mostram uma coluna por estado, sob outra chave de cache: por isso mudar um estado relê tudo.
- Os filtros da lista ficam na URL, e não numa store (`.claude/rules/state.md`): a lista filtrada
  é um endereço que se copia e se abre de novo.
- A rota valida o tipo de card com uma tabela própria, tipada pelo contrato, em vez de importar o
  valor da feature: o que o `app` importa de uma feature vai para a carga inicial de quem nem
  abriu um card (conhecimento `carga-inicial`). É o mesmo desenho de `sign-in-search.ts`.
- A navegação lateral mostra o projeto do card aberto, mas o caminho do card não tem o projeto, e o
  `app` não lê o card (INV-9). A página do detalhe informa o projeto quando o card carrega, pelo
  `ValueReporter` de `shared/ui`, chamando o `onProjectChange` que a rota entrega: a action do
  `useProjectContextStore`.

- O card aberto era uma tela empilhada, com entrevista, briefing e subitens numa coluna longa, e
  abrir um card tirava a pessoa do board (passos 11.4 e 11.6). A modal com guias, como o work item
  do VSTS, foi a forma pedida pelo usuário; o endereço com `?card=` deixa recarregar e
  compartilhar. A página própria do card (`/cards/$cardId`) continua, com as mesmas guias, para
  "Abrir em página inteira".
- Entrevista, briefing e anexos são de outras features, que a feature `card` não pode importar
  (camadas FSD). Por isso chegam como render props (`CardWorkItemRenderers`), montadas uma vez em
  `widgets/card-panels.tsx` e espalhadas pela página do card e pelo `OpenedCardDialog`. Os anexos
  do subitem aparecem dentro do `CardTaskDialog`, fundo demais para descer por props: chegam pelo
  contexto `CardExtensions`, que a página ou o widget fornece.
- As guias já visitadas ficam montadas e só se escondem (`Tabs` de `shared/ui`): trocar de guia no
  meio de uma rodada da entrevista ou da geração do briefing não pode cancelar o stream nem perder
  o que foi digitado.

## INVARIANTES

- INV-1: A descrição e os campos de texto do tipo de um card (critérios de aceite, pergunta,
  conclusão, passos para reproduzir, comportamento esperado, comportamento observado e impacto)
  só aparecem na tela pelo `MarkdownContent`, direto ou pelo `MarkdownSection`; o local da issue,
  só como texto do React (INV-16).
- INV-2: Todo `PATCH` que leva campos do tipo leva o grupo inteiro do tipo do card, montado por
  `toCardTypeFields` a partir do formulário completo; nenhum campo do grupo é omitido.
- INV-3: O formulário de edição não muda tipo, estado, prioridade nem responsável: `toCardChanges`
  só leva título, descrição e o grupo do tipo.
- INV-4: O responsável só muda por `PUT` e `DELETE /api/v1/cards/{cardId}/assignee`
  (`setCardAssignee`); nunca vai no `PATCH`.
- INV-5: No `PATCH`, o que não muda vai como `null` (`title`, `description`, `card_state_id`,
  `archived`) ou fica de fora (`priority` e o grupo do tipo); a descrição apagada vai como texto
  vazio, nunca como `null`.
- INV-6: Depois de um 409 `CardChangedMeanwhile` a gravação não é repetida sozinha. No detalhe, o
  card é relido e a tela pede para refazer; no formulário de edição, os campos mantêm o que a
  pessoa digitou até ela pedir a versão atual, que relê o card, troca os campos e passa a ser a
  versão esperada. Nenhum botão grava por cima.
- INV-7: Toda mutation de card, de task e de relação, ao terminar com sucesso ou com erro, invalida
  `cardKeys.all` (detalhe, listas, estados, tasks e relações).
- INV-8: Os filtros e a página da lista de cards vivem só na URL do board (`tipo`, `estado`,
  `responsavel`, `feature`, `arquivados`, `pagina`), validados por `toCardListSearch`; valor
  desconhecido é descartado. `responsavel=nenhum` é o filtro "Sem responsável" (`unassigned=true`
  no Core). A lista é uma visão do board (`BoardCardList`, `GET /api/v1/boards/{boardId}/cards`),
  e a lista do projeto não existe mais (ADR 0009 do Core); a busca de relação continua lendo
  `GET /api/v1/cards` pelo projeto.
- INV-9: `src/app` só importa tipos de `@/features/card`.
- INV-10: A feature de um card existente só muda por `PUT` e `DELETE
  /api/v1/cards/{cardId}/feature` (`setCardFeature`); nunca vai no `PATCH`. Na criação, a
  feature escolhida no formulário vai como `feature_id` do `POST`, e "Sem feature" vai como
  `null`.
- INV-11: O responsável de um subitem só muda por `PUT` e `DELETE
  /api/v1/card-tasks/{cardTaskId}/assignee` (`setCardTaskAssignee`); o `PATCH` do subitem leva só
  `title`, `description` ou `state`, e só o que muda, mais o `expected_updated_at` do INV-22.
- INV-12: As consultas de tasks e de relações de um card usam chaves sob `cardKeys.all`
  (`cardKeys.tasks`, `cardKeys.relations`).
- INV-13: Excluir task, desfazer relação, arquivar o card e excluir estado só chamam a API pelo
  `onConfirm` de um `ConfirmButton`.
- INV-14: A relação é criada no card consultado, com o `relation` que a pessoa escolheu; a tela
  não troca os dois cards de lugar nem converte `blocked_by` em `blocks`.
- INV-15: O título de um subitem e o título do outro card de uma relação aparecem como texto do
  React, nunca por `MarkdownContent` nem por HTML.
- INV-16: O local da issue aparece como texto do React, em fonte monoespaçada, nunca por
  `MarkdownContent` (resposta 52).
- INV-17: Só o formulário de edição manda `expected_updated_at`, com o `updated_at` da versão que
  ele leu; todo outro `updateCard` manda `null`.
- INV-18: Criar, alterar e excluir estado, ao terminar com sucesso ou com erro, invalidam o cache
  inteiro, e não só `cardKeys.all`.
- INV-19: A busca do outro card de uma relação nunca pede card arquivado (`includesArchived:
  false`), sempre no projeto escolhido; o texto vai aparado em `q`, e o texto em branco não vai.
- INV-20: No detalhe, escolher um estado da categoria `done` para o card com task aberta só
  chama `updateCard` depois do "Concluir" do `CardCompletionDialog`; "Voltar" ou fechar deixa o
  seletor no estado de antes, sem gravar.
- INV-21: A descrição de um subitem (task, bug ou impedimento) só aparece na tela pelo `MarkdownSection`, como
  a do card.
- INV-22: Só o formulário do subitem (`useEditCardTask`) manda `expected_updated_at`, com o
  `updated_at` do subitem lido ao abrir o formulário ou ao carregar a versão atual; mudar o estado
  pela linha ou pelo diálogo não manda. No 409 `CardTaskChangedMeanwhile`, o que a pessoa digitou
  fica no formulário, e nada grava por cima.
- INV-23: O formulário de criar subitem da tela do card diz o tipo que vai criar no rótulo do
  campo ("Nova task", "Novo bug", "Novo impedimento") e no botão ("Adicionar bug"), e o tipo
  escolhido continua valendo para o próximo.
- INV-24: O card aberto sobre o board ou a lista é sempre o `OpenedCardDialog` (`widgets/`), com o
  `CardDialog` da feature e os `cardPanels`; abre e fecha pelo `card` da URL, e o "Abrir em página
  inteira" leva a `/cards/$cardId`.
- INV-25: O conteúdo do card, na modal e na página, é o `CardWorkItem`, com as guias Detalhes,
  Relações, Anexos, Entrevista com IA e Briefing. Na modal, "Editar" troca só o conteúdo de
  Detalhes pelos campos de edição (`CardEditFields`); na página, editar continua sendo a tela de
  edição, que usa os mesmos campos.
- INV-26: A feature `card` não importa `attachment`, `card-interview` nem `card-brief`: o que vem
  delas entra por `CardWorkItemRenderers` e pelo contexto `CardExtensions`.

## LIMITACOES

- O painel da entrevista entra no detalhe por `renderInterviews`, entregue pela página: é da
  feature `card-interview`, com conhecimento próprio (`entrevista-do-card`). Aplicar uma proposta
  muda o card pelo Core, fora das mutations daqui; quem recarrega o card é a mutation de lá, que
  invalida o cache inteiro. O briefing entra do mesmo jeito, por `renderBrief`, da feature
  `card-brief` (`briefing-do-card`).
- Mover o card de estado pelo board passa pelo mesmo `updateCard` e segue os INV-5 e INV-7 daqui,
  e trocar o responsável soltando o card em outra raia passa pelo mesmo `setCardAssignee` (INV-4);
  o que é próprio do board (o movimento otimista, as raias e a releitura das colunas) está no
  conhecimento `telas-de-board`. O card novo do board passa pelo mesmo `createCard` da tela de card
  novo, com a feature no `POST` (INV-10) e a invalidação de `cardKeys.all` (INV-7); os padrões dele
  e o aviso de card fora do filtro estão em `telas-de-board` (INV-24 a INV-26).
- No 409, o que a pessoa digitou fica na tela, mas não se mescla com a versão atual: ela copia o
  que precisa, carrega a versão atual e refaz.
- Os critérios de aceite passam pelo markdown: um caminho como `__init__.py` pode ganhar negrito.
  Entre crases ele aparece como foi escrito.
- Imagem no texto do card não aparece: o `MarkdownContent` tira o `src`.
- Os controles da aba "Estados" só aparecem para quem administra o projeto, mas quem decide é o
  Core (`CardStateAdministrationDenied`): a tela só evita o botão que seria recusado.
- O outro card de uma relação é escolhido entre os 20 primeiros resultados da busca, do mais
  novo para o mais antigo, num projeto por vez; com mais resultados, a tela pede para refinar a
  busca. O identificador só acha o card com a chave do projeto escolhido (`SUP-7` buscado no
  projeto `MOM` vira busca no título), e o título diferencia acento. Card arquivado não é
  oferecido.
- O seletor de feature do card, o do card novo e o filtro por feature listam todas as features do
  projeto (até 500), sem busca.
- A lista de tasks não tem reordenação nem edição em lote: o Core devolve na ordem de criação.
- Aberto direto pelo endereço, o card mostra a navegação sem o projeto, ou com o último projeto
  aberto, até o card carregar.
- A guia aberta da modal não vai para a URL: recarregar com `?card=` abre o card em Detalhes.
- Sem o `CardExtensionsProvider` (fora da página do card e do `OpenedCardDialog`), o subitem aberto
  não mostra anexos.

## OBJETIVOS

- Nenhum texto de card chega ao DOM sem passar pelo sanitizador.
- Nenhuma gravação apaga campo que a pessoa não alterou.

## NAO_OBJETIVOS

- Edição simultânea com mesclagem do que cada pessoa escreveu.
- Substituir a validação de acesso do Core: quem não enxerga o projeto recebe 404 de lá.

## VERIFICACAO

- `npx vitest run src/features/card src/app/routes/card-list-search.test.ts`
- `rg -n "dangerouslySetInnerHTML" src --glob '!**/*.test.*'` só devolve
  `src/shared/ui/markdown-content.tsx` (INV-1).
- Em `src/features/card/ui/card-details-tab.tsx` e `card-type-details.tsx`, `description` e os
  campos de texto de `fields` só aparecem como `content=` de `MarkdownSection` ou
  `MarkdownContent` (INV-1).
- `npx vitest run src/features/card/ui/card-dialog.test.tsx` cobre a modal, as guias, a edição e o
  "Abrir em página inteira" (INV-24, INV-25); `rg -n "@/features/(attachment|card-interview|card-brief)"
  src/features/card` não devolve nada (INV-26).
- `rg -n "assignee" src/features/card/api/card.service.ts` não mostra `assignee_id` no corpo de
  `updateCard` (INV-4).
- `rg -c "onSettled: refreshCards" src/features/card/api/card.mutations.ts` devolve 10, uma por
  mutation do arquivo (INV-7).
- `rg -n "@/features/card" src/app` só devolve linhas `import type` (INV-9).
- `rg -n "feature_id" src/features/card/api/card.service.ts` só mostra a leitura do card, o filtro
  da lista, o corpo de `createCard` e o de `setCardFeature`; nada em `updateCard` (INV-10).
- `rg -n "assignee" src/features/card/api/card-task.service.ts` não mostra responsável no corpo de
  `updateCardTask` (INV-11).
- `rg -n "cardKeys\.all" src/features/card/api/card-api-keys.ts` mostra `tasks` e `relations`
  montadas sobre ela (INV-12).
- `rg -n "deleteCardTask|deleteCardRelation" src/features/card --glob '*.tsx'` não devolve nada: a
  tela só as alcança por `onRemove`, ligado ao `onConfirm` de um `ConfirmButton` (INV-13).
- `rg -n "MarkdownSection" src/features/card/ui/card-task-overview.tsx` mostra a descrição do
  subitem só por ele (INV-21).
- `rg -n "expectedUpdatedAt" src/features/card --glob '!*.test.*'` devolve também
  `use-edit-card-task.ts` e o corpo de `updateCardTask`, e `npx vitest run
  src/features/card/model/hooks/use-edit-card-task.test.ts` cobre o 409 (INV-22).
- `rg -n "MarkdownContent|MarkdownSection" src/features/card/ui/card-task-row.tsx
  src/features/card/ui/card-relation-row.tsx` não devolve nada (INV-15).
- `rg -n "location" src/features/card/ui/card-type-details.tsx` mostra o local num `<p>`, fora de
  `MarkdownSection` (INV-16).
- `rg -n "expectedUpdatedAt" src/features/card --glob '!*.test.*'` só devolve o tipo, o corpo de
  `updateCard` e `use-edit-card.ts` (INV-17).
- `rg -n "refreshEverything" src/features/card/api/card.mutations.ts` mostra as três mutations de
  estado (INV-18).
- `rg -n "actions.archive|settings.remove" src/features/card/ui` só devolve `onConfirm=` (INV-13).
- `rg -n "includesArchived" src/features/card/model/hooks/use-create-card-relation.ts` só devolve
  `includesArchived: false`, e `use-create-card-relation.test.ts` confere o texto aparado e o
  texto em branco (INV-19).
- `npx vitest run src/features/card/ui/card-properties.test.tsx`; em
  `src/features/card/ui/card-properties.tsx`, o seletor "Estado" chama `completion.request`, e não
  `actions.changeState` direto (INV-20).
