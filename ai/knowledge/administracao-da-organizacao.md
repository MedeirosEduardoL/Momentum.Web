---
id: administracao-da-organizacao
titulo: Ação de administração aparece pelo papel, pede confirmação quando destrói e tem um dono só por chamada
status: ativo
criado: 2026-10-12
atualizado: 2026-10-20
touches:
  - src/features/organization/model/lib/organization-role.ts
  - src/features/organization/ui/organization-member-list.tsx
  - src/features/organization/api/organization.mutations.ts
  - src/features/organization/api/organization.service.ts
  - src/features/project/model/lib/project-role.ts
  - src/features/project/api/project.service.ts
  - src/features/project/ui/organization-project-list.tsx
  - src/features/project/ui/project-team.tsx
  - src/pages/organization/projects/index.tsx
  - src/features/project/ui/project-member-row.tsx
  - src/features/invitation/ui/pending-invitation-list.tsx
  - src/features/invitation/model/hooks/use-invitation-actions.ts
  - src/features/first-access/**
  - src/pages/organization/first-access/index.tsx
simbolos:
  - isOrganizationAdministrator
  - canAdministerProject
  - ConfirmButton
  - ConfirmDialog
  - OwnRoleConfirmation
  - CreateProjectForm
  - createProject
  - renderNextStep
  - FirstBoardDialog
  - FirstAccessForm
  - projectStep
  - OrganizationLastAdministrator
  - ProjectAdministrationDenied
  - changeOrganizationMemberAiPermission
  - ai_enabled
relacionados: [guard-de-rota, entrevista-do-card]
---

## PARA_QUE_SERVE

- Decide quem vê as ações de administração da organização, dos convites e dos times.
- Impede que remover membro, cancelar convite e tirar do time aconteçam por um clique só.
- Mantém a criação de projeto num lugar, usada pelo primeiro acesso e pela área da organização.
- Leva quem cria um projeto, na área da organização ou no primeiro acesso, ao passo seguinte, o
  primeiro board dele.

## POR_QUE_EXISTE

- Papéis do roadmap (resposta 9) e do Core (`../Momentum.Core/ai/knowledge/organizacao-e-acesso.md`):
  o administrador da organização convida, cria projetos e administra todos os projetos dela; o
  administrador do projeto cuida do time. O papel efetivo no projeto já vem calculado em
  `GET /api/v1/projects`; recalcular no front criaria uma segunda regra para divergir da do Core.
- A tela esconde o que a pessoa não pode fazer, mas quem recusa é o Core (403). A comparação de
  papel fica numa função por domínio para a tela e o guard nunca discordarem.
- A criação de projeto nasceu na feature `first-access`, que fazia os dois `POST` num envio.
  Quando ganhou a segunda tela, duplicar chamada, schema e campos foi descartado pela regra "não
  duplique", e `first-access` importar a mutation de `project`, pela regra "leitura cruza, ação
  não". Sobrou o dono do projeto exportar o formulário e a página compor os dois.
- Mudar papel e remover membro mexem no que as outras features mostram (papel efetivo, times, aba
  de convites), e a feature `organization` não conhece as chaves de cache delas.
- O projeto nasce sem board, e quem o criou é guiado a criar o primeiro (pergunta 40 do roadmap).
  O board é da feature `board`, que importa de `project`; a lista de projetos não pode importar o
  formulário de board. Ficou o mesmo desenho do primeiro acesso: a lista guarda o projeto recém-
  criado e mostra o que a página entrega em `renderNextStep`. No primeiro acesso, a página entrega
  ao `CreateProjectForm` o `onProjectCreated` que a rota liga ao store do primeiro board, e o
  diálogo abre em `/`, depois do redirecionamento do guard (pergunta 82, conhecimento
  `telas-de-board`).
- A permissão de IA ("Pode usar a IA"), que libera a entrevista e o briefing do card, é marcada
  pelo administrador da organização, pessoa a pessoa, e vale em todos os projetos (respostas 19 e
  74 do roadmap). A permissão viaja no mesmo `PATCH` do papel; mandar os dois juntos trocaria o
  papel de alguém com o valor que a tela tinha em cache.
- A confirmação do próprio papel usa o `ConfirmDialog` de `shared/ui` (pergunta 87): o diálogo
  montado à mão repetia o desenho dele.
- Remover alguém da organização encerra as sessões da pessoa, e sair da organização por conta
  própria ainda não existe no produto: a própria conta não tem o botão.

## INVARIANTES

- INV-1: Nenhum componente, hook ou página compara `role` direto: o papel na organização é lido
  por `isOrganizationAdministrator`, e o papel no projeto, por `canAdministerProject`.
- INV-2: Mudar papel na organização, remover membro e "Novo projeto" só aparecem para quem
  `isOrganizationAdministrator` reconhece.
- INV-3: Incluir no time, mudar papel no projeto e tirar do time só aparecem quando
  `canAdministerProject` aceita o projeto, com o `role` vindo de `GET /api/v1/projects`.
- INV-4: Remover membro, cancelar convite e tirar do time só chamam a API pelo `onConfirm` de um
  `ConfirmButton`.
- INV-5: A linha da própria conta, na lista de membros da organização, não tem "Remover".
- INV-6: `POST /api/v1/projects` é chamado só por `createProject`, da feature `project`; a feature
  `first-access` não chama rota de projeto e mostra o passo do projeto que a página entrega em
  `projectStep`.
- INV-7: As mutations de membro da organização invalidam o cache inteiro ao terminar, com sucesso
  ou com erro.
- INV-8: O aviso de reenvio de convite não afirma que o e-mail foi enviado: o Core responde 202
  também quando não envia.
- INV-9: A caixa "Pode usar a IA" só aparece para quem `isOrganizationAdministrator` reconhece;
  os demais veem só o texto, na linha de quem tem a permissão.
- INV-10: Marcar ou desmarcar quem pode usar a IA manda `PATCH` só com `ai_enabled`, e
  mudar o papel, só com `role`.
- INV-11: Depois que "Novo projeto" cria o projeto, a lista fecha o formulário e mostra uma vez o
  que a página entrega em `renderNextStep`, com o projeto devolvido pelo `POST`; terminar o passo
  o tira da tela, e só uma nova criação o traz de volta. `src/features/project` não importa de
  `@/features/board`.
- INV-12: Mudar o próprio papel na organização só chama a API pelo `onConfirm` do `ConfirmDialog`
  de `OwnRoleConfirmation`; `organization-member-list.tsx` não monta `Modal`.

## LIMITACOES

- O papel é o do cache: quem perde a administração continua vendo as ações até a próxima consulta,
  e o Core as recusa. Depois da recusa, a lista é recarregada.
- Mudar o próprio papel pede confirmação num diálogo, e só depois dela vai ao Core; rebaixar a si
  mesmo só se desfaz por outro administrador. Tirar a si mesmo do time de um projeto pede a
  confirmação de sempre, com o título e o aviso da própria conta: os cards dela ficam sem
  responsável.
- Tirar de alguém a permissão de IA não pede confirmação nem encerra a entrevista que a pessoa
  conduz: ela deixa de poder seguir, e só encerra; e deixa de poder gerar o briefing.
- O primeiro acesso em dois passos custa um clique e um carregando a mais do que o envio único
  que existia até o passo 3.4.
- No primeiro acesso, o passo do primeiro board só aparece em `/`, depois de o guard levar a
  pessoa para lá (INV-6 de `guard-de-rota`), e se perde se a página for recarregada antes.

## OBJETIVOS

- Nenhuma ação destrutiva sem a pessoa ler a consequência.
- Uma chamada à API, um dono.

## NAO_OBJETIVOS

- Substituir a validação de acesso do Core.
- Permissão por recurso dentro do projeto.

## VERIFICACAO

- `npx vitest run src/features/organization src/features/project src/features/invitation src/shared/ui/confirm-button.test.tsx`
- `rg -n "role ===|role !==" src --glob '!**/*.test.*'` só devolve `organization-role.ts` e
  `project-role.ts` (INV-1).
- `rg -n "api/v1/projects\"" src --glob '*.service.ts'` só devolve
  `src/features/project/api/project.service.ts` (INV-6).
- `rg -n "removeOrganizationMember|cancelInvitation|removeProjectMember" src/features --glob '*.tsx'`
  não devolve nada: a tela só as alcança por `onRemove` e `onCancel`, ligados ao `onConfirm` de um
  `ConfirmButton` (INV-4).
- `rg -n "invalidateQueries\(\)" src/features/organization` devolve as três mutations (INV-7).
- `rg -n "ai_enabled|role \}" src/features/organization/api/organization.service.ts` mostra,
  além das duas leituras do contrato, um corpo só com `role` e outro só com `ai_enabled`
  (INV-10).
- `npx vitest run src/features/project/ui/organization-project-list.test.tsx`;
  `rg -n "@/features/board" src/features/project` não devolve nada (INV-11).
- `rg -n "<Modal" src/features/organization/ui/organization-member-list.tsx` não devolve nada, e
  `npx vitest run src/features/organization/ui/organization-member-list.test.tsx` cobre o
  diálogo do próprio papel (INV-12).
