# Configurações da organização

A área `/organizacao`: membros, convites, projetos e o time de cada projeto. O contrato da API está
em `../Momentum.Core/ai/memory/incremental/organizacao.md`; o que não pode quebrar, no conhecimento
`administracao-da-organizacao`. Aqui fica o que o código não conta.

## Quem é dono de quê

| Feature | Dona de | Lê de outra feature |
| --- | --- | --- |
| `organization` | lista de membros, mudança de papel, quem pode usar a IA e remoção | a conta atual, para não oferecer "Remover" na própria linha |
| `invitation` | convites pendentes, convidar, reenviar e cancelar | os projetos e os rótulos de papel |
| `project` | criar projeto, lista da aba Projetos, time (listar, incluir, mudar papel, tirar) | a organização atual e os membros dela; o passo depois de criar o projeto entra pela página |

- A direção das dependências é `invitation → project → organization → account`. Nenhuma volta.
- Nome, e-mail e a marca "(você)" de uma pessoa, na lista de membros e no time, são o
  `AccountIdentity` da feature `account`: UI de leitura, que as duas listas importam.
- Abas e título ficam em `app/layouts/organization-settings-layout.tsx`. Quem diz se a aba
  Convites aparece é a rota (`OrganizationSettingsArea`, em `app/routes`), porque só o `app`
  conhece URL e lê a sessão; a feature não sabe que existem abas.

## Quem vê o quê

- Todo membro abre Membros e Projetos. O membro vê só os projetos em que está no time, e o time
  deles, sem ação nenhuma.
- Administrador da organização: muda papel, marca quem pode usar a IA, remove membro, convida,
  cria projeto e cuida de todo time. A aba Convites e a rota `/organizacao/convites` são só dele:
  o guard leva o membro a `/`.
- Quem tem a permissão de IA, que libera a entrevista e o briefing do card, aparece para todos na
  lista de membros: o administrador vê a caixa "Pode usar a IA" em cada linha, e o membro, só o
  texto na linha de quem pode.
- Administrador do projeto que é membro da organização: cuida só do time dos projetos dele. O que
  vale é o papel efetivo, o `role` de `GET /api/v1/projects`; a tela não recalcula.
- Esconder não protege. O Core responde 403 (`AccessDenied`, `ProjectAdministrationDenied`) de
  qualquer forma, e a tela mostra a mensagem dele.

## Fluxos

- **Papel na linha.** O seletor dispara a mudança ao escolher, sem botão de salvar. Enquanto a
  chamada corre, a linha mostra o papel pedido e todos os seletores ficam travados; se o Core
  recusa, a lista é recarregada e o seletor volta ao que vale.
- **"Pode usar a IA" na linha.** A caixa dispara a mudança ao marcar ou desmarcar, como o
  papel: enquanto a chamada corre, a linha mostra a marcação pedida e a caixa e o seletor de todas
  as linhas ficam travados; se o Core recusa, a lista é recarregada e a caixa volta ao que vale.
  O corpo leva só `ai_enabled` (até o passo 8.5, `interview_enabled`); o papel não vai junto. A
  permissão vale em todos os projetos, e o administrador pode marcar a si mesmo.
- **Ação destrutiva** (remover membro, cancelar convite, tirar do time) passa pelo `ConfirmButton`:
  a pergunta diz a consequência, e a chamada só sai no segundo clique.
- **Novo projeto.** O diálogo cria o projeto e, ao fechar, abre o passo seguinte que a página
  entrega em `renderNextStep`: o "Crie o primeiro board" da feature `board`, com o nome "Todos os
  cards" e o filtro vazio (`board.md`). Pular ou fechar deixa o projeto sem board, e o passo não
  volta para aquele projeto.
- **Convidar.** Um seletor por projeto, começando em "Fora do time"; só os projetos com papel
  escolhido vão no corpo. Convite sem projeto é válido.
- **Reenviar** responde 202 mesmo quando o Core não envia (menos de 1 minuto do envio anterior). A
  tela não tem como saber qual dos dois aconteceu, e por isso o aviso diz "Reenvio pedido" e
  explica o intervalo, em vez de "Convite reenviado".
- **Convite vencido** continua na lista como pendente (o Core não o limpa): a linha diz "Expirou
  em", e reenviar dá a ele mais 7 dias.
- **Time.** O projeto vem da lista de projetos já em cache, não de `GET /projects/{id}`: se ele
  não está na lista, a pessoa não o enxerga, e a tela diz "Projeto não encontrado". Quem faz isso
  é o `ProjectContent`, que as telas de card também usam (`cards.md`). Quem pode ser incluído são
  os membros da organização que ainda não estão no time.
- **Estados.** A lista de projetos mostra "Time" a todos e "Estados" só a quem administra o
  projeto; a tela dos estados é da feature `card` (`cards.md`), e a página só a encaixa no
  `ProjectContent`. Quem abre o endereço sem administrar o projeto vê o fluxo, sem as ações.
- **Nome do projeto.** Na lista de projetos, como na página inicial, o nome do projeto é o link
  para os boards dele. A feature `project` não conhece URL: o link entra pela página, em
  `renderNameLink` (`OrganizationProjectList` e `ProjectList`), ao lado de `renderActions`.

## Erros

- Ação fora de formulário (papel, remover, reenviar, cancelar) mostra a mensagem do Core em toast,
  pelo `toastApiError`. É o caso de `OrganizationLastAdministrator`,
  `InvitationResendLimitReached`, `ProjectMemberNotFound` e `ProjectAdministrationDenied`.
- Convite: `InvitationEmailInvalid`, `InvitationEmailAlreadyMember`,
  `InvitationEmailInAnotherOrganization` e `InvitationAlreadyPending` vêm com `property: "email"`
  e aparecem no campo. `InvitationProjectInvalid` e `InvitationProjectNotFound` vêm com
  `property: "projects"`, que não é campo: vão para `root.projects` e aparecem abaixo da lista de
  projetos. `InvitationDailyLimitReached` e o 429 do Kong não têm `property` e viram toast.
- Criar projeto: os quatro erros vêm com `property` (`name` ou `key`), que são os nomes dos campos.
  O `POST` devolve o projeto criado (201), que `createProject` adapta e entrega ao passo seguinte.
- `ProjectMemberOutsideOrganization` ao incluir no time quer dizer que a pessoa saiu da
  organização depois de a lista carregar: a escolha é desfeita e os membros são recarregados.

## Decisões

- **A criação de projeto é da feature `project`.** Ela nasceu em `first-access`, que fazia os dois
  `POST` num envio só. Com a segunda tela, havia três saídas: duplicar a chamada, o schema e os
  campos; `first-access` importar a mutation de `project`, que a regra "leitura cruza, ação não"
  proíbe; ou o dono do projeto exportar o formulário e a página compor. Ficou a terceira:
  `CreateProjectForm` é usado pelo modal "Novo projeto" e pela página do primeiro acesso, que o
  entrega à `FirstAccessForm` como `projectStep`. O custo é o primeiro acesso em dois passos (ver
  `identidade-e-acesso.md`).
- **O primeiro board entra por `renderNextStep`**, como o passo do projeto entra no primeiro
  acesso: a feature `board` importa de `project`, e não o contrário. A lista de projetos guarda o
  projeto recém-criado num estado próprio e o esquece quando o passo termina.
- **Não virou widget.** Feature não importa de `widgets/`, e um widget não tem `api/` nem schema: o
  formulário teria de continuar na feature de qualquer jeito. É o mesmo caso de `SignOutButton`,
  usado pelo layout e por uma página sem sair da feature `account`.
- **Papel se compara num lugar por domínio**: `isOrganizationAdministrator`, que saiu de
  `app/routes/access-decision.ts` para a feature `organization` porque a tela passou a precisar
  dele, e `canAdministerProject`, na feature `project`. O guard usa o primeiro.
- **A própria conta não tem "Remover".** Sair da organização por conta própria ainda não existe
  no produto (memória do Core), e a remoção encerra as sessões de quem sai. Mudar o próprio papel
  é permitido, depois do `ConfirmDialog` que só a própria linha abre (perguntas 42 e 87): é
  onde o `OrganizationLastAdministrator` aparece. O seletor continua no papel atual até a
  confirmação.
- **Sair do time de um projeto** usa o mesmo "Tirar do time" das outras linhas, com o título "Sair
  do time do projeto?" na própria linha; o aviso, em todas, diz que os cards da pessoa ficam sem
  responsável (pergunta 45).
- **Mudança de membro invalida o cache inteiro.** Papel, permissão de IA e remoção
  mudam o que as outras features mostram (papel efetivo nos projetos, times, a aba de convites, o
  "Iniciar entrevista" e o "Gerar briefing" do card), e `organization` não conhece as chaves delas. Projeto e convite
  invalidam só as próprias chaves.
- **Desmarcar "Pode usar a IA" não pede confirmação**: se desfaz na mesma linha. Quem perde a
  permissão no meio de uma entrevista deixa de poder seguir e só a encerra
  (`entrevista-do-card.md`), e deixa de ver "Gerar briefing" (`briefing-do-card.md`).
- **Formulários em modal**, não em tela própria: a lista continua visível atrás, e o modal fechado
  desmonta o formulário, que nasce limpo na próxima vez.

## Armadilhas

- **`projectRoles` é um registro indexado pelo id do projeto**, não uma lista: se a lista de
  projetos mudar com o modal aberto, índice de lista apontaria o papel para o projeto errado. O
  preço é o tipo dos erros do RHF, que trata toda chave do registro como campo; por isso o erro
  geral dos projetos mora em `root.projects`.
- **A lista de convites precisa dos projetos** para escrever os nomes. As duas consultas são
  esperadas juntas; sem isso, um convite com projeto apareceria como "Sem projeto" até a segunda
  chegar.
- **"Expirou" é calculado contra a hora em que a lista foi carregada** (`dataUpdatedAt`), não
  contra o relógio na hora de desenhar: a tela não muda sozinha enquanto está aberta.
- **Convite gravado com erro na resposta.** Se o e-mail não entra na fila, o Core grava o convite
  e responde erro. A lista é recarregada também no erro, para o convite aparecer e poder ser
  reenviado.
- **Duas navegações têm "Projetos"**: o menu do topo (a página inicial) e a aba da organização (a
  administração). Em teste, procure o link dentro da navegação certa.
- **Das features `organization` e `project`, só o que o guard e o layout usam vai para a carga
  inicial**; as listas, os formulários e o `Modal` do Radix chegam com as páginas (conhecimento
  `carga-inicial`).

## Ainda não existe

- Renomear organização e projeto, apagar projeto e sair da organização por conta própria: o Core
  não tem as rotas.
- Paginação ou busca nas listas: o Core devolve a lista inteira.
- Convites aceitos, cancelados ou recusados: a API só lista os pendentes.
