# Board

A tela dos boards de um projeto: o seletor de board, as colunas por estado com os cards, o card
novo no topo da primeira coluna, arrastar entre colunas e raias, a visão por responsável, a
confirmação de concluir com task aberta, a administração dos boards e o diálogo do primeiro board, depois de "Novo projeto" e no fim do
primeiro acesso. O contrato da API está em
`../Momentum.Core/ai/memory/incremental/cards.md`, seções "Boards" e "Para o Momentum.Web (passo
6.2)"; o que não pode quebrar, no conhecimento `telas-de-board`. Aqui fica o que o código não
conta.

## Rotas

| Rota | Tela | Por que este caminho |
| --- | --- | --- |
| `/projetos/$projectId/boards` | Boards do projeto, com um board aberto numa das visões (colunas, lista de cards, features, epics) | Os boards são de um projeto, e o seletor precisa da lista deles. Desde 2026-10-22 é o único hub do projeto: `/projetos/$projectId/cards` e `/projetos/$projectId/features` só redirecionam para as visões daqui (ADR 0009 do Core). |

- Fica na área `member`. Chega-se a ela pelo nome do projeto e pelo link "Boards" na página
  inicial, pelo nome do projeto na aba "Projetos" da organização e pelo item "Boards" da navegação
  lateral; por isso a tela não tem link "Voltar".
- O board aberto, o responsável, o agrupamento e o card aberto são parâmetros da URL: `board` (o id
  do board), `responsavel` (o id da pessoa, ou `nenhum` para só os cards sem responsável),
  `agrupar=responsavel`, `card` (o id do card aberto na modal, passo 11.6), `nivel` (`features` ou
  `epics`; sem ele, cards), `exibir=lista` e, na lista de cards, `tipo`, `estado`, `feature`,
  `arquivados` e `pagina`, os mesmos da antiga lista do projeto. O padrão não vai para a URL: sem `board` vale o primeiro board do
  projeto, na ordem de criação. `board` fica em inglês porque é o termo do glossário.
- `app/routes/board-search.ts` valida a URL e traduz para a visão da feature (`BoardView`, com
  `assigneeId` ou `isUnassigned`), e de volta. O que não é id, `nenhum` nem `responsavel` é
  descartado. A lista de cards usa o mesmo `nenhum`, para o link "Ver na lista" levar o filtro:
  o valor e a tradução de ida e volta moram em `shared/lib/assignee-search.ts`, e `readId` e
  `readAssigneeSearch`, que conferem a URL, em `app/routes/search-id.ts`, usados pelas duas
  rotas.
- Não há rota por board (`/boards/$boardId`): o seletor troca o parâmetro, e criar e editar são
  diálogos.

## Quem é dono de quê

- A feature `board` (`src/features/board`) é dona de `/api/v1/boards`, inclusive
  `/api/v1/boards/{boardId}/columns`: a lista, as colunas, criar, alterar e excluir.
- **Mover o card é da feature `card`**: é `PATCH /api/v1/cards/{cardId}` e, entre raias,
  `PUT` ou `DELETE /api/v1/cards/{cardId}/assignee`. As colunas movíveis (`CardStateColumns`, com
  o cartão, o arrastar, o seletor de estado, as raias e a confirmação de concluir) moram em
  `src/features/card`. A página (`pages/board/project-board`) pega as colunas que o
  `ProjectBoard` leu e as entrega ao `CardStateColumns`, junto com a função que as relê.
- **Criar o card também é da feature `card`** (`POST /api/v1/cards`): `CardQuickCreate` e
  `useQuickCreateCard`, sobre a mesma `useCreateCardMutation` da tela de card novo. O board
  entrega no `renderColumns` o filtro salvo inteiro (`savedFilter`, o `filter` do board) e a
  releitura (`reload`), que devolve as colunas relidas, ou nada quando a releitura falha; a
  página repassa os dois ao `CardStateColumns` e dá o `onOpenCard`, que navega para o card.
- A divisão, numa frase: o board decide quais cards aparecem; a feature de card os mostra, os cria
  e os move.
- `board` lê de `card` os tipos, os adaptadores do contrato (`toCardState`, `toCardSummary`: a
  coluna traz o mesmo resumo de card da lista), as listas e opções de tipo e de prioridade, e
  `toAssigneeOptions` e `toFeatureOptions`. Lê de `feature` as listas de features e de epics, e de
  `project`, o projeto, o time e `canAdministerProject`.
- A direção é `board → card → feature → project → organization → account`; `card` nunca importa
  de `board`.
- A feature não conhece URL: `cardsLink`, `renderCardLink` e `renderStateCardsLink` entram pela
  página, a troca de board, de responsável e de agrupamento sai por `onViewChange`, e abrir o card
  novo, por `onOpenCard`.
- O diálogo do primeiro board (`FirstBoardDialog`) também é da feature `board` e sai pelo
  `index.ts` para duas páginas: `pages/organization/projects`, que o entrega à lista de projetos da
  feature `project` em `renderNextStep` (`project` não importa de `board`), e
  `pages/home/project-list`, que o carrega sob demanda e o mostra enquanto a rota de `/` lhe passar
  o projeto marcado em `useFirstBoardStore`.
- As raias leem o time do projeto pela feature `card`, com `useListProjectMembers` de `project`;
  a página entrega ao `CardStateColumns` o projeto, o responsável escolhido no seletor e o filtro
  salvo (`savedFilter`, de onde as raias tiram os responsáveis salvos). O tipo do filtro na
  feature `card` é `SavedCardFilter`, que o `BoardFilter` satisfaz sem import de `board`.

## Fluxos

- **Projeto sem board.** É o estado inicial de todo projeto. Quem administra vê "Criar o primeiro
  board"; quem não administra vê a explicação e o link para a lista de cards.
- **Board aberto.** No topo, uma barra numa linha que quebra, com os seletores "Board",
  "Responsável" (começa em "Todos"; depois vêm "Sem responsável" e o time) e "Agrupar por", cada
  um com o rótulo ao lado, e, à direita, o selo "Acesso restrito" quando o board é só das pessoas
  escolhidas e, para quem administra, o menu de três pontos com "Editar board", "Editar colunas"
  (os estados do projeto, num diálogo largo, com criar, renomear, reordenar, mudar a categoria e
  excluir; valem para todos os boards), "Acesso ao board" e "Excluir", que pede confirmação; "Novo board" fica no cabeçalho da tela. Embaixo, uma coluna por estado, na ordem do
  fluxo, esticada até preencher a largura (no mínimo 256 px; quando não cabem, a área das colunas
  rola na horizontal). O cabeçalho da coluna tem o nome, o total numa pílula e um traço em cima no
  tom da categoria do estado. A coluna é uma zona rebaixada, e o cartão, de vidro com a borda
  esquerda na cor do tipo, como no Azure DevOps, mostra identificador e tipo, a prioridade só
  quando alta ou urgente, o título (link para o card), os botões de subitens e, no rodapé, o avatar e o nome do responsável (ou "Sem responsável") e o seletor de
  estado, discreto, com cara de texto.
- **Card novo.** "Novo card", no topo da primeira coluna, abre ali um formulário com o tipo e o
  título. Enter (ou "Criar card") cria; Esc (ou "Cancelar") fecha e devolve o foco ao botão. O
  card nasce no estado da primeira coluna, com o responsável escolhido no seletor "Responsável"
  (ninguém com "Sem responsável"), senão o único responsável do filtro salvo, senão ninguém; o
  tipo começa no único tipo do filtro salvo, senão user story; a prioridade é a única do filtro
  salvo, senão média; a feature, a única do filtro salvo, senão nenhuma. Depois de criar, o
  formulário continua aberto, com o mesmo tipo e o título limpo e focado, para o próximo, e as
  colunas são relidas. Um toast diz "O card MOM-12 foi criado." ou, se o card não voltou nas
  colunas relidas, "O card MOM-12 foi criado, mas não casa com o filtro deste board."; os dois
  têm "Abrir o card".
- **Visões** (passo 11.12). "Visão" (Cards, Features, Epics) e "Ver como lista"/"Ver como board"
  na barra. Trocar de board mantém a visão; trocar de visão limpa os filtros da lista. Cards em
  lista é a tabela da antiga lista do projeto, com Tipo, Estado, Feature e Arquivados embaixo da
  barra (o Responsável é o da barra); Features e Epics em board são as colunas pelo estado
  derivado, com a borda roxa e dourada; em lista, a hierarquia, com "Nova feature" e "Novo epic".
  Os dados vêm de `GET /api/v1/boards/{boardId}/cards`, `/features` e `/epics`, no recorte e no
  acesso do board.
- **Clicar fora do cartão** (passo 11.11). Com a lista de subitens aberta (pelo botão do tipo ou
  pelo menu), um clique fora do cartão fecha a lista e o campo e descarta o que foi digitado.
  Clique no subitem aberto num diálogo, no menu flutuante ou num toast não fecha.
- **Abrir o card.** O título do cartão leva ao mesmo board com `card` na URL, e o card abre na
  modal (`OpenedCardDialog`), com as guias; fechar pelo X, Esc ou clique fora tira o `card` da URL
  e relê as colunas.
- **Menu do cartão** (passo 11.5). Os três pontos no topo do cartão, ao lado da prioridade, com
  "Adicionar task", "Adicionar bug" e "Adicionar impedimento", também no card que ainda não tem
  subitem do tipo: abre a lista do tipo no cartão com o campo de criar focado. O menu flutua num
  portal acima das colunas, para não ser cortado pela rolagem delas.
- **Acesso ao board** (passo 11.9). Diálogo com "Todo o time do projeto" ou "Só as pessoas
  escolhidas"; trocar grava na hora. Restrito, lista os administradores do projeto (que sempre
  veem) e as pessoas escolhidas, com "Tirar", e embaixo "Dar acesso a" com quem do time ainda não
  vê; aberto, lista o time inteiro. Os cards do board seguem visíveis a todo o time na lista de
  cards, e o diálogo diz isso.
- **Subitens no cartão** (passo 6.7, como o checklist do card no VSTS). Um botão por tipo que o
  card tem, com ícone e concluídos sobre o total ("Tasks 2/5", "Bugs 0/1", "Impedimentos 1/1"),
  vindo do `subitem_counts` do resumo; o de impedimentos fica em `danger-soft` enquanto há
  impedimento aberto. O clique abre, no próprio cartão, a lista daquele tipo: a caixa conclui ou
  reabre, o título abre o mini card do subitem (o mesmo diálogo da tela do card) e o campo de
  baixo cria outro do mesmo tipo com Enter. A lista só é lida ao abrir, e toda mudança relê as
  colunas, porque a contagem vem delas. Com a lista aberta, o cartão não arrasta.
- **Mover.** Arrastando o cartão para a coluna de outro estado, ou escolhendo o estado no seletor
  do cartão. O card aparece na coluna nova na hora, os cartões ficam travados, e as colunas são
  relidas quando o Core responde. Não há aviso de sucesso: o cartão no lugar novo já diz.
- **Mover entre raias.** Agrupado por responsável, soltar o cartão na raia de outra pessoa troca
  o responsável para ela, e soltar na raia "Sem responsável" o tira; se a coluna também mudou, o
  estado muda junto. Dá para soltar na mesma coluna de outra raia, só para trocar o responsável. O
  card aparece na raia e na coluna novas na hora, como no movimento entre colunas. O seletor do
  cartão só muda o estado.
- **Concluir com task aberta.** Levar a um estado da categoria concluído um card com task aberta,
  arrastando ou pelo seletor, abre "Concluir MOM-12?" com "O card tem 2 tasks abertas, que serão
  concluídas." O card só sai do lugar no "Concluir"; "Voltar" e fechar o deixam onde estava. Sem
  task aberta, move direto.
- **Visão por responsável.** "Responsável" filtra no Core (`?assignee_id=`, ou `?unassigned=true`
  para "Sem responsável"), por cima do filtro salvo. "Agrupar por: Responsável" divide as mesmas
  colunas em raias, uma para cada pessoa do time do projeto e para quem tem card na tela sem estar
  mais no time, em ordem alfabética, e "Sem responsável" por último, vazias quando for o caso; o
  cabeçalho das colunas continua um só, com o total do estado. Soltar o card na raia vazia de
  alguém do time dá o card a essa pessoa. Com uma pessoa escolhida em "Responsável", só a raia
  dela; com "Sem responsável", só essa. Num board cujo filtro salvo escolhe responsáveis, com
  "Todos" no seletor, as raias do time são só as desses responsáveis, sem a de "Sem responsável".
  Enquanto o time carrega, ou se a consulta falha, só há raia para quem tem card e, quando cabe, a
  de "Sem responsável".
- **Coluna cortada.** Quando o total passa dos cards que vieram, o cabeçalho mostra "100 de N
  cards" e o link "Ver na lista", para a lista do mesmo board filtrada pelo estado e, se houver, pelo
  responsável escolhido ou por "Sem responsável".
- **Criar e editar.** Um diálogo com o nome e os cinco critérios, cada um num grupo de caixas de
  marcar: tipos de card, prioridades, responsáveis (o time), features e epics. Depois de criar, a
  tela abre o board novo. Editar parte do board aberto.
- **Excluir.** Com confirmação, que diz que os cards não mudam. Depois, a tela volta ao primeiro
  board, ou ao estado de projeto sem board.
- **Board do endereço que não existe mais.** A tela mostra o primeiro board do projeto com o
  aviso "O board deste endereço não existe mais: a tela mostra o primeiro board do projeto." O
  aviso some quando a pessoa escolhe um board.
- **Primeiro board de um projeto novo.** Na área da organização, depois de "Novo projeto", e no
  fim do primeiro acesso, em `/`, o diálogo "Crie o primeiro board" abre com o formulário de
  board, o nome "Todos os cards" e nenhum critério marcado. "Criar board" cria, avisa num toast e
  fecha, e a pessoa fica onde está (pergunta 83); "Pular", o X, o Esc e o clique fora fecham sem
  board, e o projeto fica com o estado vazio de sempre. O diálogo não volta. No primeiro acesso,
  o guard leva a pessoa a `/` assim que o projeto existe, e o diálogo abre lá, pela marca de
  `useFirstBoardStore` (`app/stores/`); recarregar a página antes de terminar perde a marca, e o
  diálogo não volta.

## Contrato, onde é traiçoeiro

- **O `PATCH` de board troca o filtro inteiro quando ele vai.** O formulário manda sempre o nome e
  os cinco critérios; não há gravação de um critério só.
- **O Core confere o id que entra no filtro, não o que já estava gravado.** Um board guarda o id
  de quem saiu do time, ou de feature e de epic excluídos, e esse id órfão não casa com card
  nenhum. Mandá-lo de volta no `PATCH` responde 422. Por isso `keepExistingReferences` tira do
  filtro o que não está nas listas carregadas, e o diálogo de edição avisa quando isso vai
  acontecer.
- **Critério vazio não filtra.** Board criado sem marcar nada mostra todos os cards não
  arquivados do projeto.
- **Vêm todos os estados, inclusive os vazios**: a tela não busca os estados à parte, e as opções
  do seletor do cartão saem das próprias colunas.
- **Mudar o estado não tira o card do board**, porque o filtro não tem critério de estado. Ele só
  some se outra coisa mudou no meio-tempo (o tipo não muda; a prioridade, o responsável e a
  feature, sim).
- **`total_count` é do estado inteiro no board**, não da raia: a contagem de cada raia é a dos
  cards que vieram.
- **`assignee_id` e `unassigned=true` juntos devolvem as colunas vazias**: a visão leva um ou o
  outro, nunca os dois.
- **Trocar o responsável não passa pelo `PATCH`**: é `PUT /api/v1/cards/{cardId}/assignee` com
  `user_id`, ou `DELETE` na mesma rota. O movimento entre raias e colunas grava o estado primeiro e
  o responsável depois.
- **Concluir fecha as tasks abertas no Core**, em qualquer estado da categoria `done`, inclusive
  de um concluído para outro; cancelar não fecha. A tela conta as abertas pelo resumo da coluna
  (`task_count` menos `done_task_count`).
- **`GET /api/v1/boards/{boardId}` não é usado**: a lista já traz o filtro de cada board.
- **O papel vem da lista de projetos** (`GET /api/v1/projects`, pelo `ProjectContent`), que traz
  o mesmo `role` de `GET /api/v1/projects/{projectId}` e já está em cache por causa do guard e da
  página inicial.

## Erros

- Mover: `CardChangedMeanwhile` (409) vira toast pedindo para mover de novo, com a mensagem da
  tela e não a do Core, que manda "Recarregue": aqui o board já recarregou. Os demais
  (`CardStateInvalid`, quando o estado foi excluído; `CardNotFound`; `CardAssigneeOutsideProject`,
  quando a pessoa da raia saiu do time; falha de rede) viram toast com a mensagem do Core. Em
  todos, as colunas são relidas e mostram o que o Core gravou. Se o estado é recusado, o
  responsável nem é tentado; se o responsável é recusado depois do estado, o card fica no estado
  novo, na raia de antes.
- Formulário: `applyApiErrors`. `BoardNameAlreadyUsed` (409), `BoardNameRequired` e
  `BoardNameTooLong` vêm com `property: name` e vão para o campo. `BoardAssigneeOutsideProject`,
  `BoardFeatureInvalid`, `BoardEpicInvalid` (422) e `BoardFilterTooLarge` (400) vêm com
  `property: filter`, que não tem campo próprio: aparecem num aviso no topo do diálogo
  (`root.filter`). `BoardLimitReached` (422, 50 boards) e `BoardAdministrationDenied` (403) vêm
  sem `property`: toast, e o diálogo continua aberto.
- Excluir: toast com a mensagem do Core, e a tela continua no board.
- Card novo: erro do título (`property: title`) vai para o campo; o de um padrão do board que o
  Core recusa (`CardAssigneeOutsideProject`, `CardFeatureInvalid`, `CardStateInvalid`, com
  `property` de responsável, feature, estado ou prioridade) aparece embaixo do formulário
  (`root.defaults`), sem toast; o resto vira toast. O que foi digitado fica no formulário.
- Toda recusa de criar, alterar e excluir invalida o cache inteiro: o papel, o time, as features
  e os epics voltam relidos, e as ações somem para quem deixou de administrar.
- `BoardNotFound` (404) nas colunas (outra pessoa excluiu o board): a tela de erro do
  `QueryContent`, com a mensagem do Core, se as colunas ainda não tinham sido lidas; se já tinham,
  elas continuam na tela até a lista de boards ser relida e a tela trocar de board.
- Projeto que a pessoa não enxerga: "Projeto não encontrado", do `ProjectContent`.

## Decisões

- **Arrastar sem biblioteca.** `draggable`, `onDragStart`, `onDragOver` e `onDrop` do HTML5. O
  cartão arrastado fica no estado do React (`useCardDrag`), e não só no `dataTransfer`: é o que
  deixa recusar o que vem de fora do board, destacar a coluna de destino e não aceitar o card na
  coluna em que ele já está. O `dataTransfer` leva só o identificador, porque o Firefox não
  começa o arrasto sem dado.
- **O seletor de estado em todo cartão** é o caminho por teclado e por toque. É o `select` nativo,
  na variante discreta do `SelectField` (`quiet`: sem borda, do tamanho da opção escolhida, com a
  seta própria), no rodapé do cartão, sem rótulo visível (`Estado de MOM-12` para leitor de tela).
  Até a segunda rodada de UX ele ocupava a largura do cartão, com a cara de um campo.
- **Visão por responsável nas duas formas**: o filtro no Core e as raias no cliente. As raias
  couberam porque o board já é uma grade de linhas: sem agrupar, há uma linha só, sem título.
- **Otimista por derivação, não no cache.** `moveCard` aplica o movimento pendente sobre as
  colunas lidas; no erro, esquecer o movimento já desfaz. A feature `card` não escreve no cache
  de `board`, que ela não conhece.
- **Uma rota com o board na URL**, e não uma rota por board: o seletor precisa da lista de boards
  do projeto, que `GET /api/v1/boards/{boardId}` não dá.
- **Board da URL que não existe cai no primeiro, com aviso**, em vez de "Board não encontrado":
  é o que acontece ao abrir um endereço antigo e quando outra pessoa exclui o board aberto. A URL
  continua com o id antigo até a pessoa trocar de board.
- **O aviso não aparece para o board que a própria tela excluiu.** A exclusão só termina depois
  de a lista de boards voltar relida, e só então a URL perde o id: nesse meio-tempo a lista já
  não tem o board e a URL ainda o pede. A tela guarda o id do board que mandou excluir
  (`removedBoardId`) e não avisa por ele.
- **Concluir com task aberta pergunta; mover para outro estado, não.** A confirmação é um
  `ConfirmDialog` aberto pela escolha no seletor ou pelo soltar, antes de `move`: o movimento
  otimista só começa depois do "Concluir".
- **Raia de destino diz o responsável, a falta de raia não.** Cada raia agrupada leva o
  responsável dela (`assignee`, ou `null` em "Sem responsável") ao soltar; a raia única de quem
  não agrupa não leva nada, e o responsável não muda.
- **O primeiro board é um diálogo depois do "Novo projeto"**, e não a tela de boards aberta com o
  formulário: a pessoa continua na lista de projetos da organização, onde estava, e cancelar não
  a tira dali.
- **No primeiro acesso, o diálogo abre em `/`, pela marca de um store** (pergunta 82). O INV-6 de
  `guard-de-rota` fica: o guard leva quem tem projeto de `/primeiro-acesso` para `/`, e o que
  atravessa a troca de tela é `useFirstBoardStore`, o primeiro store do projeto, com Zustand e
  Immer. A marca guarda o projeto que o `POST` devolveu e é só memória: some ao recarregar.
- **Em `/`, o diálogo chega sob demanda** (`lazy` do React): ele traz o formulário de board, com
  React Hook Form, Zod e o diálogo do Radix, e a página inicial é a primeira tela de quem já tem
  sessão (conhecimento `carga-inicial`, INV-5).
- **Raias de todo o time** (pergunta 84): a raia vazia é o lugar onde se solta o card para dar
  trabalho a quem ainda não tem. O seletor "Responsável" manda nas raias, porque com ele o Core só
  devolve os cards do filtro e as outras raias ficariam vazias para sempre. Pelo mesmo motivo o
  filtro salvo limita as raias quando o seletor está em "Todos" (pergunta 96): soltar o card na
  raia de quem está fora do filtro o tiraria do board quando as colunas voltassem. A escolha
  explícita do seletor continua valendo sobre o filtro salvo.
- **Criar e editar em diálogo**, como feature e epic: é um nome e caixas de marcar.
- **O formulário manda o filtro que mostra.** O que não existe mais no projeto sai ao salvar, com
  aviso. A alternativa, mandar o filtro só quando ele muda, deixaria o id órfão escondido, com o
  board vazio e nenhuma caixa marcada.
- **Colunas que esticam, com rolagem horizontal** (`min-w-64 flex-1`), e a tela na largura toda
  (`isWide` do `Screen`). Cada linha (cabeçalhos e raias) é um `flex` da largura da área, e as
  colunas de todas as linhas dividem essa largura igualmente; quando a soma dos mínimos passa
  dela, as colunas transbordam e o contêiner `relative` rola. O mínimo é 256 px, e não os 288 px
  pedidos no passo 2.9: com a navegação aberta, quatro colunas cabem em 1440 px; cinco cabem com
  ela recolhida.
- **Card novo inline, como o "New item" do Azure DevOps** (passo 6.6): só tipo e título, porque o
  board já diz o resto. O formulário continua aberto depois de criar, com o tipo escolhido,
  porque card no board costuma entrar em sequência, como as tasks no card.
- **O toast do card novo abre o card por uma ação, não por link**: o `Toaster` é montado em
  `app/app.tsx` ao lado do `RouterProvider`, fora do contexto do roteador, e um `Link` dentro do
  toast não teria o roteador. A página entrega `onOpenCard`, que chama o `navigate`.
- **A exclusão invalida só as listas de boards**: invalidar as colunas pediria ao Core o board
  que acabou de sumir. A tela troca de board quando a lista volta.
- **As colunas nascem vencidas** (`staleTime` zero), como as consultas de feature: mudam quando a
  feature `card` mexe num card em outra tela.

## Armadilhas

- **Soltar já limpa o estado do arrasto, sem esperar o `dragend`.** Com o movimento otimista o
  cartão arrastado sai da coluna de origem na mesma hora, e o `dragend` de um nó que saiu da tela
  pode não chegar ao React. O `dragend` continua valendo para o cartão solto fora de qualquer
  coluna.
- **O link do título tem `draggable={false}`** (na página): sem isso o navegador arrasta o link,
  e não o cartão.
- **`SelectedBoard` tem `key` com o id do board**: ao excluir, o componente do board excluído
  desmonta com o diálogo de confirmação aberto, em vez de mostrar o nome de outro board por um
  instante.
- **Grupo de caixas com uma opção só**: o React Hook Form devolve lista porque o valor inicial é
  lista; com valor inicial que não é lista, devolveria `true` ou `false`.
- **Valor marcado cuja caixa sumiu** (a opção saiu da lista depois de uma recusa): pode continuar
  no valor do formulário. Quem garante o que vai para o Core é `keepExistingReferences`, no
  envio.
- **Parâmetro desconhecido na URL** (`?pagina=3`) é ignorado pela tela, mas o router o mantém no
  endereço.
- **Em teste, o `mutationFn` recebe um segundo argumento** do TanStack Query: confira
  `mock.calls[0][0]`, não `toHaveBeenCalledWith`.
- **Em teste de arrastar no jsdom**, passe um `dataTransfer` falso em `fireEvent.dragStart`,
  `dragOver` e `drop`: o jsdom não tem `DataTransfer`.
- **Em teste das raias, o time chega depois das colunas**: a primeira renderização tem só as
  raias de quem tem card. Para conferir o que o filtro faz com as raias do time, espere a raia de
  alguém sem card aparecer e só então troque o filtro (`rerender`), ou o teste passa antes de o
  time chegar.
- **Com um diálogo aberto, o resto da tela some da árvore de acessibilidade** (o Radix põe
  `aria-hidden` nela): em teste, `getByRole` não acha as colunas enquanto a confirmação está
  aberta. Confira o board depois de fechar o diálogo.
- **A releitura devolve as colunas pelo resultado do `refetch`**, e não pelo `data` da query: o
  `refetch` que falha devolve o `data` antigo com `status: "error"`, e o card novo pareceria fora
  do filtro. Por isso o `reload` só devolve as colunas com `isSuccess`.
- **Trocar o board, o responsável ou o agrupamento fecha o formulário do card novo**: as colunas
  voltam ao carregando (outra chave de consulta) e o formulário desmonta com o que foi digitado.
- **Em teste, a prioridade do cartão tem um prefixo só para leitor de tela** ("Prioridade "):
  `getByText("Alta")` acha o badge, e `toHaveTextContent("Prioridade Alta")` confere o nome
  inteiro.

## Ainda não existe

- Resumo do filtro do board na tela, para quem não administra.
- Acesso por board que esconda também os cards (ADR 0007 do Core: não é objetivo).
- Raia por outro critério (feature, prioridade).
- Paginação da coluna e ordem manual dos cards: não existem no Core.
