# Integração com o Core

Como o front fala com a API do Momentum.Core e onde isso é traiçoeiro. O formato do erro e as
regras do contrato estão em `.claude/rules/data-layer.md`; aqui fica o que o código não conta.

## Caminho de uma chamada

- Service da feature → `api` (`src/shared/api/client.ts`) → `/api/v1/...` na mesma origem.
- Local: Vite (`npm start`, porta 5173) → proxy `/api` → Kong em `127.0.0.1:8010` → API. O Kong e a
  API sobem pelo `docker compose` do Core (`ai/memory/incremental/plataforma.md` de lá).
- Produção (D-04): o Kong serve o front em `/` e a API em `/api`, na mesma origem.
- O `api` não tem `baseURL`: o caminho passado é o mesmo do `openapi.json`. Cada service declara
  o caminho com `satisfies keyof paths`, e rota que sair do contrato quebra o typecheck. Rota com
  parâmetro passa pelo `fillPath`, com o molde do contrato (`/api/v1/projects/{projectId}/members`):
  o molde é conferido contra `paths`, parâmetro que falta quebra o typecheck e o valor é escapado.

## Sessão

- Cookie httpOnly (`SameSite=Strict`, `Path=/api`) lido pelo Kong (ADR 0003 do Core). O front não
  lê nem guarda token.
- `withCredentials` e `X-Requested-With: XMLHttpRequest` estão nos defaults do `api`, em toda
  requisição: o Core só exige o header nas mutações, mas mandar sempre é mais simples e não custa
  nada na mesma origem.
- `session` (`src/shared/api/session.ts`, criada em `client.ts`) é quem fala com as três rotas de
  sessão: `open` (login), `close` (logout) e a renovação. As features não chamam essas rotas por
  conta própria.
- **Renovação.** Um 401 em rota que não é de sessão dispara `PUT /api/v1/sessions/me` e, dando
  certo, a requisição original é repetida uma vez. Renovações simultâneas dividem a mesma chamada.
  409 `SessionAlreadyRenewed` (outra aba renovou) só repete a original. Renovação com 401 quer
  dizer que a sessão acabou: quem chamou recebe o 401 original. Outra falha na renovação (rede,
  5xx) volta como está, sem encerrar a sessão.
- O 401 das próprias rotas de sessão não renova nada: o do login é a recusa das credenciais.
- A requisição repetida leva a marca `retriedAfterSessionRenewal` na configuração do Axios. Se ela
  também voltar 401, o erro sobe sem segunda tentativa.
- `session.listen` recebe o que fazer quando a sessão abre e quando encerra. Quem registra é o
  `app` (`app/providers/session-cache.ts`), e por isso `shared` não importa de `app` nem de
  feature. O encerramento leva o motivo: `signed-out` (logout confirmado pelo servidor) ou
  `expired` (renovação recusada). O que o cache faz em cada caso está em `identidade-e-acesso.md`.
- **A ordem dos interceptors importa.** O da renovação vem antes do que converte em `ApiError`:
  ele precisa do erro cru do Axios, que ainda traz a configuração da requisição a repetir.

## Resposta em stream

- `postEventStream` (`src/shared/api/event-stream.ts`) é a única chamada que não passa pelo Axios:
  um `POST` com `fetch`, que lê o corpo `text/event-stream` em pedaços e entrega cada evento como
  `{ event, data }`. Hoje só a rodada da entrevista o usa (`entrevista-do-card.md`).
- Ele repete à mão o que os defaults e os interceptors do `api` fazem: cookie de sessão (só para
  a mesma origem, `credentials: "same-origin"`), o mesmo `X-Requested-With` (`REQUESTED_WITH_HEADER`, de `client.ts`), renovação no 401 por
  `session.renewAfter` com uma repetição, e erro convertido em `ApiError` (`fromResponse` para a
  resposta recusada, `networkFailure` para a conexão que não abre ou cai no meio).
- Não tem tempo de espera: quem encerra é o servidor (300 segundos no Core, 330 no Kong) ou o
  `AbortSignal` de quem chamou. O cancelamento chega a quem chamou como `AbortError`, sem
  conversão.
- O evento que fica pela metade quando o stream acaba é descartado, como manda a especificação do
  `text/event-stream`; quem sabe qual evento encerra o stream é quem consome.
- Erro que o Core manda dentro de um evento, e não numa resposta de erro, vira `ApiError` por
  `fromErrorList`, com `status` nulo. `isTransientFailure` responderia "transitório" para ele; a
  pergunta só é feita às queries, e stream não é query.

## Erro

- O interceptor converte toda falha em `ApiError`, menos o cancelamento: o Query cancela pelo
  `signal`, e cancelar não é erro de tela.
- Corpo no formato do Core vira `title`, `status`, `traceId` e `errors[]`, com `property` e as
  chaves de `metadata` em camelCase — `property: "card_type"` chega como `cardType`, o nome do campo
  no formulário.
- **Nem todo erro vem do Core.** O Kong responde 401 (plugin `jwt`) e 429 (`rate-limiting`) com
  `{ "message": "..." }`, e um 502 pode vir em HTML. Esses viram `UnexpectedResponse` com o status
  preservado: nesses casos, reaja pelo `status`, não pelo `code` (`hasErrorStatus`).
- O 429 fora do formato do Core já sai do client com a mensagem "Muitas tentativas em pouco tempo.
  Aguarde um pouco e tente de novo.": é o limite do Kong, e nenhuma tela precisa tratá-lo à parte.
  Em formulário ele vira toast pelo `applyApiErrors`; em ação de linha, pelo `toastApiError`.
- Códigos que nascem no front: `NetworkFailure` e `RequestTimeout` (status `null`),
  `UnexpectedResponse` e `UnexpectedFailure`. Todos com mensagem em português pronta para a tela.
- Retry de query só para falha transitória (rede, tempo esgotado, 5xx), até duas vezes. 424 e 429
  nunca se repetem sozinhos: custo de IA e limite pedem o "tente de novo" do usuário. Mutação não
  repete.
- O tempo de espera do 429 do Core vem em `metadata.retry_after_seconds`; `getRetryAfterSeconds`
  o lê e `formatWaitTime` (`shared/lib`) o escreve em segundos, minutos, horas ou dias. Trazem
  esse tempo o `SignInTemporarilyBlocked` e os limites de IA (`AiOrganizationQuotaReached` e
  `AiGlobalCapReached`, até a virada do mês, `AiRequesterLimitReached` e
  `LlmProviderRateLimited`); os 429 de convite (`InvitationDailyLimitReached`,
  `InvitationResendLimitReached`) vêm só com a mensagem.
- Mutação terminada não fica no cache (`gcTime` 0): as variáveis de várias delas levam senha.

## Tipos gerados

- `npm run api:types` lê `../Momentum.Core/openapi.json` e escreve
  `src/shared/api/generated/openapi.d.ts`. Regerado em 2026-10-13, no passo 6.2, já com as rotas
  de entrevista do card (`/api/v1/card-interviews`, passo 7.2 do Core) e de proposta de mudança
  (`/api/v1/card-interviews/{cardInterviewId}/proposals` e `/api/v1/card-interview-proposals`,
  passo 7.3); no passo 7.4 o gerador rodou de novo e não mudou nada. As telas consomem cards,
  estados, tasks, relações, features, epics, boards, entrevistas e propostas.
- O contrato declara a rota de rodada como `text/event-stream` de `InterviewRoundEventDto`, e o
  `ApplicationError` dos eventos: o dado de cada evento é lido com esse tipo.
- Confira o contrato antes de fechar a entrega, e não só ao começar: o Core recebe commits de
  outras sessões no mesmo dia. No passo 5.4 as rotas de entrevista entraram no `openapi.json`
  durante o trabalho; a mudança só acrescentava rotas, e o arquivo foi regerado no fim.
- Inteiro com formato (`int32`) sai como `number` desde a correção do contrato de 2026-10-13; o
  service de card ainda converte com `Number`, sem precisar (`cards.md`, "Contrato, onde é
  traiçoeiro").
- Onde o Core tem `PUT` para definir e `DELETE` para tirar no mesmo caminho (responsável do card e
  da task, feature do card, epic da feature), o service monta o corpo ou `null` e chama
  `putOrDelete` (`src/shared/api/put-or-delete.ts`), que escolhe o verbo.
- Os campos de entrada saem como `string | null`, porque o Core os declara anuláveis; o service
  monta o corpo num valor do tipo gerado, e campo que mudar de nome quebra o typecheck.
- O contrato não declara o corpo de erro; por isso o `ApiProblemDetails` é validado em runtime, com
  Zod, em `api-error.ts`.
- O arquivo é `.d.ts`, só tipos, e fica fora do ESLint, do Prettier e da checagem de diff.
