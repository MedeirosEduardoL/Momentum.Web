# Cards

A lista de cards de um projeto, o detalhe do card (com as tasks, as relações e a feature dele) e
os formulários de criar e editar, com os campos de cada tipo. O contrato da API está em
`../Momentum.Core/ai/memory/incremental/cards.md`; o que não pode quebrar, no conhecimento
`telas-de-card`. A hierarquia do projeto e as telas de feature e de epic têm nota própria,
`features-e-epics.md`, e o board, `board.md`. Aqui fica o que o código não conta.

## Rotas

| Rota | Tela | Por que este caminho |
| --- | --- | --- |
| `/projetos/$projectId/cards` | Lista de cards do projeto | A lista é de um projeto: sem ele não há o que listar. |
| `/projetos/$projectId/cards/novo` | Formulário de criar | O card nasce num projeto e não sai dele. |
| `/cards/$cardId` | Detalhe em página inteira | O card se acha pelo id, como em `GET /api/v1/cards/{cardId}`. Uma relação entre cards de projetos diferentes aponta para cá sem saber o projeto. Desde 2026-10-22 é o "Abrir em página inteira" da modal. |
| `?card=<id>` no board e na lista | Card aberto em modal | O jeito principal de abrir um card (passo 11.6, ADR 0008 do Core): a modal fica sobre a tela, e o endereço com o card aberto se recarrega e se compartilha. |
| `/cards/$cardId/editar` | Formulário de editar | Segue o detalhe. |

- As quatro ficam na área `member`. Chega-se à lista pelo link "Lista de cards" de cada projeto na
  página inicial e pelo item "Lista de cards" da navegação lateral, o último, porque o board é a
  tela principal; por isso a lista não tem link "Voltar", e o detalhe e os formulários têm ("Voltar
  para o board").
- Os filtros da lista são parâmetros da URL, em português: `tipo`, `estado`, `responsavel`,
  `feature`, `arquivados` e `pagina`. Os valores são os do contrato (`tipo=user_story`, o id do
  estado, o id da pessoa, o id da feature), sem tabela de tradução. O padrão não vai para a URL:
  sem filtro, o endereço fica limpo. `feature` fica em inglês porque é o termo do glossário.
- `app/routes/card-list-search.ts` valida a URL e traduz para o filtro da feature, e de volta. O
  que não é tipo conhecido, id ou página inteira maior que 1 é descartado. O formato do id é
  conferido por `readId`, de `app/routes/search-id.ts`, que o board também usa.

## Quem é dono de quê

- A feature `card` é dona de `/api/v1/cards` (inclusive `/tasks`, `/relations`, `/assignee` e
  `/feature` de um card), de `/api/v1/card-tasks`, de `/api/v1/card-relations` e de
  `GET /api/v1/card-states`. Estados, tasks e relações moram nela porque no Core são da slice de
  card.
- Ela lê da feature `project`: `ProjectContent` (o projeto vindo da lista em cache, com "Projeto
  não encontrado"), `useListProjectMembers` (o time, de onde saem os responsáveis possíveis do
  card e das tasks) e `useListProjects` (os projetos em que se procura o outro card de uma
  relação).
- Ela lê da feature `feature`: `useListFeatures` e `useListEpics`, para o seletor de feature do
  card, o do formulário de criar, o epic mostrado ao lado e o filtro da lista. Pôr e tirar o card de uma feature é ação de
  card (`PUT` e `DELETE /api/v1/cards/{cardId}/feature`), e por isso mora aqui.
- A direção é `board → card → feature → project → organization → account`; `feature` nunca
  importa de `card`, e `card` nunca importa de `board`.
- Mover o card de estado no board é ação de card (`PATCH /api/v1/cards/{cardId}`), e trocar o
  responsável soltando-o em outra raia também (`PUT` e `DELETE /api/v1/cards/{cardId}/assignee`);
  por isso as colunas movíveis (`CardStateColumns`, `useMoveCard`) moram aqui, e a feature
  `board` só decide quais cards aparecem (`board.md`). Para ela o `index.ts` exporta, além dos tipos, os adaptadores
  do contrato (`toCardState`, `toCardSummary`), as listas e opções de tipo e de prioridade, e
  `toAssigneeOptions` e `toFeatureOptions`: leitura, nenhuma ação.
- A feature não conhece URL. Os links entram pela página: `backLink` (nos formulários),
  `renderBackLink` (no detalhe), `newCardLink`, `renderCardLink`, `editLink`, `renderFeatureLink`,
  `renderEpicLink` e `renderRelatedCardLink`, e a navegação depois de gravar, por `onCreated` e
  `onSaved`. "Novo card" e "Editar" são `ButtonLink`, com ícone.
- O painel da entrevista também entra pela página, em `renderInterviews`: é da feature
  `card-interview`, que importa de `card`, e nunca o contrário (`entrevista-do-card.md`). A seção
  do briefing segue o mesmo desenho, em `renderBrief`, da feature `card-brief`
  (`briefing-do-card.md`).

## Fluxos

- **Lista.** Na largura toda da área de conteúdo, com os filtros numa linha que quebra, cada um
  com o rótulo ao lado. 20 cards por página, do mais novo para o mais antigo (a ordem é do Core).
  Mudar um filtro volta para a primeira página. Enquanto a página nova carrega, a anterior continua na
  tela, esmaecida. "Arquivados: Incluídos" mostra os arquivados junto com os demais; o Core não
  lista só os arquivados. "Responsável: Sem responsável" manda `unassigned=true` e fica na URL
  como `responsavel=nenhum`; escolher uma pessoa tira o "sem responsável", e vice-versa. A lista
  é uma tabela, como a do Azure DevOps: identificador com a marca colorida do tipo, título (link)
  com "Arquivado" quando for o caso, tipo, estado e prioridade em badge, responsável e progresso.
  A linha inteira abre o card: o link do título se estica sobre ela (`after:absolute
  after:inset-0`, pela classe do `span` em volta, porque o link vem pronto da página), e a linha é
  `relative`. Para o leitor de tela continua havendo um link só por linha, o do título.
  O progresso some abaixo de `xl`, e a tabela rola na horizontal abaixo de `40rem`. O tom de cada
  estado e prioridade vem de `card-tones.ts`: a fazer e cancelado neutros, em andamento info,
  feito success; prioridade alta warning e urgente danger.
- **Detalhe.** Embaixo do título, o estado em badge, o responsável com avatar (ou "Sem
  responsável") e a prioridade, quando alta ou urgente (`CardHeaderMeta`), lidos do card: mudam
  quando o card volta relido. Estado, prioridade e responsável mudam ao escolher, sem botão de salvar, como o
  papel nas listas da organização: enquanto a chamada corre, o seletor mostra o valor pedido e as
  ações ficam travadas. A exceção é concluir o card com task aberta: escolher um estado da
  categoria concluído abre "Concluir MOM-12?", que diz quantas tasks serão concluídas, e só o
  "Concluir" grava; "Voltar" deixa o seletor no estado de antes. O board usa a mesma confirmação
  (`useCompletionConfirmation` e `CardCompletionDialog`). Arquivar pede confirmação num diálogo
  (resposta 50); desarquivar é na hora; o card arquivado ganha um aviso. O conteúdo vem em guias
  (`CardWorkItem`): Detalhes, Relações (com a contagem), Anexos, Entrevista com IA e Briefing. Em
  Detalhes, em tela larga, são duas colunas: à esquerda descrição, campos do tipo e subitens; à
  direita, no painel "Detalhes do card", as propriedades (estado, prioridade, responsável,
  progresso, datas e arquivar, uma embaixo da outra) e a feature. No celular, o painel vem antes
  do conteúdo, como na ordem de leitura.
- **Card em modal.** `CardDialog`, pelo `OpenedCardDialog` de `widgets/`: o identificador em cima
  do título, o estado, o responsável e a prioridade embaixo, e à direita "Editar" (troca Detalhes
  pelos campos de edição, sem sair da modal), o menu de três pontos com "Abrir em página inteira"
  e o X. Fechar tira o `card` da URL; no board, relê as colunas.
- **Anexos** (passo 11.4, feature `attachment`). Guia "Anexos" do card e seção "Anexos" do
  subitem aberto, da feature e do epic: zona de soltar com "Escolher arquivos", envio um a um com
  a barra de progresso, e a lista com nome, tamanho, quem enviou, data e as ações Visualizar (só
  png, jpeg, gif e webp, por blob), Baixar e Excluir (com confirmação). Arquivo vazio ou acima de
  20 MB vira um toast e não sai. O contrato está em `../Momentum.Core/ai/memory/incremental/anexos.md`;
  o que não pode quebrar, no conhecimento `anexos-do-item`.
- **Feature do card.** Um seletor com "Sem feature" e as features do projeto, que muda ao
  escolher. Embaixo, o link para a tela da feature e o epic dela, com link, ou "Sem epic". O
  progresso da feature não aparece aqui: ele mudaria a cada ação no card, e esta tela não
  recarrega as consultas de feature.
- **Subitens (tasks, bugs e impedimentos).** Na ordem de criação. Cada linha tem o tipo em badge
  ("Task" neutro, "Bug" em perigo, "Impedimento" em atenção), o título (botão que abre o subitem), o seletor de estado (a fazer, em
  andamento, concluída), o de responsável e "Excluir" (com confirmação). Estado e responsável
  mudam ao escolher, e enquanto uma mudança corre todos os seletores da lista ficam travados.
  Embaixo da lista, o formulário de uma linha com o tipo, o título e o responsável: criar limpa o
  título e o responsável e mantém o tipo, e quem cria com Enter continua no campo, para o
  próximo. Com 100 subitens o formulário dá lugar a um aviso.
- **Subitem aberto.** O clique no título abre um diálogo largo, o mini card: estado e responsável
  (mudam ao escolher, como na linha), a descrição pelo `MarkdownSection` ("Passos para
  reproduzir" no bug) e "Editar", que troca o conteúdo pelo formulário de título e descrição.
  Salvar grava com a versão lida e volta à leitura; no 409 o texto fica, com "Carregar a versão
  atual", como no formulário de edição do card. Fechar o diálogo editando perde o que foi
  digitado, como as outras telas de edição (pergunta 80). A linha de progresso das propriedades
  acompanha, porque toda ação recarrega o card.
- **Relações.** Lista com o nome da relação lido a partir deste card, o identificador, o título
  (link), o tipo e o estado do outro card, e "Desfazer" (com confirmação). "Nova relação" abre um
  diálogo com a relação, o projeto do outro card, a busca e o card.
- **Criar.** Tipo, título, descrição, os campos do tipo, estado (começa no primeiro do fluxo),
  prioridade (começa em média), responsável (começa sem) e feature (começa sem, entre as do
  projeto). Trocar o tipo troca os campos na hora;
  o que foi digitado nos campos de outro tipo continua no formulário, mas só o grupo do tipo
  escolhido vai no corpo. Depois de criar, a tela vai para o board do projeto com o card novo
  aberto na modal.
- **Editar.** Só título, descrição e os campos do tipo. O tipo não muda (o formulário nem o
  mostra como campo), e estado, prioridade e responsável ficam no detalhe. O formulário manda o
  `updated_at` que leu como `expected_updated_at`, e o Core recusa a gravação se o card mudou
  desde então, mesmo uma hora depois; as ações rápidas do detalhe e do board não o mandam.
- **Estados do projeto.** Aba "Estados" na área da organização
  (`/organizacao/projetos/$projectId/estados`), com o link ao lado do "Time" na lista de projetos
  só para quem administra o projeto. A aba mostra o fluxo a todo o time do projeto; criar,
  renomear, trocar a categoria (diálogo), subir, descer e excluir (com confirmação) só aparecem
  para quem o administra. Toda mudança relê o cache inteiro, porque os boards mostram os
  estados.
- **Critérios de aceite.** Lista de campos de uma linha, com "Adicionar critério" e "Remover". Os
  que ficam em branco não vão no corpo; com 50, o botão de adicionar trava.

## Contrato, onde é traiçoeiro

- **`PATCH` com nulos.** No tipo gerado, `title`, `description`, `card_state_id` e `archived` são
  opcionais e anuláveis. O service do card manda `null` no que não muda, que o Core trata como
  ausente. A descrição apagada vai como `""`: `null` a manteria.
- **Feature na criação.** O `POST` aceita `feature_id` (o Core valida que a feature é do projeto do
  card, com `CardFeatureInvalid`); "Sem feature" vai como `null`. Depois de criado, a feature só
  muda pelas rotas `/feature` do card, nunca pelo `PATCH`.
- **Busca na lista (`q`).** Acha pelo identificador com a chave do próprio projeto (`MOM-12`,
  sem diferenciar caixa) ou por trecho do título (sem diferenciar caixa, diferenciando acento); o
  Core apara e junta as linhas do texto, e recusa mais de 100 caracteres com 400
  `CardSearchTooLong` (`property: q`). No tipo interno é `search`, em `CardListQuery`, e não em
  `CardListFilters`: a lista da tela ainda não busca, e o filtro dela é o que vai para a URL.
- **Grupo do tipo inteiro.** O Core troca o grupo todo. O formulário de edição carrega todos os
  campos do grupo e manda todos; o prazo apagado vai como `deadline: null`, a severidade "Não
  informada", como `severity: null`.
- **Inteiros.** O contrato os declara como número desde a correção de 2026-10-13. O service do
  card ainda passa `progress`, `task_count`, `position`, `page` e `total_count` por `Number`, que
  deixou de ser necessário; os services de task e de relação já leem direto.
- **`total_pages` é opcional no contrato.** O total de páginas é calculado de `total_count` e
  `page_size`, que são obrigatórios.
- **Prazo do spike é dia sem hora** (`2026-10-20`). `formatDate` o leria como meia-noite UTC e
  mostraria o dia anterior no Brasil; para ele existe o `formatDay`.
- **Só o grupo do tipo do card vem preenchido**; os outros três vêm nulos. No tipo interno isso
  vira `fields`, uma união discriminada por `type`, e a tela escolhe o que mostrar por ela.
- **`PUT` define, `DELETE` tira.** Responsável do card, feature do card e responsável da task têm
  as duas rotas no mesmo caminho. O service recebe o valor ou `null` e o `putOrDelete` de
  `shared/api` escolhe o verbo.
- **`PATCH` do subitem leva só o que muda.** Mudar o estado manda só `state`; o formulário do
  subitem manda `title`, `description` e `expected_updated_at`. O responsável nunca vai nele, e o
  tipo, escolhido na criação, não muda.
- **A relação tem o nome do lado de quem consulta.** `relation: "blocked_by"` no card A quer dizer
  que A espera o outro. Para criar, manda-se o mesmo nome no card aberto na tela; o Core guarda
  num sentido só e devolve a cada lado o nome dele.
- **A lista de relações esconde o card de projeto que a pessoa não enxerga**: a contagem na tela
  pode ser menor que a do Core, e o limite de 100 conta as escondidas.

## Erros

- Formulários: `applyApiErrors`. As `property` do Core batem com os nomes dos campos, inclusive as
  aninhadas (`spike.question`, `issue.steps_to_reproduce` → `issue.stepsToReproduce`,
  `user_story.acceptance_criteria` → `userStory.acceptanceCriteria`), porque o formulário guarda os
  grupos com a mesma forma do contrato.
- `CardAssigneeOutsideProject` (422) quer dizer que a pessoa saiu do time depois de a lista
  carregar. No formulário de criar a escolha é desfeita e o time, recarregado; no detalhe, vira
  toast e o time é recarregado.
- `CardChangedMeanwhile` (409): no detalhe, toast pedindo para refazer, com o card já recarregado;
  no formulário de edição, nada se grava e o texto digitado continua nos campos, com um aviso e o
  botão "Carregar a versão atual", que relê o card, troca os campos pela versão relida e passa a
  usar o `updated_at` dela. Não há botão para gravar por cima (resposta 47). As mensagens são da
  tela, não a do Core, que manda "Recarregue".
- Estados: `CardStateNameAlreadyUsed` vai para o campo do nome; `CardStateInUse` e
  `CardStateLastOne` viram toast, com a mensagem do Core.
- `CardStateInvalid` (o estado foi excluído por um administrador): toast no detalhe, erro no campo
  ao criar; os estados são recarregados junto com as demais queries de card.
- `CardNotFound` (404) ao abrir o detalhe ou a edição: a tela de erro do `QueryContent`, com a
  mensagem do Core. É o que vê quem não enxerga o projeto do card.
- `CardFeatureInvalid` (422) quer dizer que a feature foi excluída depois de a lista carregar: no
  detalhe, toast; no formulário de criar, erro no campo "Feature" e a escolha é desfeita. Nos dois
  casos as features são recarregadas.
- `CardSearchTooLong` (400) não chega da busca da relação: o campo tem `maxLength` de 100
  (`CARD_LIMITS.search`). Se chegasse, seria o erro do `QueryContent` da lista de cards do
  diálogo.
- `CardTaskLimitReached` (422, 100 subitens): toast com a mensagem do Core. Só aparece se outra
  pessoa criou o centésimo no meio-tempo, porque com 100 na tela o formulário some.
- `CardTaskChangedMeanwhile` (409) no formulário do subitem: aviso com "Carregar a versão atual",
  e o texto digitado fica. `CardTaskDescriptionTooLong` (400, `property: description`) vai para o
  campo.
- `CardAssigneeOutsideProject` (422) numa task: ao criar, erro no campo, a escolha é desfeita e o
  time, recarregado; na linha, toast e o time é recarregado.
- `CardTaskNotFound` e `CardRelationNotFound` (404, outra pessoa excluiu antes): toast, e a lista
  já volta recarregada.
- `CardRelationAlreadyExists` (409) e `CardRelationLimitReached` (422) vêm sem `property`: toast
  com a mensagem do Core, e o diálogo continua aberto. O 409 também vem quando a relação já existe
  vista do outro lado ("A bloqueia B" e "B é bloqueado por A" são a mesma).
- `CardRelationTargetInvalid` (422) vem com `property: related_card_id`: erro no campo "Card". A
  lista de cards do diálogo é recarregada pela própria mutation.

## Decisões

- **Formulários em tela própria, não em modal.** Os da organização são modais; o do card tem
  descrição de até 50 mil caracteres e vários campos de texto, que não cabem num diálogo estreito,
  e o endereço próprio deixa voltar com o botão do navegador.
- **Um schema e um conjunto de valores para criar e editar.** A edição só não mostra nem manda o
  que não é dela. Os quatro grupos existem sempre no formulário, vazios; quem decide qual vai no
  corpo é `toCardTypeFields`, pelo tipo.
- **Os limites do schema também são `maxLength` nos campos** (`CARD_LIMITS`). Um campo escondido
  de outro tipo não tem como ficar inválido e travar o envio sem mostrar o erro.
- **"Arquivados" é um seletor, não uma caixa de marcar**: reaproveita o `SelectField`, e
  `shared/ui` só tem o grupo de caixas (`CheckboxGroupField`, para lista de valores), não a caixa
  avulsa.
- **Estados e time são esperados juntos** (`CardOptionsContent`) pelos filtros, pelo formulário de
  criar, pelos seletores do detalhe e pela lista de tasks. A lista e o corpo do card não esperam
  por eles.
- **O seletor de feature carrega sozinho** (`CardFeatureSelect`, usado pelo filtro e pelo
  formulário de criar), fora do `CardOptionsContent`: enquanto as features não chegam ele fica
  travado, e se a consulta falha ele mostra o erro embaixo, sem derrubar os outros filtros nem o
  formulário de criar, que segue criando sem feature.
- **Como se escolhe o outro card de uma relação** (pergunta 55, decidida em 2026-10-17). O
  diálogo tem um seletor de projeto, que começa no projeto do card e lista os projetos que a
  pessoa enxerga (`GET /api/v1/projects`), um campo de busca (`SearchField`) e um seletor de card
  com os 20 primeiros resultados da busca nesse projeto (do mais novo para o mais antigo, sem os
  arquivados e sem o próprio card). Sem texto, o seletor mostra os 20 mais novos. Com mais
  resultados que isso, um aviso pede para refinar a busca: a paginação saiu. É assim que se chega
  a um card de outro projeto da organização. Trocar de projeto mantém o texto e busca no projeto
  novo; trocar o projeto ou a busca desfaz a escolha do card.
- **A busca espera uma pausa na digitação** (300 ms, no `SearchField`), e o Enter busca na hora
  sem enviar o formulário da relação. O texto vai aparado: espaço a mais não faz outra consulta.
- **O resultado da busca continua num seletor**, e não numa lista clicável: reaproveita o
  `SelectField`, o `register` do RHF e o erro do campo "Card" (`CardRelationTargetInvalid`), sem
  componente novo de lista com escolha.
- **Tasks e relações na mesma chave de cache do card** (`cardKeys.tasks`, `cardKeys.relations`,
  sob `cardKeys.all`): mudar o estado de uma task muda o progresso do card, e concluir o card
  fecha as tasks.
- **A conta das tasks abertas sai do card lido** (`taskCount` menos `doneTaskCount`), e não da
  lista de tasks: o board não tem a lista, e as duas telas usam a mesma regra
  (`countTasksClosedBy`). Vale para qualquer estado da categoria concluído, inclusive de um
  concluído para outro, como no Core.
- **Criar task é um formulário na própria seção, renomear é um diálogo.** Tasks costumam entrar em
  sequência; um diálogo por task custaria um clique a mais em cada uma.
- **A feature do card é uma seção, não um quarto seletor nas propriedades**: precisa de espaço
  para o link da feature e para o epic, e espera consultas (features e epics) que as propriedades
  não esperam.
- **Toda mutation invalida todas as queries de card**, com sucesso ou erro, e a mutation só
  termina depois que as queries em uso voltam. É por isso que o seletor do detalhe não pisca de
  volta ao valor antigo, e que depois de uma recusa a tela mostra o que vale.
- **A rota não importa valor da feature**, só tipo: a lista de tipos válidos na URL é uma tabela
  em `card-list-search.ts`, tipada por `CardType`. A feature `card` fica num chunk que as páginas
  de card e a do board dividem, e o `marked` e o DOMPurify, num chunk que essas páginas e as de
  feature dividem, os dois fora da carga inicial.
- **Aplicar a proposta de uma entrevista muda o card sem passar pelas mutations daqui.** Quem
  recarrega o detalhe é a mutation da feature `card-interview`, que invalida o cache inteiro.
- **`ProjectContent` nasceu na feature `project`** quando a lista de cards precisou do mesmo
  "achar o projeto na lista em cache, ou dizer que não existe" que a tela do time já fazia.

## Armadilhas

- **O formulário de edição não acompanha o cache.** Ele lê o card uma vez, ao montar. Se
  acompanhasse, uma atualização em segundo plano (voltar o foco para a aba) apagaria o que a
  pessoa está escrevendo. O preço está no conhecimento `telas-de-card`, em "Limitações".
- **No 409 da edição o card é lido duas vezes**: uma pela invalidação da mutation, outra pelo hook,
  que precisa do valor novo para repor o formulário. O hook não depende de a mutation ter
  recarregado.
- **Erro do Core na lista de critérios** fica em `errors.userStory.acceptanceCriteria.message`; o
  de um critério, em `errors.userStory.acceptanceCriteria[n].text`. O `zodResolver` local põe o
  erro da lista no mesmo lugar, sem o `root` que o `@hookform/resolvers` usaria.
- **`useWatch`, não `form.watch`**, para ler o tipo escolhido: o `watch` do `useForm` faz o lint do
  React Compiler reclamar.
- **Filtro na URL com id que não existe mais** (estado excluído): o seletor mostra "Todos", mas o
  filtro continua valendo até a pessoa mexer nele.
- **Em teste com o router de verdade**, o `router` é um só por processo: troque de tela com
  `router.navigate`, não com `history.pushState` antes de um segundo `render`. O Testing Library
  desmonta a tela ao fim de cada teste: renderize o `App` em `beforeEach`, não em `beforeAll`,
  senão o `navigate` do segundo teste nunca termina.
- **O seletor de card da relação fica travado enquanto o resultado anterior ainda está na tela**
  (`isPlaceholderData`): a lista de cards guarda a página anterior ao trocar de projeto ou de
  busca, e sem a trava daria para escolher um card que não combina com o que a pessoa pediu.
- **Seletor com valor que não está nas opções** (feature excluída, mas o card em cache ainda a
  aponta): o navegador mostra a primeira opção, "Sem feature", até o card ser relido.
- **`form.reset()` depois de criar a task volta aos valores iniciais do `useForm`.** Em teste,
  `form.reset(valores)` troca esses valores iniciais; use `{ keepDefaultValues: true }`.

## Ainda não existe

- Relação com card arquivado: a busca do diálogo não os pede (pergunta 55).
- Busca na lista de cards da tela: o Core aceita `q` desde o passo 5.5, a lista não o usa.
- Reordenar tasks e mudar várias de uma vez: o Core não oferece.
- Filtro por "sem feature" e ordenação: o Core não oferece.
- Pré-visualização do markdown enquanto se escreve.
- Histórico, comentários e anexos do card: não existem no Core.
