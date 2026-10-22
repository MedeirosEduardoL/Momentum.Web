---
id: telas-de-board
titulo: O board escolhe quais cards aparecem, a feature de card os cria na primeira coluna e os move entre colunas e raias, e a tela relê as colunas depois de todo movimento e de todo card novo
status: ativo
criado: 2026-10-13
atualizado: 2026-10-22
touches:
  - src/features/card/ui/card-tile.tsx
  - src/features/card/ui/card-tile-subitem-buttons.tsx
  - src/features/card/ui/card-tile-subitem-list.tsx
  - src/features/card/ui/card-tile-subitem-form.tsx
  - src/features/card/ui/card-tile-actions.tsx
  - src/features/board/ui/board-access-dialog.tsx
  - src/features/board/model/hooks/use-board-access.ts
  - src/features/board/api/board.service.ts
  - src/features/board/api/board.queries.ts
  - src/features/board/api/board.mutations.ts
  - src/features/board/model/hooks/use-board-form.ts
  - src/features/board/model/lib/board-filter.ts
  - src/features/board/model/lib/board-selection.ts
  - src/features/board/model/lib/board-options.ts
  - src/features/board/ui/project-board.tsx
  - src/features/board/ui/selected-board.tsx
  - src/features/board/ui/board-toolbar.tsx
  - src/features/board/ui/first-board-dialog.tsx
  - src/app/stores/first-board.store.ts
  - src/pages/home/project-list/index.tsx
  - src/features/board/index.ts
  - src/features/card/model/hooks/use-move-card.ts
  - src/features/card/model/hooks/use-card-drag.ts
  - src/features/card/model/hooks/use-completion-confirmation.ts
  - src/features/card/model/lib/card-state-columns.ts
  - src/features/card/model/lib/card-completion.ts
  - src/features/card/ui/card-state-columns.tsx
  - src/features/card/ui/card-lane-row.tsx
  - src/features/card/ui/card-tile.tsx
  - src/features/card/ui/card-quick-create.tsx
  - src/features/card/model/hooks/use-quick-create-card.ts
  - src/pages/board/project-board/index.tsx
  - src/app/routes/board.routes.tsx
  - src/app/routes/board-search.ts
simbolos:
  - ProjectBoard
  - CardStateColumns
  - CardQuickCreate
  - useQuickCreateCard
  - toQuickCardDefaults
  - toQuickNewCard
  - containsCard
  - SavedCardFilter
  - savedFilter
  - useMoveCard
  - useCardDrag
  - useCompletionConfirmation
  - countTasksClosedBy
  - CardCompletionDialog
  - setCardAssignee
  - changesPlace
  - changesAssignee
  - moveCard
  - toCardLanes
  - CardLaneGrouping
  - isMissingBoard
  - toAssigneeChoice
  - fromAssigneeChoice
  - FirstBoardDialog
  - useFirstBoardStore
  - unassigned
  - keepExistingReferences
  - hasMissingReferences
  - selectBoard
  - toBoardSearch
  - boardKeys
  - useListBoardColumns
  - canAdministerProject
  - BoardAdministrationDenied
  - BoardNameAlreadyUsed
  - BoardAssigneeOutsideProject
  - BoardFeatureInvalid
  - BoardEpicInvalid
  - BoardLimitReached
  - CardChangedMeanwhile
  - CardTileActions
  - BoardAccessDialog
  - useBoardAccess
  - setBoardVisibility
  - useListBoardMembers
  - BoardMemberOutsideProject
  - OpenedCardDialog
  - useRefreshBoardColumns
relacionados: [telas-de-card, telas-de-feature-e-epic, administracao-da-organizacao, guard-de-rota, carga-inicial]
---

## PARA_QUE_SERVE

- Mostra os cards de um projeto em colunas, uma por estado, pelo recorte de um board (um filtro
  salvo), com a visão por responsável.
- Deixa mover um card de estado arrastando o cartão ou pelo seletor de estado dele, e trocar o
  responsável soltando o cartão na raia de outra pessoa ou na de "Sem responsável".
- Pede confirmação antes de concluir um card com task aberta, porque concluir fecha as tasks.
- Cria um card no topo da primeira coluna, só com o tipo e o título, e com o resto escolhido para
  ele aparecer no board aberto.
- Deixa o administrador do projeto criar, renomear, trocar o filtro e excluir boards, e guia quem
  acabou de criar um projeto, no primeiro acesso ou na área da organização, a criar o primeiro
  board dele.
- É a tela principal do projeto (D-07 e ADR 0008 do Core): o card abre numa modal sobre o board,
  e o menu de três pontos do cartão cria task, bug ou impedimento sem sair dele.
- Deixa o administrador do projeto escolher quem vê o board (todo o time ou só as pessoas
  escolhidas) e conferir, dar e tirar o acesso, pelo menu de três pontos do board.

## POR_QUE_EXISTE

- Contrato do Core (`../Momentum.Core/ai/knowledge/board.md` e
  `ai/memory/incremental/cards.md` de lá, "Para o Momentum.Web (passo 6.2)"): o board é um filtro
  salvo, o card não pertence a ele, e mover de coluna é `PATCH /api/v1/cards/{cardId}`, uma rota
  de card. Pela regra "leitura cruza, ação não", a ação mora na feature `card`. A alternativa, a
  feature `board` importar a mutation de card, foi descartada; sobrou a feature `card` exportar
  as colunas movíveis (`CardStateColumns`) para a página, que as entrega ao `ProjectBoard`.
- A feature `card` não conhece as chaves de cache de `board`, porque o import é de `board` para
  `card`. Quem relê as colunas depois de um movimento é a função `reload` que o board entrega. A
  alternativa, a mutation de card invalidar o cache inteiro, recarregaria tudo a cada cartão
  arrastado.
- Levar o card a um estado concluído muda o progresso dele e fecha as tasks, o card pode deixar
  de casar com o filtro, e o Core pode recusar com 409. A tela mostra o card na coluna nova na
  hora, mas só confia no que o Core devolve: relê as colunas com sucesso ou com erro.
- Concluir fecha as tasks abertas no Core, e reabrir uma por uma é trabalho. Por isso concluir um
  card com task aberta pede confirmação, que diz quantas serão concluídas (pergunta 59 do
  roadmap); sem task aberta, a pergunta só atrapalharia. A conta sai do resumo que a tela já tem
  (`task_count` e `done_task_count`), sem consulta a mais.
- Agrupado por responsável, há uma raia para cada pessoa do time e a de "Sem responsável", vazias
  quando for o caso (pergunta 84): é soltando na raia que se dá trabalho a alguém, e sem ela quem
  ainda não tem card no board não podia receber um. O time vem de `useListProjectMembers`, a mesma
  consulta do seletor "Responsável", e não muda a consulta das colunas. O seletor manda nas raias:
  com uma pessoa, só a dela; com "Sem responsável", só essa. As outras ficariam vazias para sempre,
  porque o Core só devolve os cards do filtro.
- O diálogo do primeiro board no fim do primeiro acesso (pergunta 82) abre em `/`, e não num
  terceiro passo de `/primeiro-acesso`: o guard leva quem já tem projeto para `/` (INV-6 de
  `guard-de-rota`), e esse invariante fica. O que atravessa a troca de tela é uma marca em memória
  (`useFirstBoardStore`, em `app/stores/`), gravada quando o primeiro acesso cria o projeto e
  apagada quando o diálogo termina. Quem a lê e grava são as rotas de `/primeiro-acesso` e de `/`,
  que a entregam às páginas por prop: página e feature não importam de `app`. A marca guarda o
  projeto que o `POST` devolveu, como a lista da organização guarda o recém-criado num estado
  próprio; não é cache do projeto, que continua no TanStack Query.
- Soltar na raia de outra pessoa troca o responsável (pergunta 58). O responsável tem rotas
  próprias no Core (`PUT` e `DELETE /api/v1/cards/{cardId}/assignee`, INV-4 de `telas-de-card`),
  então o movimento entre raias e colunas são duas gravações: o estado primeiro, como sempre, e o
  responsável depois, só se o estado passou. A alternativa, o responsável primeiro, deixaria o
  card na raia nova com o estado recusado, que é o que a pessoa via antes de soltar.
- A coluna nova é mostrada por derivação (`moveCard` sobre as colunas lidas mais o movimento
  pendente), e não escrevendo no cache: desfazer no erro é só esquecer o movimento, sem guardar
  cópia do que havia antes.
- Arrastar usa o drag and drop nativo do HTML5 porque dependência nova pede o OK do usuário. O
  nativo não funciona por teclado nem bem em toque; por isso todo cartão tem o seletor de estado.
- Board, responsável e agrupamento ficam na URL, e não numa store (`.claude/rules/state.md`): o
  board aberto é um endereço que se copia e se abre de novo. "Sem responsável" é
  `responsavel=nenhum`, e não um segundo parâmetro: com `assignee_id` e `unassigned=true` juntos o
  Core devolve as colunas vazias, então as duas escolhas são exclusivas no mesmo seletor.
- O endereço de um board excluído continua abrindo o primeiro board do projeto, agora com um aviso
  de que aquele não existe mais (pergunta 62). Quem exclui o board pela própria tela não vê o
  aviso: a lista de boards volta relida antes de a URL perder o id excluído, e o aviso piscaria.
- O filtro guarda ids de responsável, feature e epic, que podem deixar de existir. O Core confere
  o que entra no filtro e não o que já estava gravado (INV-7 do conhecimento `board` de lá):
  mandar de volta um id órfão faria todo `PATCH` responder 422, e o formulário não tem caixa para
  desmarcá-lo.
- A recusa do Core numa ação de board quer dizer que a tela está velha num cache que esta feature
  não conhece (o papel no projeto, o time, as features, os epics). Por isso o erro invalida tudo,
  como já fazem as mutations de membro da organização.
- Criar card no board (pedido do usuário em 2026-10-20, passo 6.6) é `POST /api/v1/cards`, rota de
  card: mora na feature `card`, pela mesma mutation da tela de card novo, e o board só entrega o
  filtro salvo (`savedFilter`) e a releitura (`reload`) no `renderColumns`. O card não pertence ao
  board: para ele aparecer, nasce no estado da primeira coluna, com o responsável do seletor da
  tela e com o tipo, a prioridade, o responsável e a feature que o filtro salvo escolhe sozinhos.
  Critério salvo com mais de um valor não decide nada, porque qualquer um casa. A alternativa,
  abrir o formulário completo, foi descartada: o "New item" do Azure DevOps, a referência do
  usuário, pede só o título.
- O menu de três pontos do cartão (pedido do usuário em 2026-10-22, passo 11.5) cria o primeiro
  subitem de um tipo que o card ainda não tem, o que antes só a tela do card fazia: no VSTS, a
  referência, o "Add task" fica no próprio cartão. Ele reaproveita a lista do cartão, que já cria
  subitem, abrindo-a no tipo escolhido com o campo focado, em vez de um formulário próprio.
- O card abre numa modal sobre o board, pelo `card` da URL (passo 11.6, ADR 0008 do Core): sair
  do board a cada card aberto era o que o usuário chamou de "bagunçado", e o endereço com o card
  aberto se recarrega e se compartilha. Fechar relê as colunas, porque a modal pode ter mudado o
  card.
- O acesso ao board (passo 11.9, ADR 0007 do Core) esconde o recorte e não os cards. A tela diz
  isso no próprio diálogo, para ninguém usar o board restrito como sigilo.
- Mesmo assim o card pode não casar com o filtro (o epic salvo, ou a escolha de outro tipo no
  formulário). A tela relê as colunas e procura o card nelas: se ele não voltou, o aviso diz que
  foi criado mas não casa com o filtro deste board, em vez de deixar a pessoa procurando. O aviso
  leva uma ação que abre o card, e não um link, porque o `Toaster` fica fora do roteador.

## INVARIANTES

- INV-1: No board, o estado e o responsável do card só mudam por `useMoveCard`, da feature
  `card`: o estado por `updateCard` com `cardId` e `cardStateId` e nada mais, e o responsável por
  `setCardAssignee`, depois do estado; `src/features/board` não chama `/api/v1/cards` nem importa
  mutation, hook de orquestração ou UI de ação de `@/features/card`.
- INV-2: `src/features/card` não importa de `@/features/board`.
- INV-3: Depois de todo movimento, com sucesso ou com erro, `useMoveCard` chama `onMoved` (a
  releitura das colunas) e só depois esquece o movimento pendente.
- INV-4: Enquanto um movimento corre, nenhum outro começa: os cartões deixam de ser arrastáveis e
  os seletores de estado ficam travados.
- INV-5: No erro, a tela volta ao que o Core gravou e nenhuma gravação é repetida sozinha: se o
  estado é recusado, o responsável não é tentado; no 409 `CardChangedMeanwhile` a tela pede para
  mover de novo.
- INV-6: Todo cartão tem o seletor de estado (`Estado de <identificador>`), que move o card sem
  arrastar.
- INV-7: A consulta das colunas (`useListBoardColumns`) tem `staleTime` zero.
- INV-8: O board, o responsável e o agrupamento escolhidos vivem só na URL (`board`,
  `responsavel`, `agrupar`), validados por `toBoardSearch`; `responsavel` aceita um id ou
  `nenhum`, e valor desconhecido é descartado.
- INV-9: Criar, editar e excluir board, editar colunas e o acesso ao board só aparecem quando
  `canAdministerProject` aceita o projeto; editar, editar colunas, acesso ao board e excluir ficam
  no menu de três pontos da barra do board (`ActionMenu`).
- INV-10: Excluir board só chama a API pelo `onConfirm` do `ConfirmDialog` que o item "Excluir"
  do menu abre (`useConfirmation`, o mesmo mecanismo do `ConfirmButton`).
- INV-11: O `POST` e o `PATCH` de board levam o nome e o filtro inteiro, e do filtro só vão para o
  Core o responsável, a feature e o epic que estão nas listas carregadas do projeto
  (`keepExistingReferences`).
- INV-12: A mutation de board que o Core recusa invalida o cache inteiro. A que dá certo invalida
  só chaves de board, e a exclusão, só as listas de boards, nunca as colunas do board excluído.
- INV-13: `src/app` só importa tipos de `@/features/board`.
- INV-14: O título do card no cartão aparece como texto do React, nunca por `MarkdownContent` nem
  por HTML.
- INV-15: O agrupamento por responsável é feito no cliente, sobre as colunas já lidas e o time do
  projeto (`toCardLanes`); não muda a consulta ao Core.
- INV-16: O contêiner das colunas rola na horizontal e é `relative`: os rótulos ocultos dos
  seletores de estado (`sr-only`, de posição absoluta) ficam presos nele. Sem o `relative` eles
  escapam do corte da rolagem e a página inteira passa a rolar para o lado.
- INV-17: Mudar para um estado da categoria `done` um card com task aberta (`taskCount` maior que
  `doneTaskCount`), pelo arrasto ou pelo seletor do cartão, só chama a API depois do "Concluir" do
  `CardCompletionDialog`, que diz quantas tasks serão concluídas; "Voltar" ou fechar não grava
  nada. Sem task aberta, ou para um estado de outra categoria, segue sem perguntar.
- INV-18: Soltar o card na raia de outra pessoa define o responsável como ela (`PUT`), soltar na
  raia "Sem responsável" o tira (`DELETE`), e mover sem agrupar ou pelo seletor do cartão não
  mexe no responsável. Soltar na raia e na coluna em que o card já está não chama a API.
- INV-19: Quando o `board` da URL não está na lista do projeto e há outro board, a tela mostra o
  primeiro com o aviso de que aquele não existe mais; o aviso não aparece para o board que a
  própria tela acabou de excluir.
- INV-20: A consulta das colunas leva `unassigned=true` ou `assignee_id`, nunca os dois:
  "Sem responsável" e uma pessoa são opções exclusivas do seletor "Responsável".
- INV-21: O `FirstBoardDialog` nasce com o nome "Todos os cards" e nenhum critério marcado e só
  aparece logo depois de "Novo projeto" criar o projeto, na área da organização, ou em `/`
  enquanto `useFirstBoardStore` guarda o projeto que o primeiro acesso criou. Pular, fechar ou
  criar o encerra para sempre, e criar mostra o toast sem navegar: nada o reabre.
- INV-22: Agrupado por responsável, com "Todos" no seletor "Responsável", há uma raia para cada
  pessoa do time do projeto e para cada responsável de card na tela, e a de "Sem responsável",
  mesmo vazias; num board cujo filtro salvo escolhe responsáveis, as do time são só as desses
  responsáveis, sem a de "Sem responsável" (pergunta 96). Com uma pessoa no seletor, só a raia
  dela; com "Sem responsável", só essa, com ou sem responsáveis salvos.
- INV-23: A marca do primeiro board (`useFirstBoardStore`) vive só na memória da página, sem
  `persist`: é gravada pelo `onCreated` do `CreateProjectForm` do primeiro acesso, apagada pelo
  `onFinished` do `FirstBoardDialog`, e só `src/app` a lê e grava.
- INV-24: O card novo do board é criado só por `useQuickCreateCard`, da feature `card`, com
  `useCreateCardMutation` (o mesmo `createCard` da tela de card novo), e nasce no estado da
  primeira coluna; `src/features/board` não cria card.
- INV-25: Os padrões do card novo saem de `toQuickCardDefaults`: o responsável é o da pessoa
  escolhida no seletor "Responsável", nenhum com "Sem responsável", senão o único responsável do
  filtro salvo, senão nenhum; o tipo inicial, a prioridade e a feature são o único valor do
  critério salvo, senão user story, média e nenhuma.
- INV-26: Depois de criar, as colunas são relidas (`reload`), e o aviso diz que o card foi criado
  ou, quando ele não volta nas colunas relidas, que não casa com o filtro do board; os dois têm a
  ação de abrir o card. Releitura que falha não conta como card fora do filtro.
- INV-27: O cartão do board só mostra botão para o tipo de subitem que o card tem
  (`subitem_counts` do resumo, sem ler a lista), e só lê os subitens (`useListCardTasks`) quando
  a pessoa abre um tipo.
- INV-28: Concluir, reabrir, mudar o responsável, excluir ou criar um subitem pelo cartão relê as
  colunas do board (`reload`), porque a contagem do cartão vem delas, e não da lista de subitens.
- INV-30: "Editar colunas" mostra a edição dos estados do projeto entregue pela página
  (`renderColumnsEditor`, com o `CardStateSettings` da feature `card`): a feature `board` não
  importa a ação de outra feature, e mudar um estado relê o cache inteiro, as colunas junto.
- INV-31: A lista de subitens do cartão é montada de novo a cada tipo aberto (`key` com o tipo),
  e o campo de criar dela cria sempre o tipo do botão aberto: trocar de "Bugs" para "Tasks" não
  deixa o formulário com o tipo anterior.
- INV-29: Com a lista de subitens aberta, o cartão não é arrastável: o campo de criar e as caixas
  de concluir ficam livres para o clique e a seleção de texto.
- INV-32: Todo cartão tem, no topo, o menu de três pontos (`CardTileActions`, "Ações de
  <identificador>") com "Adicionar task", "Adicionar bug" e "Adicionar impedimento", tenha o card
  subitem do tipo ou não; escolher abre a lista daquele tipo no cartão com o campo de criar focado.
- INV-33: O título do cartão é um link para o mesmo board com o `card` na URL, e o card aberto é o
  `OpenedCardDialog` (`widgets/`), nunca outra tela. Fechar a modal tira o `card` da URL e relê
  as colunas (`useRefreshBoardColumns`).
- INV-34: O diálogo do acesso grava a escolha de quem vê pelo `PATCH` do board (`visibility`) e,
  restrito, lista os administradores do projeto (sem "Tirar") e as pessoas escolhidas (com
  "Tirar"); "Dar acesso a" só oferece quem é do time, não administra e ainda não foi escolhido.
- INV-35: O selo "Acesso restrito" aparece na barra do board quando a `visibility` dele é
  `members`, para todo mundo que vê o board.

## LIMITACOES

- O cartão só mostra botão para o tipo de subitem que o card tem; o primeiro de um tipo se cria
  pelo menu de três pontos do cartão (INV-32).
- O board restrito não esconde os cards: quem não o vê acha os mesmos cards na lista de cards e
  em outro board (ADR 0007 do Core).
- Quem perde o acesso a um board continua vendo-o até a lista de boards ser relida; aí o Core
  responde 404, e a tela abre o primeiro board que a pessoa vê, com o aviso de board inexistente.
- A lista de quem vê o board não mostra o administrador da organização que não está no time,
  embora ele veja todo board.
- Abrir os subitens de um card lê a lista dele toda (`GET /api/v1/cards/{cardId}/tasks`), e o
  cartão filtra o tipo; um card com muitos subitens lê todos para mostrar um tipo.
- Coluna com mais de 100 cards mostra só os 100 mais novos, porque o Core não pagina a coluna. O
  link do aviso leva à lista de cards filtrada pelo estado, que não aplica o filtro do board.
- Com coluna cortada, as raias por responsável e a contagem de cada raia só consideram os cards
  que vieram.
- O card movido aparece no topo da coluna nova até as colunas voltarem; depois vai para a posição
  que o Core der.
- Enquanto o time carrega, ou se a consulta dele falha, só há raia para quem tem card na tela e a
  de "Sem responsável"; o seletor "Responsável", que lê o mesmo time, avisa a falha.
- O filtro salvo do board não limita as raias: num board que filtra responsáveis, soltar o card
  na raia de quem está fora do filtro, ou em "Sem responsável", tira o card do board quando as
  colunas voltam.
- Mover entre raias e colunas são duas gravações. Se o Core aceita o estado e recusa o
  responsável (a pessoa saiu do time), o card fica no estado novo com o responsável de antes.
- A contagem de tasks abertas da confirmação é a do resumo lido: task criada ou concluída por
  outra pessoa depois da leitura não entra na conta, e o Core fecha as que houver.
- Arrastar não funciona por teclado e, em toque, depende do navegador; o caminho garantido é o
  seletor do cartão.
- O papel é o do cache: quem perde a administração do projeto continua vendo criar, editar e
  excluir até a próxima consulta, e o Core recusa.
- Board da URL que não existe mais dá lugar ao primeiro board do projeto, com o aviso, e o
  endereço continua com o id antigo até a pessoa trocar de board.
- O diálogo do primeiro acesso depende da marca em memória: recarregar a página antes de criar ou
  pular a perde, e o projeto fica sem board, com o estado vazio de sempre.
- Responsável da URL que saiu do time: o seletor mostra "Todos", mas o filtro continua valendo
  até a pessoa mexer nele.
- Se outra pessoa exclui o board aberto, a tela continua com as colunas que já tinha lido (ou
  mostra "Board não encontrado", se ainda não tinha lido nenhuma) até a lista de boards ser
  relida.
- O formulário do board abre num diálogo: clicar fora ou apertar Esc fecha e perde o que foi
  marcado.
- A tela não resume o filtro do board: quem não administra o projeto não vê o que o board filtra.
- O card novo do board nasce sem descrição e com os campos do tipo vazios: para preenchê-los, a
  pessoa abre o card pela ação do aviso ou pelo título no cartão.
- Um responsável ou uma feature do filtro salvo que não existe mais no projeto faz o Core recusar
  o card novo; a mensagem aparece embaixo do formulário, e o card só nasce com o filtro editado ou
  com uma pessoa escolhida no seletor "Responsável".
- Fechar o formulário do card novo (Esc, "Cancelar", trocar de board ou de filtro) perde o título
  digitado.

## OBJETIVOS

- O que a pessoa vê depois de mover um card é o que o Core gravou.
- Nenhum board gravado com referência que o projeto não tem mais.

## NAO_OBJETIVOS

- Ordem manual dos cards na coluna e paginação da coluna: o Core não oferece.
- Criar card com todos os campos a partir do board: é a tela de card novo.
- Confirmar outras mudanças de estado: só concluir com task aberta pergunta.
- Colunas próprias por board, ou administração dos estados do projeto.
- Substituir a validação de acesso do Core: quem não administra recebe 403 de lá.

## VERIFICACAO

- `npx vitest run src/features/card/ui/card-tile.test.tsx` cobre os botões por tipo, a leitura só
  ao abrir, a releitura das colunas, o cartão parado com a lista aberta e o menu de três pontos
  (INV-27 a INV-29, INV-32).
- `npx vitest run src/features/board/ui/project-board.test.tsx` cobre o item "Acesso ao board", o
  diálogo e o selo (INV-9, INV-34, INV-35); `rg -n "OpenedCardDialog|refreshColumns"
  src/pages/board/project-board/index.tsx` mostra a modal e a releitura ao fechar (INV-33).
- `npx vitest run src/features/board src/app/stores src/app/routes/home.routes.test.tsx
  src/features/card/model/hooks/use-move-card.test.ts
  src/features/card/model/hooks/use-card-drag.test.ts
  src/features/card/model/hooks/use-completion-confirmation.test.ts
  src/features/card/model/lib/card-state-columns.test.ts
  src/features/card/model/lib/card-completion.test.ts
  src/features/card/ui/card-state-columns.test.tsx src/app/routes/board-search.test.ts`
- `rg -n "api/v1/cards|@/features/card" src/features/board --glob '!**/*.test.*'` só devolve
  imports de tipos, de `toCardState` e `toCardSummary`, das listas e opções de tipo e de
  prioridade, e de `toAssigneeOptions` e `toFeatureOptions` (INV-1).
- `rg -n "mutate" src/features/card/model/hooks/use-move-card.ts` devolve duas chamadas: a de
  `update`, só com `cardId` e `cardStateId`, e a de `assignment`, depois dela (INV-1).
- `rg -n "@/features/board" src/features` não devolve nada (INV-2).
- `rg -n "staleTime" src/features/board/api/board.queries.ts` devolve a linha de
  `useListBoardColumns` (INV-7).
- `rg -n "canAdminister" src/features/board/ui --glob '!**/*.test.*'` mostra o valor nascendo de
  `canAdministerProject` em `project-board.tsx` e condicionando "Novo board", o menu do board
  ("Editar board", "Editar colunas" e "Excluir") e "Criar o primeiro board" (INV-9).
- `rg -n "deleteBoard|removeBoard" src/features/board --glob '*.tsx' --glob '!**/*.test.*'` só
  devolve `selected-board.tsx`, com `removeBoard` dentro do `useConfirmation` ligado ao
  `ConfirmDialog` (INV-10). `npx vitest run src/features/card/ui/card-tile.test.tsx` cobre a troca
  de tipo antes de criar (INV-31), e `src/features/board/ui/project-board.test.tsx`, o menu e a
  edição das colunas (INV-9, INV-30).
- `rg -n "onSuccess|onError" src/features/board/api/board.mutations.ts` mostra `refreshBoardLists`
  na criação e na exclusão, `refreshBoards` na alteração, no acesso e nas pessoas escolhidas, e
  `refreshEverything` em todos os erros (INV-12).
- `rg -n "@/features/board" src/app` só devolve linhas `import type` (INV-13).
- `rg -n "MarkdownContent|MarkdownSection|dangerouslySetInnerHTML"
  src/features/card/ui/card-tile.tsx src/features/card/ui/card-lane-row.tsx
  src/features/card/ui/card-state-columns.tsx` não devolve nada (INV-14).
- `rg -n "assignee_id|assigneeId" src/features/board/api/board.service.ts` só mostra o parâmetro
  de `listBoardColumns` e o critério do filtro; `toCardLanes` não aparece em `src/features/board`
  (INV-15).
- `rg -n "CardCompletionDialog|completion.request" src/features/card/ui/card-state-columns.tsx`
  mostra o arrasto e o seletor do cartão passando por `requestMove`, que pede a confirmação antes
  de `move` (INV-17).
- `rg -n "assignee: lane.assignee" src/features/card/ui/card-lane-row.tsx` mostra a raia levando o
  responsável dela ao soltar; a raia sem agrupar não tem `assignee` (INV-18).
- `rg -n "removedBoardId" src/features/board/ui/project-board.tsx` mostra o aviso condicionado a
  `isMissingBoard` e ao board excluído pela tela (INV-19).
- `rg -n "isUnassigned: true" src/features/board/model/lib/board-options.ts` mostra
  `fromAssigneeChoice` limpando `assigneeId` quando escolhe "Sem responsável", e a escolha de uma
  pessoa limpa `isUnassigned` (INV-20).
- `rg -n "FirstBoardDialog" src --glob '!**/*.test.*'` só devolve a feature `board`,
  `pages/organization/projects` e `pages/home/project-list` (INV-21).
- `npx vitest run src/features/card/model/lib/card-state-columns.test.ts
  src/features/card/ui/card-state-columns.test.tsx`, nos testes de `toCardLanes` e de "raias de
  todo o time"; `rg -n "useListProjectMembers" src/features/card/ui/card-state-columns.tsx` mostra
  o time que entra no agrupamento, e `rg -n "savedFilter" src/features/board` mostra o filtro
  salvo saindo do board para as colunas (INV-22).
- `rg -n "useFirstBoardStore" src --glob '!**/*.test.*'` só devolve `src/app`: o store, a rota de
  `/` e a de `/primeiro-acesso`; `rg -n "persist" src/app/stores --glob '!**/*.test.*'` não
  devolve nada (INV-23).
- `rg -n "api/v1/cards|createCard" src/features/board --glob '!**/*.test.*'` não devolve nada, e
  `rg -n "useCreateCardMutation" src/features/card --glob '!**/*.test.*'` só devolve a mutation,
  `use-create-card.ts` e `use-quick-create-card.ts` (INV-24).
- `npx vitest run src/features/card/model/lib/card-form-values.test.ts`, nos testes de
  `toQuickCardDefaults` (INV-25).
- `npx vitest run src/features/card/model/hooks/use-quick-create-card.test.ts
  src/features/card/ui/card-state-columns.test.tsx`, nos testes do card novo; `rg -n
  "containsCard" src/features/card/model/hooks/use-quick-create-card.ts` mostra a procura nas
  colunas relidas (INV-26).
