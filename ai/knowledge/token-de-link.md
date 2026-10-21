---
id: token-de-link
titulo: O token dos links de e-mail vem no fragmento, vive só em memória e sai da barra de endereço
status: ativo
criado: 2026-10-12
atualizado: 2026-10-19
touches:
  - src/app/routes/use-link-token.ts
  - src/app/routes/link-token.ts
  - src/app/routes/account.routes.tsx
  - src/app/routes/invitation.routes.tsx
  - src/features/account/api/account.queries.ts
  - src/features/invitation/api/invitation.queries.ts
simbolos:
  - useLinkToken
  - readLinkToken
  - useGetEmailVerificationPreview
  - useGetInvitationPreview
  - /confirmar-email
  - /redefinir-senha
  - /aceitar-convite
  - AccountEmailComposer
  - InvitationEmailComposer
relacionados: [renovacao-da-sessao]
---

## PARA_QUE_SERVE

- Entrega às telas de confirmação de e-mail, troca de senha e aceite de convite o token que o Core
  mandou no link, sem deixá-lo exposto depois da leitura.

## POR_QUE_EXISTE

- O Core põe o token no fragmento (`#token=…`) justamente porque o fragmento não vai para o
  servidor nem para o log dele (`../Momentum.Core/ai/memory/incremental/identidade.md`). O front
  não pode desfazer isso levando o token para a query string, para o storage ou para o log.
- O token é uma credencial de uso único: vale a ativação da conta, a troca da senha ou a entrada
  numa organização. Fica na barra de endereço só até ser lido, para não sobrar no histórico, em
  captura de tela ou num link copiado.
- Quem lê é a rota, em `app/routes`, e a página recebe o token por prop: a regra do repositório é
  que só o `app` conhece URL, e três páginas de áreas diferentes precisam do mesmo comportamento.

## INVARIANTES

- INV-1: O token é lido só do fragmento da URL, por `readLinkToken`.
- INV-2: Depois de lido, o fragmento é removido da barra de endereço com `replace`, sem criar
  entrada no histórico.
- INV-3: O token vive só em estado de componente e na memória do TanStack Query; nunca é gravado
  em `localStorage`, `sessionStorage` ou cookie, nem registrado em log.
- INV-4: O token só sai do navegador no corpo de um `POST` para a API do Core; nunca em caminho ou
  query string.
- INV-5: Os caminhos `/confirmar-email`, `/redefinir-senha` e `/aceitar-convite` são os mesmos de
  `AccountEmailComposer` e `InvitationEmailComposer` do Core.
- INV-6: As queries das prévias do convite e da confirmação de e-mail, que têm o token na chave,
  usam `gcTime` 0 e somem do cache quando a tela sai.

## LIMITACOES

- Recarregar a página perde o token: a pessoa precisa abrir o link do e-mail de novo. A tela a
  trata como link inválido.
- O token ainda aparece na barra de endereço entre a abertura do link e a montagem da página.

## OBJETIVOS

- Um token de link nunca aparece em log, em storage nem em URL depois que a tela carregou.

## NAO_OBJETIVOS

- Sobreviver ao recarregamento da página.
- Validar o formato do token no front: quem decide se ele vale é o Core.

## VERIFICACAO

- `npx vitest run src/app/routes/link-token.test.ts`
- `rg -n "location.hash|useLocation" src --glob '!**/*.test.*'` só devolve
  `src/app/routes/use-link-token.ts`.
- `rg -n "token" src/features --glob '*.service.ts'` mostra o token só em corpo de `api.post`.
