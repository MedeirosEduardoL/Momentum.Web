---
id: guard-de-rota
titulo: O guard decide o acesso por área, num lugar só, e é ele quem leva a pessoa de uma área a outra
status: ativo
criado: 2026-10-12
atualizado: 2026-10-19
touches:
  - src/app/routes/guards.tsx
  - src/app/routes/access-decision.ts
  - src/app/routes/index.tsx
  - src/app/routes/organization.routes.tsx
  - src/app/routes/card.routes.tsx
  - src/app/routes/feature.routes.tsx
  - src/app/routes/board.routes.tsx
simbolos:
  - RouteGuard
  - decideAccess
  - SessionSnapshot
  - RouteArea
  - AccessLayout
  - AppLayout
  - OrganizationMembershipNotFound
  - organization-administrator
  - session-expired
  - isOrganizationAdministrator
relacionados: [renovacao-da-sessao, administracao-da-organizacao]
---

## PARA_QUE_SERVE

- Diz, para cada área de rotas, se a pessoa vê o conteúdo, espera, ou é levada a outro lugar.
- Garante que ninguém chegue à área autenticada sem conta, sem organização ou, sendo administrador
  da organização, sem o primeiro projeto.
- Garante que a tela só do administrador da organização não seja mostrada ao membro.
- Leva ao login, com o aviso, quem teve a sessão expirada no meio do uso.

## POR_QUE_EXISTE

- Contrato do Core (`../Momentum.Core/ai/memory/incremental/organizacao.md`, "Primeiro acesso"):
  `GET /api/v1/organizations/me` com 404 `OrganizationMembershipNotFound` leva à tela que cria a
  organização, e `GET /api/v1/projects` vazio para o administrador da organização leva à mesma
  tela, só com o projeto; vazio para um membro é só quem ainda não está em nenhum time.
- A decisão é uma função pura (`decideAccess`), separada do componente, para ser testada sem
  router e para a política não se espalhar pelas páginas.
- O guard é componente com `<Navigate replace>`, e não `beforeLoad` do router, porque a sessão vive
  no TanStack Query e muda sozinha (login, logout, sessão recusada na renovação): o componente
  reage à mudança sem ninguém navegar.
- Por isso o login e o primeiro acesso não navegam ao terminar: a feature muda o cache e o guard
  leva. Se a feature também navegasse, haveria duas fontes de navegação para o mesmo destino.
- O diálogo do primeiro board no fim do primeiro acesso (pergunta 82) não mudou o INV-6: criar o
  projeto continua só mudando o cache, e o guard leva a pessoa a `/`. A rota de
  `/primeiro-acesso` grava uma marca em memória (`useFirstBoardStore`, de `app/stores/`) e o
  diálogo abre em `/`. A alternativa, um terceiro passo em `/primeiro-acesso`, pediria ao guard
  que segurasse ali quem já tem projeto.
- Pelo mesmo motivo o aviso de sessão expirada vai no redirecionamento do guard, que lê do cache
  se a sessão expirou. A alternativa, o cache da sessão navegar por conta própria ao expirar,
  disputaria a navegação com o guard, que reage à mesma mudança.
- A rota só do administrador da organização é um segundo `RouteGuard`, dentro da área `member`,
  com a mesma função de decisão: a política continua num lugar só, e o membro que abre o endereço
  vai para `/` em vez de ver uma tela cujas chamadas o Core recusaria com 403.

## INVARIANTES

- INV-1: Toda rota da área `member` e da área `first-access` fica sob um `RouteGuard`; rota nova
  que exige sessão nasce dentro de uma dessas áreas.
- INV-2: Sem sessão, as áreas `member`, `first-access` e `organization-administrator` levam a
  `/entrar`.
- INV-3: Com sessão, a área `guest` (`/entrar`, `/cadastrar`) leva a `/`.
- INV-4: Com sessão e sem organização, a área `member` leva a `/primeiro-acesso`.
- INV-5: O administrador da organização sem nenhum projeto é levado a `/primeiro-acesso`; o membro
  sem nenhum projeto fica na área `member`.
- INV-6: Quem já tem organização e, sendo administrador, já tem projeto, é levado de
  `/primeiro-acesso` para `/`.
- INV-7: Nada é decidido enquanto a conta, a organização ou os projetos do administrador ainda
  carregam; se a consulta que falta falhou, a tela mostra o erro com "Tentar de novo" em vez de
  redirecionar.
- INV-8: Todo redirecionamento do guard usa `replace`.
- ~~INV-9~~ (removido em 2026-10-12: a comparação de papel saiu de `access-decision.ts` para
  `isOrganizationAdministrator`, da feature `organization`, quando a tela passou a precisar dela;
  substituído pelo INV-13).
- INV-10: As rotas da área `public` não consultam a sessão: o link de e-mail funciona com ou sem
  ela.
- INV-11: Quando a sessão expirou no meio do uso (`hasExpired`), o redirecionamento do INV-2 leva
  a `/entrar?aviso=sessao-expirada`; a área `guest` mostra o conteúdo e não redireciona de novo.
- INV-12: A área `organization-administrator` só mostra o conteúdo a quem entraria na área
  `member` e é administrador da organização; o membro é levado a `/`. Toda rota que só o
  administrador da organização pode abrir fica sob um `RouteGuard` dessa área.
- INV-13: Nenhuma página nem feature decide acesso a rota: a decisão está só em `decideAccess`,
  que reconhece o administrador da organização por `isOrganizationAdministrator`.

## LIMITACOES

- Não guarda a rota que a pessoa tentou abrir: depois do login ela cai sempre em `/`.
- Não há papel por projeto na decisão: as telas de card, de feature, de epic e de board ficam na
  área `member`, e quem abre o endereço de um projeto que não enxerga vê "Projeto não encontrado"
  (o projeto não está na lista dela) ou o 404 do Core no card, na feature e no epic. O que só o
  administrador do projeto faz no board é escondido pela tela (`canAdministerProject`), não pelo
  guard.
- O guard esconde a tela, mas quem garante o acesso é o Core, em toda requisição.
- O guard da área `organization-administrator` repete as consultas do guard de `member`; elas
  saem do cache, mas são dois observadores para as mesmas queries.
- O login não diz se a sessão expirou ou se a pessoa foi removida da organização: os dois casos
  chegam como renovação recusada.

## OBJETIVOS

- Uma tabela de decisão legível, com um teste por linha.
- Nenhuma tela autenticada renderizada, nem por um instante, para quem não deveria vê-la.

## NAO_OBJETIVOS

- Autorização por papel dentro das páginas.
- Substituir a validação de acesso do Core.

## VERIFICACAO

- `npx vitest run src/app/routes/access-decision.test.ts`
- `rg -n "role ===|role !==" src --glob '!**/*.test.*'` só devolve
  `src/features/organization/model/lib/organization-role.ts` e
  `src/features/project/model/lib/project-role.ts`.
- `rg -n "decideAccess|RouteGuard" src --glob '!**/*.test.*'` só devolve arquivos de
  `src/app/routes`.
- Em `src/app/routes/index.tsx`, as áreas `guest`, `first-access` e `member` embrulham o `Outlet`
  num `RouteGuard`; em `src/app/routes/organization.routes.tsx`, a página de convites fica sob
  `<RouteGuard area="organization-administrator">`.
- Em `src/app/routes/card.routes.tsx`, as quatro rotas de card têm `memberRoute` como pai (INV-1).
- Em `src/app/routes/feature.routes.tsx`, as três rotas (hierarquia do projeto, feature e epic) têm
  `memberRoute` como pai (INV-1).
- Em `src/app/routes/board.routes.tsx`, a rota dos boards do projeto tem `memberRoute` como pai
  (INV-1).
