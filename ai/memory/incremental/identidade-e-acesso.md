# Identidade e acesso

Conta, sessão, guard de rota, primeiro acesso e aceite de convite no front. O contrato da API está
em `../Momentum.Core/ai/memory/incremental/identidade.md` e `organizacao.md`; o que não pode
quebrar, nos conhecimentos `renovacao-da-sessao`, `guard-de-rota` e `token-de-link`. Aqui fica o
que o código não conta. A área da organização (membros, convites, projetos e times) está em
`configuracoes-da-organizacao.md`.

## Quem é dono de quê

| Feature | Dona de | Observação |
| --- | --- | --- |
| `account` | cadastro, confirmação e reenvio, troca de senha, entrar, sair, `GET /accounts/me` | Entrar e sair são mutations sobre `session.open` e `session.close` de `shared/api`. |
| `organization` | `GET /organizations/me` e os membros | 404 `OrganizationMembershipNotFound` vira `null`: "não tem organização" é estado, não erro. |
| `project` | `GET /projects`, a lista da página inicial (o nome de cada projeto é o link para os boards dele, entregue pela página em `renderNameLink`), `POST /projects` e os times | A criação é usada no primeiro acesso e na área da organização. |
| `invitation` | prévia e aceite, e a administração dos convites | Depois do 204 do aceite abre a sessão com `session.open`. |
| `first-access` | `POST /organizations` e a troca de passo do primeiro acesso | O passo do projeto entra pela página; ver "Decisões". |

- A sessão é o resultado de `GET /api/v1/accounts/me` no TanStack Query (`currentAccountQuery`):
  conta, `null` (sem sessão; o service traduz o 401) ou carregando. Não há store.
- `shared/api/session.ts` não conhece o cache. Ele avisa "abriu" e "encerrou", e
  `app/providers/session-cache.ts` decide: ao abrir, descarta as queries paradas e refaz as em uso;
  ao encerrar, grava `null` na conta atual e apaga o resto. O encerramento vem com o motivo
  (`signed-out` ou `expired`), e o cache guarda se a sessão expirou no meio do uso.

## Fluxos

- **Entrar.** O formulário só abre a sessão. Quem leva para a área autenticada é o guard, que vê a
  conta aparecer no cache. O mesmo vale para os dois passos do primeiro acesso: nenhuma feature
  navega.
- **Cadastro, reenvio e pedido de troca** respondem 202 sempre; a tela seguinte não diz se o
  e-mail existe. O cadastro pede só nome e e-mail (pergunta 38): a senha é escolhida na
  confirmação.
- **Confirmar e-mail** (`useEmailVerification`, passo 3.8): a prévia é uma query
  (`POST /email-verification-previews`), com `gcTime` 0, que preenche o nome com o do cadastro pelo
  `values` do React Hook Form; a pessoa pode trocá-lo (pergunta 76), e a dica do campo diz que é
  o nome informado no cadastro (pergunta 95). O envio leva token, nome e
  senha nova, com as regras de `shared/lib/field-schemas`. Na prévia ou no envio,
  `AccountLinkInvalid` (ou página aberta sem token) troca a tela pelo reenvio, e
  `AccountEmailAlreadyVerified` mostra a mensagem do Core com "Entrar" e "Trocar a senha"
  (pergunta 75); outra falha da prévia mostra "Tentar de novo".
- **Redefinir senha** usa `useLinkPassword` e `linkPasswordSchema`: token do link mais uma senha
  nova, de 10 a 128 caracteres. `AccountLinkInvalid` (ou página aberta sem token) troca a tela pelo
  link para pedir outro.
- **Aceitar convite.** A prévia é uma query (`POST /invitation-previews`), com `gcTime` 0 para o
  token não ficar no cache depois da tela. O aceite e a abertura da sessão são duas chamadas: se a
  sessão não abrir, o convite já foi aceito e a tela manda para `/entrar?aviso=convite-aceito`.
  Quem abre o convite logado com outra conta lê com que conta está e que aceitar troca a sessão
  (pergunta 39); a conta vem de `useGetCurrentAccount`, da feature `account`.
- **Primeiro acesso.** Dois passos na mesma tela, um formulário e uma chamada por passo: o nome
  da organização e, depois, o nome e a chave do primeiro projeto. Quem troca de passo é o cache:
  criar a organização invalida tudo, o guard mostra o carregando enquanto busca os projetos do
  novo administrador e a tela volta já no passo do projeto, que é o `CreateProjectForm` da feature
  `project`. Quem chega com a organização pronta e sem projeto cai direto no segundo passo.
  `OrganizationAlreadyJoined` na criação quer dizer que o cache estava atrasado: a organização é
  buscada de novo, sem aviso de erro. Criar o projeto grava, pela rota de `/primeiro-acesso`, a
  marca do primeiro board (`useFirstBoardStore`, em `app/stores/`), e o guard leva a pessoa a
  `/`, onde o diálogo "Crie o primeiro board" abre (`board.md`).
- **Avisos no login** chegam pelo parâmetro `aviso` (`email-confirmado`, `senha-redefinida`,
  `convite-aceito`, `sessao-expirada`), validado em `app/routes/sign-in-search.ts`; valor
  desconhecido é descartado. A página escolhe o texto e o tom, e entrega o aviso pronto ao
  formulário.
- **Sessão que expira no meio do uso.** Renovação recusada com uma conta no cache marca a sessão
  como expirada, e o guard leva a `/entrar?aviso=sessao-expirada`. Sair pelo botão não marca, nem
  o 401 de quem abre o site sem sessão: sem conta no cache não havia uso para interromper. Entrar
  de novo apaga a marca.

## Erros

- Login: toda recusa aparece dentro do formulário (`refusal`), não em toast. Para
  `SignInTemporarilyBlocked` a tela monta a frase com o tempo de `metadata.retryAfterSeconds`.
- Demais formulários seguem o `applyApiErrors`: com `property`, no campo; sem, toast.
- No primeiro acesso a `property` do Core (`name`) não é o nome do campo: o hook passa o mapa
  (`name` → `organizationName`). No passo do projeto os campos têm o nome da `property`.
- `AccountLinkInvalid` e `InvitationLinkInvalid` vêm com `property: "token"`, que não é campo de
  formulário nenhum. Tratados pelo código antes do `applyApiErrors`; se caírem nele, a mensagem
  some.
- `AccountEmailAlreadyVerified` (409) vem sem `property` e também é tratado pelo código antes do
  `applyApiErrors`, que o mandaria para um toast: a tela troca de estado e mostra o `details`.

## Decisões

- **Sessão em `shared/api`, não numa feature.** "Sessão" não é termo do glossário, e tanto o login
  quanto o aceite do convite precisam abrir uma. Numa feature, uma teria de importar a ação da
  outra, o que a regra "leitura cruza, ação não" proíbe.
- **`first-access` é uma feature de fluxo**: cria a organização, lê `useGetCurrentOrganization`
  da feature `organization` para saber em que passo está e mostra, no segundo, o que a página
  entregar como `projectStep`. Até o passo 3.4 ela também criava o projeto, num envio só; a
  criação foi para a feature `project` quando ganhou a segunda tela, e uma feature não importa a
  ação da outra (`configuracoes-da-organizacao.md`, "Decisões").
- **Regras de campo em `shared/lib/field-schemas.ts`**, espelhando `src/Common/Helpers` do Core
  (`PersonNameHelper`, `PasswordPolicyHelper`, `EmailAddressHelper`): conta e convite usam as
  mesmas.
- **Formulário sai pela public API da feature** (`SignInForm`, `FirstAccessForm`…): a página não
  tem outro jeito de compor, porque o ESLint barra o deep import. Mutation, hook de orquestração e
  schema continuam internos. É o que o canon do Agache.Web faz.
- **Feature não conhece URL.** Link e navegação entram pela página, como `footer`, `newLinkAction`,
  `alreadyVerifiedActions` e callbacks (`onVerified`, `onReset`, `onAccepted`).
- **O primeiro board do primeiro acesso passa pelo `app`** (pergunta 82). Página e feature não
  importam de `app/`: a rota de `/primeiro-acesso` liga o `onProjectCreated` da página ao
  `markPending` do store, e a de `/` passa à página inicial o projeto marcado e o `clearPending`.
  A feature `first-access` continua sem saber do board, e nenhuma delas navega.

## Armadilhas

- **O guard desmonta a tela do primeiro acesso entre os dois passos.** Com a organização no
  cache ele vê um administrador com projetos ainda por carregar e mostra o carregando. Não se
  perde nada, porque o formulário da organização já terminou; mas estado local guardado na
  `FirstAccessForm` não atravessa os passos.
- **A prévia do convite é refeita quando a sessão abre** e, com o link já gasto, responde
  `InvitationLinkInvalid`. A tela decide pelo dado que já tem antes de olhar o erro; inverter a
  ordem mostra "Convite inválido" por um instante depois do aceite.
- **Estado tirado da mutation chega um tique depois.** `sentTo`, `isLinkInvalid` e `view` vêm de
  `mutation.isSuccess` e `mutation.error`, e o TanStack avisa o React num `setTimeout(0)`. Em
  teste, espere com `waitFor`, não leia logo depois do `act`.
- **Teste que renderiza o roteador** (`app/routes/home.routes.test.tsx`, o único): o
  `router.navigate` antes de o `RouterProvider` montar não termina, porque quem escuta o histórico
  é o `Transitioner` montado; volte ao início com `router.history.replace("/")`. As páginas chegam
  por `import()`, e com o cache do Vitest frio a primeira passa de 1 s: a espera por elas tem
  prazo próprio. O roteador chama `window.scrollTo`, que o jsdom não tem e o `src/test/setup.ts`
  simula, e o mock do client precisa do `session`, que o "Sair" do layout lê ao renderizar.
- **Recarregar a página de um link perde o token**, porque ele já saiu da barra de endereço: a
  pessoa precisa abrir o link do e-mail de novo.
- **Visitante sem sessão custa duas chamadas** ao abrir `/entrar`: `GET /accounts/me` (401) e a
  tentativa de renovação (401). É o preço de não saber, sem perguntar, se há cookie.
- **O `index.ts` de `account` é importado pelo `app`** (guard, layout, cache da sessão), e só o
  que o `app` usa dele vai para a carga inicial: os formulários, com Zod e React Hook Form, chegam
  com as páginas de conta. Vale também para `organization` e `project`, e depende do `sideEffects`
  do `package.json` (conhecimento `carga-inicial`).

## Ainda não existe

- Renovar a sessão antes de expirar, usando `access_expires_at`: hoje só há a renovação depois do
  401.
- Voltar, depois do login, para a rota que a pessoa tentou abrir, inclusive depois de a sessão
  expirar.
- Distinguir "a sessão expirou" de "você foi removido da organização": as duas chegam como
  renovação recusada e mostram o mesmo aviso.
