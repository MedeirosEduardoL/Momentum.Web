---
id: renovacao-da-sessao
titulo: O client renova a sessão no 401, repete a requisição e avisa o app quando ela abre ou encerra
status: ativo
criado: 2026-10-12
atualizado: 2026-10-21
touches:
  - src/shared/api/session.ts
  - src/shared/api/client.ts
  - src/shared/api/event-stream.ts
  - src/shared/api/api-base-url.ts
  - src/app/providers/session-cache.ts
simbolos:
  - createSession
  - session.open
  - session.close
  - session.listen
  - session.renewAfter
  - retryAfterRenewal
  - postEventStream
  - bindSessionToCache
  - currentAccountQuery
  - SessionAlreadyRenewed
  - retriedAfterSessionRenewal
  - SessionEndReason
  - sessionExpiryQuery
  - API_BASE_URL
  - VITE_API_BASE_URL
relacionados: [guard-de-rota, token-de-link]
---

## PARA_QUE_SERVE

- Mantém a pessoa conectada quando o JWT de 60 minutos expira, sem a tela perceber: a requisição
  que recebeu 401 é refeita depois da renovação.
- Dá ao `app` um único lugar para dizer o que acontece com o cache quando a sessão abre e quando
  encerra.
- Diz ao `app` por que a sessão encerrou, para o login explicar a quem foi tirado no meio do uso.

## POR_QUE_EXISTE

- Contrato do passo 3.1 do Core (`../Momentum.Core/ai/memory/incremental/identidade.md`): no 401,
  tentar `PUT /api/v1/sessions/me` uma vez e repetir; renovação com 401 é o fim da sessão; 409
  `SessionAlreadyRenewed` é outra aba que renovou, e basta repetir.
- A sessão é um cookie httpOnly (ADR 0003 do Core): o JavaScript não sabe se há sessão nem quando
  ela expira, só descobre pelo 401. Renovar por relógio exigiria confiar no `access_expires_at`
  guardado em memória, que se perde ao recarregar.
- As três rotas de sessão ficam em `shared/api`, e não numa feature, porque o login (feature
  `account`) e o aceite do convite (feature `invitation`) abrem sessão, e uma feature não importa a
  ação da outra. "Sessão" não é termo do glossário: é transporte, como o client.
- O que fazer com o cache entra por `session.listen`, registrado pelo `app`: `shared` não conhece
  o TanStack Query das features nem a chave da conta atual. A alternativa, importar a chave em
  `shared`, inverteria a direção das camadas.
- Ao encerrar, a conta atual recebe `null` em vez de ser refeita: refazer cairia de novo no 401, na
  renovação e no encerramento, em laço.
- O stream da rodada da entrevista sai por `fetch` (`postEventStream`), fora do Axios e dos
  interceptors dele. Sem renovar ali, quem passa dos 60 minutos respondendo a uma rodada receberia
  401 ao enviar. A renovação é a mesma do interceptor, `session.renewAfter`, para as duas vias
  dividirem a chamada e a regra do que fazer quando ela é recusada.
- Em produção, o front fica no Cloudflare Pages (`momentum.infinitemonkey.com.br`) e a API em
  outra origem do mesmo site (`gateway.infinitemonkey.com.br`, ADR 0005 do Core): o stream precisa
  mandar o cookie com `credentials: "include"`, como o Axios faz com `withCredentials`. O cookie é
  só do host da API, então o navegador não o manda a nenhum outro.
- "A sessão expirou" fica no cache do TanStack Query, ao lado da conta atual, e não numa store: a
  sessão tem uma fonte só (`.claude/rules/state.md`), e o guard precisa reagir à marca junto com a
  mudança da conta. Ela só vale com uma conta no cache: o visitante que abre o site sem sessão
  também tem a renovação recusada, e não havia uso nenhum para interromper.

## INVARIANTES

- INV-1: Um 401 numa rota que não é de sessão dispara no máximo uma renovação e uma repetição da
  requisição original; a requisição repetida que volta 401 não renova de novo.
- INV-2: O 401 de `POST /api/v1/sessions`, `PUT /api/v1/sessions/me` e
  `DELETE /api/v1/sessions/me` nunca dispara renovação.
- INV-3: Renovações pedidas ao mesmo tempo na mesma aba dividem uma única chamada a
  `PUT /api/v1/sessions/me`.
- INV-4: Renovação com 401 avisa o encerramento da sessão uma vez e devolve a quem chamou o erro
  401 original; com 409 `SessionAlreadyRenewed`, a requisição original é repetida sem encerrar
  nada; com outra falha, o erro da renovação sobe e a sessão não é encerrada.
- INV-5: `src/shared/api` não importa de `src/app` nem de `src/features`; a reação à sessão entra
  por `session.listen`.
- ~~INV-6~~ (removido em 2026-10-12: a marca de sessão expirada também fica no cache;
  substituído pelo INV-11).
- INV-7: `session.close` só avisa o encerramento depois que o servidor respondeu com sucesso.
- INV-8: Ao abrir a sessão, as queries sem uso são descartadas e as em uso são refeitas antes de
  `session.open` terminar.
- INV-9: Nenhum token nem dado de sessão é gravado em `localStorage`, `sessionStorage` ou cookie
  escrito pelo JavaScript.
- INV-10: O interceptor da renovação é registrado antes do que converte o erro em `ApiError`.
- INV-11: Ao encerrar a sessão, por logout confirmado pelo servidor ou por renovação recusada, a
  conta atual vira `null` no cache e todas as outras queries são apagadas, menos a marca de sessão
  expirada (`sessionExpiryQuery`).
- INV-12: O encerramento é avisado com o motivo: `expired` só quando a renovação responde 401, e
  `signed-out` só quando `session.close` teve a resposta do servidor.
- INV-13: A marca de sessão expirada só fica verdadeira no encerramento `expired` com uma conta no
  cache; o encerramento `signed-out`, e o `expired` sem conta no cache, a deixam falsa.
- INV-14: Abrir a sessão apaga a marca de sessão expirada.
- INV-15: O 401 de um `postEventStream` renova pela mesma `session.renewAfter` do interceptor e
  repete o pedido uma vez; o pedido repetido que volta 401 sobe como erro, sem renovar de novo.
- INV-16: `postEventStream` manda o mesmo `X-Requested-With` do `api` (`REQUESTED_WITH_HEADER`) e
  o cookie de sessão com `credentials: "include"`, ao mesmo endereço do `api`: `API_BASE_URL`,
  vindo de `VITE_API_BASE_URL` no build, e a mesma origem quando ela não existe. Reescrito em
  2026-10-21, com a confirmação do usuário; antes, `credentials: "same-origin"`.

## LIMITACOES

- Não renova antes de expirar: a primeira requisição depois dos 60 minutos sempre paga um 401 e
  uma renovação.
- Visitante sem sessão paga duas chamadas ao abrir uma rota com guard: a consulta da conta e a
  tentativa de renovação, as duas com 401.
- Abas diferentes não se avisam: a outra aba só percebe o logout na próxima requisição dela, ou
  quando a conta atual é refeita ao voltar o foco.
- A renovação recusada tem um motivo só para o front: quem foi removido da organização, ou saiu
  em outra aba, vê o mesmo aviso de sessão expirada.
- Recarregar a página apaga a marca: quem recarrega depois de a sessão expirar chega ao login sem
  o aviso.

## OBJETIVOS

- Sessão expirada nunca aparece como erro de tela enquanto o refresh token valer.
- Dado de uma conta nunca fica no cache para a próxima pessoa que entrar na mesma aba.

## NAO_OBJETIVOS

- Guardar ou ler token no front.
- Sincronizar a sessão entre abas por `BroadcastChannel` ou evento de storage.
- Repetir sozinho a requisição que falhou por outro motivo: isso é política de retry
  (`query-config.ts`).

## VERIFICACAO

- `npx vitest run src/shared/api/session.test.ts src/shared/api/event-stream.test.ts src/app/providers/session-cache.test.ts`
- `rg -n "localStorage|sessionStorage|document.cookie" src` não devolve nada.
- `rg -n "@/app|@/features" src/shared` não devolve nada.
- `rg -n "api/v1/sessions" src --glob '!**/*.test.*' --glob '!src/shared/api/generated/**'` só
  devolve `src/shared/api/session.ts`.
- `rg -n "renewAfter" src --glob '!**/*.test.*'` só devolve `src/shared/api/session.ts` e
  `src/shared/api/event-stream.ts` (INV-15).
- `rg -n "\bfetch\(" src --glob '!**/*.test.*'` só devolve `src/shared/api/event-stream.ts`, e
  `rg -n "API_BASE_URL" src --glob '!**/*.test.*'` devolve `api-base-url.ts`, `client.ts` e
  `event-stream.ts` (INV-16).
