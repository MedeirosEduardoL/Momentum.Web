---
id: conexao-com-o-movidesk
titulo: A senha do Movidesk só vive no formulário de conexão, com o portal à vista, e o portal da organização é coisa do administrador
status: revogado
revogado_por: nenhum
criado: 2026-10-17
atualizado: 2026-10-19
touches:
  - src/features/helpdesk/**
  - src/pages/account/my-account/**
  - src/pages/organization/helpdesk/**
simbolos:
  - HelpdeskConnectionSettings
  - HelpdeskPortalSettings
  - useConnectHelpdesk
  - useHelpdeskPortalSettings
  - portalHostOf
  - helpdeskKeys
  - connectHelpdesk
relacionados: [administracao-da-organizacao, guard-de-rota]
---

## PARA_QUE_SERVE

- Revogado em 2026-10-19: o usuário suspendeu a integração com o Movidesk, e o passo 9.4 removeu
  a feature `helpdesk`, a aba "Movidesk" e a página "Minha conta". Os chamados virão do Megabrain,
  por uma integração ainda sem desenho.
- Deixa o administrador informar o Movidesk da organização e cada pessoa conectar o próprio login
  a ele, para o Core ler os chamados dela (passo 9.1 do Core, conhecimento
  `conexao-com-o-movidesk` de lá).

## POR_QUE_EXISTE

- A tela recebe a senha corporativa da pessoa no Movidesk, que o Momentum não guarda (ADR 0004 do
  Core). Ela não pode sobrar no navegador: nem no cache de consultas, nem em armazenamento, nem
  como senha salva do Momentum, que é outra conta.
- O Core aceita no pedido de conexão o `portal_url` que a pessoa viu e recusa quando o portal
  mudou no meio: a tela mostra o host do portal ao lado da senha e manda o mesmo endereço, para a
  senha nunca ir a um portal que a pessoa não viu.
- O portal é da organização, e trocá-lo ou removê-lo encerra as conexões de todos: por isso a aba
  é só do administrador, e a conexão de cada pessoa mora em "Minha conta", que todo membro tem.

## INVARIANTES

- INV-1: A senha do Movidesk só existe no estado do React Hook Form de `useConnectHelpdesk` e no
  corpo do `PUT /api/v1/helpdesk-connections/me`: não vai para o cache do TanStack Query, store,
  `localStorage`, `sessionStorage` nem log, e o formulário volta vazio depois da conexão aceita.
- INV-2: Os campos de usuário e senha do Movidesk têm `autoComplete="off"`, e o da senha,
  `type="password"`.
- INV-3: O pedido de conexão leva o `portal_url` do portal mostrado no formulário, cujo host
  (`portalHostOf`) aparece no texto ao lado dos campos.
- INV-4: A aba "Movidesk" da área da organização só aparece para o administrador da organização,
  e a rota `/organizacao/movidesk` fica atrás do guard `organization-administrator`.
- INV-5: Toda mutation da feature `helpdesk`, com sucesso ou erro, invalida `helpdeskKeys.all`:
  trocar o portal encerra as conexões, e conectar depende do portal atual.
- INV-6: Remover o portal e desconectar só chamam a API pelo `onConfirm` de um `ConfirmButton`.
- INV-7: `HelpdeskPortalNotFound` e `HelpdeskConnectionNotFound` viram `null` no service, e a tela
  mostra o estado vazio em vez de erro.

## LIMITACOES

- Os chamados ainda não aparecem: a conexão existe para o passo 9.2 do Core, que espera as
  perguntas 90 e 91 do roadmap.
- As mensagens de recusa vêm do Core e falam em "portal de chamados", e não em Movidesk: o Core
  não nomeia o provedor fora do adaptador.
- A tela não mostra quando a sessão expira; isso nasce com a sincronização ("reconectar ao
  Movidesk", passo 9.3).

## OBJETIVOS

- Nenhuma senha do Movidesk guardada pelo navegador ou pelo Momentum.

## NAO_OBJETIVOS

- Encerrar pela tela a sessão aberta no Movidesk do navegador (pergunta 89 do roadmap).

## VERIFICACAO

- `npx vitest run src/features/helpdesk` → cobre INV-1 a INV-3, INV-6 e INV-7.
- `rg -n "localStorage|sessionStorage" src/features/helpdesk` → nada (INV-1).
- `rg -n 'autoComplete="off"' src/features/helpdesk/ui/helpdesk-connection-settings.tsx` → os dois
  campos (INV-2).
- `rg -n "movidesk" src/app/layouts/organization-settings-layout.tsx src/app/routes/organization.routes.tsx`
  → a aba sob `showsAdministration` e a rota com `RouteGuard area="organization-administrator"`
  (INV-4).
- `rg -c "onSettled: refreshHelpdesk" src/features/helpdesk/api/helpdesk.mutations.ts` → 4 (INV-5).
