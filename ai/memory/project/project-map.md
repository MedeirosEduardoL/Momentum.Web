# Project map — Momentum.Web

Retrato consolidado do que o front é e faz. Atualize só por edição deliberada, quando uma entrega
mudar o produto. O plano do que ainda vai existir mora no roadmap do Core
(`../Momentum.Core/ai/roadmap.md`).

## O que é

Frontend React 19 + TypeScript + Vite do Momentum, gerenciador de trabalho no estilo do Azure
DevOps. Consome a API do Momentum.Core pelo `openapi.json` gerado lá. Arquitetura FSD pragmática,
herdada do Agache.Web.

**Hoje (2026-10-13):** Fases 2 e 3 entregues, e as telas das Fases 4, 5, 6 e 7 (passos 4.4, 5.4,
6.2 e 7.4) — fundações, identidade e acesso, configurações da organização, cards, a hierarquia de
epic, feature e task, o board e a entrevista do card com a IA. A pessoa cria a conta, confirma o e-mail, entra, troca a senha, cria a organização
e o primeiro projeto ou aceita um convite, e vê na página inicial os projetos de que participa. De
cada projeto ela abre a lista de cards, com filtro por tipo, estado, responsável, feature e
arquivados; cria um card de qualquer tipo, com os campos dele; e, no card, muda estado, prioridade
e responsável, edita, arquiva e desarquiva, põe o card numa feature, cuida das tasks dele e o
relaciona com outros cards da organização. No card, o time lê as entrevistas com a IA; quem tem a
permissão de IA inicia uma, pede as rodadas de perguntas, que chegam em stream, responde,
pede a proposta de mudança no card e aplica as mudanças que escolher, e gera o briefing do card,
que todo o time lê, copia e baixa. De cada projeto ela também abre a hierarquia, com os
epics, as features de cada um e as features sem epic, e cria, renomeia, descreve e exclui feature
e epic. De cada projeto ela abre ainda os boards: escolhe um, vê os cards que o filtro dele pega
em colunas por estado, cria um card no topo da primeira coluna, move um card arrastando ou pelo
seletor do cartão, filtra por responsável
ou pelos cards sem responsável, agrupa em raias por responsável, uma para cada pessoa do time, e
troca o responsável soltando o card na raia de outra pessoa, mesmo de quem ainda não tem card;
concluir um card com task aberta pede confirmação, no board e no card; o administrador do
projeto cria, renomeia, troca o filtro e exclui boards, e quem cria um projeto, no primeiro
acesso ou na área da organização, é guiado a criar o primeiro board dele.

**Beta (2026-10-22, Fase 11):** o board é a tela principal, primeiro na navegação. O card abre
numa modal com X sobre o board e a lista (`?card=`), com as guias Detalhes, Relações, Anexos,
Entrevista com IA e Briefing, e "Abrir em página inteira"; o menu de três pontos do cartão
adiciona task, bug ou impedimento; features e epics também aparecem em board, ao lado da
hierarquia; card, subitem, feature e epic recebem anexos; e o administrador do projeto escolhe
quem vê cada board. A paleta passou ao coral do Megabrain. Na área da organização, todo membro vê os membros, os projetos em que está e o
time deles; o administrador da organização muda papéis, marca quem pode usar a IA, remove
membros, convida, cria projetos e cuida dos times, e o administrador do projeto cuida do time
dele.

## Telas

| Rota | Página | Feature | Consome |
| --- | --- | --- | --- |
| `/entrar` | `SignInPage` (`pages/account/sign-in`) | `account` | `POST /api/v1/sessions`; aceita `?aviso=` com o aviso vindo de outra tela. |
| `/cadastrar` | `SignUpPage` (`pages/account/sign-up`) | `account` | `POST /api/v1/accounts` |
| `/confirmar-email#token=…` | `EmailVerificationPage` (`pages/account/email-verification`) | `account` | `POST /api/v1/email-verification-previews` (nome do cadastro) e `POST /api/v1/email-verifications`; link inválido: `POST /api/v1/email-verification-requests` |
| `/esqueci-a-senha` | `PasswordResetRequestPage` (`pages/account/password-reset-request`) | `account` | `POST /api/v1/password-reset-requests` |
| `/redefinir-senha#token=…` | `PasswordResetPage` (`pages/account/password-reset`) | `account` | `POST /api/v1/password-resets` |
| `/aceitar-convite#token=…` | `InvitationAcceptancePage` (`pages/invitation/acceptance`) | `invitation` | `POST /api/v1/invitation-previews`, `POST /api/v1/invitation-acceptances` e, em seguida, `POST /api/v1/sessions` |
| `/primeiro-acesso` | `FirstAccessPage` (`pages/organization/first-access`) | `first-access`, `project`, `account` | Dois passos: `POST /api/v1/organizations` e, depois, `POST /api/v1/projects` |
| `/` | `ProjectListPage` (`pages/home/project-list`) | `project`, `board` | `GET /api/v1/projects`; cada projeto leva aos boards (pelo nome e pelo link "Boards"), à hierarquia e à lista de cards dele. No fim do primeiro acesso, o diálogo do primeiro board: `GET /api/v1/projects/{projectId}/members`, `GET /api/v1/features?project_id=`, `GET /api/v1/epics?project_id=` e `POST /api/v1/boards`. |
| `/projetos/$projectId/cards` | `CardListPage` (`pages/card/list`) | `card`, `project`, `feature`; o card aberto pelo `OpenedCardDialog` (`widgets/`), com `?card=` e as mesmas chamadas de `/cards/$cardId` | `GET /api/v1/cards?project_id=`, com `card_type`, `card_state_id`, `assignee_id` ou `unassigned`, `feature_id`, `archived`, `page` e `page_size` vindos de `?tipo=`, `?estado=`, `?responsavel=` (`nenhum` para sem responsável), `?feature=`, `?arquivados=` e `?pagina=`; `GET /api/v1/projects`, `GET /api/v1/card-states?project_id=`, `GET /api/v1/projects/{projectId}/members` e `GET /api/v1/features?project_id=` para o título e os filtros. |
| `/projetos/$projectId/cards/novo` | `NewCardPage` (`pages/card/new`) | `card`, `project` | `POST /api/v1/cards`; `GET /api/v1/projects`, `GET /api/v1/card-states?project_id=` e `GET /api/v1/projects/{projectId}/members` para as opções. |
| `/cards/$cardId` | `CardDetailPage` (`pages/card/detail`) | `card`, `card-interview`, `card-brief`, `attachment`, `project`, `feature` | Em guias, as mesmas da modal. Anexos: `GET` e `POST /api/v1/attachments` (`card_id`, e `card_task_id` no subitem aberto), `GET /api/v1/attachments/{attachmentId}/content` e `DELETE /api/v1/attachments/{attachmentId}`. `GET /api/v1/cards/{cardId}`; `PATCH /api/v1/cards/{cardId}` (estado, prioridade, arquivar e desarquivar); `PUT` e `DELETE /api/v1/cards/{cardId}/assignee`; os estados e o time do projeto do card para os seletores. Feature: `PUT` e `DELETE /api/v1/cards/{cardId}/feature`, com `GET /api/v1/features?project_id=` e `GET /api/v1/epics?project_id=`. Tasks: `GET` e `POST /api/v1/cards/{cardId}/tasks`, `PATCH` e `DELETE /api/v1/card-tasks/{cardTaskId}`, `PUT` e `DELETE /api/v1/card-tasks/{cardTaskId}/assignee`. Relações: `GET` e `POST /api/v1/cards/{cardId}/relations`, `DELETE /api/v1/card-relations/{cardRelationId}`, com `GET /api/v1/projects` e `GET /api/v1/cards?project_id=` para escolher o outro card. Entrevista: `GET` e `POST /api/v1/card-interviews`, `GET` e `PATCH /api/v1/card-interviews/{cardInterviewId}`, `POST /api/v1/card-interviews/{cardInterviewId}/rounds` (lido em stream), `GET` e `POST /api/v1/card-interviews/{cardInterviewId}/proposals` e `PATCH /api/v1/card-interview-proposals/{cardInterviewProposalId}`, com `GET /api/v1/accounts/me`, `GET /api/v1/organizations/me` e `GET /api/v1/projects` para saber quem inicia, conduz e encerra. Briefing: `GET /api/v1/card-briefs/{cardId}` e `POST /api/v1/card-briefs`, com `GET /api/v1/organizations/me` para saber quem gera. |
| `/cards/$cardId/editar` | `CardEditPage` (`pages/card/edit`) | `card` | `GET` e `PATCH /api/v1/cards/{cardId}` (título, descrição e o grupo de campos do tipo, com `expected_updated_at`). |
| `/projetos/$projectId/features` | `ProjectHierarchyPage` (`pages/feature/hierarchy`) | `feature`, `project` | Guias pelo `?visao=`: board de features (padrão), board de epics (`epics`) e hierarquia (`hierarquia`). `GET /api/v1/projects`, `GET /api/v1/epics?project_id=` e `GET /api/v1/features?project_id=`; `POST /api/v1/epics`, `POST /api/v1/features`, `DELETE /api/v1/epics/{epicId}` e `DELETE /api/v1/features/{featureId}`. |
| `/features/$featureId` | `FeatureDetailPage` (`pages/feature/feature-detail`) | `feature`, `attachment` (anexos com `feature_id`) | `GET` e `PATCH /api/v1/features/{featureId}`; `PUT` e `DELETE /api/v1/features/{featureId}/epic`; `GET /api/v1/epics?project_id=` para o seletor de epic. |
| `/epics/$epicId` | `EpicDetailPage` (`pages/feature/epic-detail`) | `feature`, `attachment` (anexos com `epic_id`) | `GET` e `PATCH /api/v1/epics/{epicId}`; `GET /api/v1/features?project_id=` para as features do epic; `POST /api/v1/features` e `DELETE /api/v1/features/{featureId}`. |
| `/projetos/$projectId/boards` | `ProjectBoardPage` (`pages/board/project-board`) | `board`, `card`, `project`, `feature` | `GET /api/v1/projects` e `GET /api/v1/boards?project_id=`; `GET /api/v1/boards/{boardId}/columns`, com `assignee_id` vindo de `?responsavel=<id>` ou `unassigned=true` vindo de `?responsavel=nenhum`; o board vem de `?board=` e o agrupamento em raias, de `?agrupar=responsavel`; `GET /api/v1/projects/{projectId}/members` para o seletor de responsável e as raias. Mover o card: `PATCH /api/v1/cards/{cardId}` com `card_state_id` e, entre raias, `PUT` ou `DELETE /api/v1/cards/{cardId}/assignee`. Card novo na primeira coluna: `POST /api/v1/cards`, e a releitura das colunas. Para o administrador do projeto: `POST /api/v1/boards`, `PATCH` e `DELETE /api/v1/boards/{boardId}`, com `GET /api/v1/features?project_id=` e `GET /api/v1/epics?project_id=` para os critérios do filtro; o acesso ao board, com `PATCH /api/v1/boards/{boardId}` (`visibility`), `GET /api/v1/boards/{boardId}/members` e `PUT` e `DELETE /api/v1/boards/{boardId}/members/{userId}`. O card aberto vem de `?card=`, pelo `OpenedCardDialog`, com as chamadas de `/cards/$cardId`. |
| `/organizacao` | — | — | Leva a `/organizacao/membros`. |
| `/organizacao/membros` | `OrganizationMembersPage` (`pages/organization/members`) | `organization` | `GET /api/v1/organizations/me/members`; para o administrador da organização, `PATCH /api/v1/organizations/me/members/{userId}` (o papel, ou quem pode usar a IA) e `DELETE` na mesma rota |
| `/organizacao/convites` | `OrganizationInvitationsPage` (`pages/organization/invitations`) | `invitation` | `GET` e `POST /api/v1/invitations`, `POST /api/v1/invitations/{invitationId}/deliveries`, `DELETE /api/v1/invitations/{invitationId}` e `GET /api/v1/projects` |
| `/organizacao/projetos` | `OrganizationProjectsPage` (`pages/organization/projects`) | `project`, `board` | `GET /api/v1/projects`, com o nome de cada projeto levando aos boards dele; para o administrador da organização, `POST /api/v1/projects` e, no passo do primeiro board, `GET /api/v1/projects/{projectId}/members`, `GET /api/v1/features?project_id=`, `GET /api/v1/epics?project_id=` e `POST /api/v1/boards` |
| `/organizacao/projetos/$projectId/time` | `ProjectTeamPage` (`pages/organization/project-team`) | `project` | `GET /api/v1/projects`, `GET /api/v1/projects/{projectId}/members`; para o administrador do projeto, `PUT` e `DELETE /api/v1/projects/{projectId}/members/{userId}` e `GET /api/v1/organizations/me/members` |
| `/organizacao/projetos/$projectId/estados` | `ProjectStatesPage` (`pages/organization/project-states`) | `card`, `project` | `GET /api/v1/projects`, `GET /api/v1/card-states?project_id=`; para o administrador do projeto, `POST /api/v1/card-states`, `PATCH` e `DELETE /api/v1/card-states/{cardStateId}` |
| qualquer rota desconhecida | `NotFoundPage` (`pages/system/not-found`) | — | Nada; `notFoundComponent` da rota raiz. |
| erro em qualquer rota | `RouteErrorPage` (`pages/system/route-error`) | — | Nada; `errorComponent` da rota raiz, com "Tentar de novo" (`router.invalidate()`). |

Os caminhos das telas com token são fixos: os e-mails do Core apontam para eles.

## Áreas e acesso

As rotas ficam sob quatro rotas sem caminho de `app/routes/index.tsx`, e o guard decide por área.
A área `organization-administrator` não tem rota própria: é um segundo guard, dentro de `member`,
em volta da página de convites.

| Área | Rotas | Layout | Quem entra |
| --- | --- | --- | --- |
| `guest` | `/entrar`, `/cadastrar` | `AccessLayout` | Só quem não tem sessão; logado vai para `/`. |
| `public` | `/confirmar-email`, `/esqueci-a-senha`, `/redefinir-senha`, `/aceitar-convite` | `AccessLayout` | Qualquer pessoa, com ou sem sessão; não consulta a sessão. |
| `first-access` | `/primeiro-acesso` | `AccessLayout` | Logado sem organização, ou administrador da organização sem projeto. |
| `member` | `/`, `/projetos/$projectId/cards`, `/projetos/$projectId/cards/novo`, `/cards/$cardId`, `/cards/$cardId/editar`, `/projetos/$projectId/features`, `/features/$featureId`, `/epics/$epicId`, `/projetos/$projectId/boards`, `/organizacao/membros`, `/organizacao/projetos`, `/organizacao/projetos/$projectId/time`, `/organizacao/projetos/$projectId/estados` | `AppLayout` (barra superior com o caminho organização › projeto, o tema, a pessoa e "Sair"; navegação lateral com Projetos, os hubs do projeto atual, Configurações do projeto e Organização); nas rotas de `/organizacao`, também o `OrganizationSettingsLayout` (título e abas) | Logado, com organização e, se administrador, com projeto. O projeto, o card, a feature e o epic que a pessoa não enxerga aparecem como não encontrados. |
| `organization-administrator` | `/organizacao/convites` | os mesmos de `member` | Quem entra em `member` e é administrador da organização; o membro vai para `/`. |

Em toda área com guard, as consultas são `GET /api/v1/accounts/me`, `GET /api/v1/organizations/me`
e, para o administrador da organização, `GET /api/v1/projects`. Quem tem a sessão recusada na
renovação, no meio do uso, chega a `/entrar?aviso=sessao-expirada`.

## Telas planejadas

Do roadmap do produto, para orientar nomes e rotas; cada uma entra em "Telas" quando existir.

| Fase | Tela |
| --- | --- |
| 9 | Chamados do Movidesk de cada pessoa como cards |
| 10 | Configuração e resultado da análise de código |

## Integração com o Core

- Contrato: `../Momentum.Core/openapi.json`; tipos gerados em
  `src/shared/api/generated/openapi.d.ts` por `npm run api:types`.
- Chamadas a `/api/...` com o `baseURL` de `VITE_API_BASE_URL`: vazio no local, onde o proxy do
  Vite repassa ao Kong em `127.0.0.1:8010`; `https://gateway.infinitemonkey.com.br` no Cloudflare
  Pages.
- JSON snake_case na API, camelCase dentro do front, adaptado no service da feature.
- Erro em `application/problem+json`, convertido em `ApiError` pelo client e tratado pelo `code`.
- Sessão: cookie httpOnly lido pelo Kong (ADR 0003 do Core); o client manda as credenciais e o
  `X-Requested-With`, renova a sessão no 401 e repete a requisição. "Quem sou eu" é
  `GET /api/v1/accounts/me`, guardado no TanStack Query; não há store de sessão. Os stores de
  cliente (Zustand, em `app/stores/`) são a marca do primeiro board do primeiro acesso, o último
  projeto aberto e as preferências de aparência (tema e navegação recolhida), as únicas
  persistidas, no `localStorage`.
- Uma chamada sai do Axios: a rodada da entrevista, um `POST` cuja resposta `text/event-stream` é
  lida com `fetch` por `postEventStream`, de `shared/api`, com a mesma sessão.
- Detalhes e armadilhas: `ai/memory/incremental/integracao-com-o-core.md`,
  `ai/memory/incremental/identidade-e-acesso.md`, `ai/memory/incremental/cards.md`,
  `ai/memory/incremental/features-e-epics.md`, `ai/memory/incremental/board.md` e
  `ai/memory/incremental/entrevista-do-card.md`.
