# Entrevista do card

O painel "Entrevista" da tela do card: as entrevistas do card, a conversa de cada uma, o stream
das rodadas e a proposta de mudança. O contrato da API está em
`../Momentum.Core/ai/memory/incremental/ia.md` ("Para o Momentum.Web (passo 7.4)") e os
invariantes do Core, em `../Momentum.Core/ai/knowledge/entrevista.md`; o que não pode quebrar
aqui, no conhecimento `entrevista-do-card`. Aqui fica o que o código não conta.

## Onde fica

- Não tem rota própria: é a última seção de `/cards/$cardId`, depois de "Relações". A página
  (`pages/card/detail`) entrega o painel ao `CardDetail` da feature `card` por `renderInterviews`,
  e o painel recebe o card já carregado.
- A feature é `card-interview`, dona de `/api/v1/card-interviews` e de
  `/api/v1/card-interview-proposals`. Ela lê de `card` (o tipo `Card`), de `project` (o papel no
  projeto), de `organization` (se a pessoa tem a permissão de IA) e de `account` (quem é a pessoa).
  Ninguém importa dela, a não ser a página.
- A direção fica `card-interview → card → feature → project → organization → account`.

## Quem vê o quê

| Quem | Vê | Regra na tela |
| --- | --- | --- |
| Quem enxerga o card | As entrevistas, as rodadas, as respostas e as propostas | sempre |
| Quem tem a permissão de IA (`ai_enabled`) | "Iniciar entrevista", se o card não está arquivado e não tem entrevista aberta | `canStartInterview` |
| Quem iniciou e continua com a permissão de IA | Responder, pedir rodada, pedir, aplicar e descartar proposta | `canConductInterview` |
| Quem iniciou, ou o administrador do projeto | "Encerrar entrevista" | `canCloseInterview` |

- `ai_enabled` vem de `GET /api/v1/organizations/me`; o papel no projeto, de
  `GET /api/v1/projects`, pelo `canAdministerProject` da feature `project`. O guard já carregou a
  conta e a organização antes de a tela aparecer; os projetos de um membro podem chegar depois, e
  até lá "Encerrar" não aparece para o administrador do projeto que não iniciou.
- Quem não conduz lê um aviso dizendo quem conduz. Quem iniciou e perdeu a permissão lê que ainda
  pode encerrar.
- Esconder não protege: o Core recusa (`InterviewNotEnabled`, `InterviewNotTheStarter`,
  `InterviewCloseDenied`), e a tela mostra a mensagem dele.

## Fluxos

- **Lista.** Da mais nova para a mais antiga, como o Core devolve. A entrevista aberta fica
  sempre expandida, sem botão de recolher. As encerradas ficam recolhidas, e "Ver a conversa"
  busca a entrevista só então.
- **Iniciar** cria a entrevista e, no mesmo clique, pede a primeira rodada com o corpo `{}`
  (pergunta 64): o `onSuccess` do início chama o mesmo `ask` da condução, depois de a lista ser
  relida. Início recusado não pede rodada. Se a rodada falha, a entrevista fica aberta, com o
  aviso da falha e "Pedir a primeira rodada", como em qualquer rodada; nada é repetido sozinho.
- **Rodada.** O botão pede com o corpo `{}`. Enquanto o stream corre, a tela mostra só "A IA está
  escrevendo a rodada…", com "Cancelar" e o aviso de que cancelar não devolve o custo, sem o texto
  que chega nos `delta` (pergunta 67). A rodada só aparece depois do evento `round`, relida de
  `GET /api/v1/card-interviews/{id}`.
- **Responder.** Um campo por pergunta, até 2.000 caracteres; "Usar a recomendação" copia a
  resposta recomendada para o campo, e a pessoa ainda pode editar. Basta uma resposta. Enviar
  grava as respostas e pede a rodada seguinte na mesma chamada.
- **Fim das perguntas.** Rodada sem pergunta vira o aviso "A IA não tem mais perguntas para este
  card", e não aparece como rodada. Quando essa rodada chega de um pedido feito na tela e a
  entrevista já tem resposta, o painel pede a proposta sozinho (pergunta 63); abrir a tela de uma
  entrevista já terminada não pede nada. Com dez rodadas respondidas, o aviso do limite aponta
  para a proposta, que a pessoa pede.
- **Proposta.** "Pedir proposta de mudança" só aparece com uma rodada respondida. Durante o
  pedido, que pode passar de um minuto, a tela mostra a espera e some com o botão. A proposta
  pendente mostra o resumo e, para cada mudança, o valor atual do card ao lado do proposto, com
  uma caixa de marcar; todas começam marcadas. "Aplicar e encerrar" e "Aplicar e continuar"
  mandam só as marcadas, e o primeiro manda `close_interview` (pergunta 53); só o botão escolhido
  mostra a espera. "Descartar" pede confirmação.
- **Depois de aplicar**, a tela inteira é recarregada do Core, e a descrição e os campos do tipo
  mostram o card novo. Com "Aplicar e encerrar", a entrevista volta encerrada; com "Aplicar e
  continuar", um aviso diz que ela continua aberta.
- **Encerrar** pede confirmação e diz que a proposta pendente é descartada.

## Stream, onde é traiçoeiro

- **Não é `EventSource`.** O pedido é um `POST`, lido com `fetch` por `postEventStream`
  (`src/shared/api/event-stream.ts`). O leitor é genérico: entrega `{ event, data }` e não sabe
  o que é rodada. Quem conhece `round` e `error` é o service da feature, que ignora os `delta`.
- **O que é recusado antes do stream é erro HTTP comum** (`application/problem+json`), convertido
  em `ApiError` pelo mesmo leitor do client. O que falha durante a geração chega no evento
  `error`, com a lista `errors` no formato da API, e vira `ApiError` por `fromErrorList`, com
  `status` nulo. A tela trata os dois do mesmo jeito, pelo `code`.
- **O service ignora os `delta`.** Eles levam o JSON da rodada antes da validação, e a tela não
  os mostra (pergunta 67). O service não guarda nem repassa o texto deles.
- **O pedido de rodada é um só por tela do card.** `useCardInterviewRound` nasce em
  `CardInterviews`, dona do botão de iniciar, e desce por `CardInterviewItem`,
  `CardInterviewDetail` e a conversa até a condução. Iniciar precisa do pedido antes de a condução
  da entrevista nova existir; pedir num efeito ao montar a condução seria abortado pelo
  `StrictMode` no desenvolvimento, que desmonta e remonta. Por isso sair da tela do card cancela o
  stream, mas a condução sumir com a tela aberta (entrevista encerrada por outra pessoa e relida,
  permissão retirada) não cancela: o stream segue até o Core responder. A falha também é uma só
  por tela: iniciar limpa a anterior ao pedir a primeira rodada, mas a entrevista iniciada pela
  mesma pessoa em outra aba aparece aqui com a falha da anterior até o próximo pedido.
- **O stream que acaba sem `round` nem `error`** (conexão cortada, proxy) é tratado como falha de
  conexão. A rodada pode ter sido gravada assim mesmo: a entrevista é relida depois de todo
  pedido, e a tela mostra o que vale.
- **Depois de um erro durante a geração, as respostas já estão gravadas.** A entrevista relida
  traz a rodada respondida, o formulário sai e o botão vira "Pedir a próxima rodada", que manda
  `{}`. Reenviar as respostas daria `InterviewAnswersUnexpected`.
- **Quando o pedido falha antes de gravar** (rede, 400, 429 do Kong), a rodada continua pendente
  e o formulário fica na tela com o que a pessoa escreveu.
- **A mutation só termina depois de a entrevista ser relida.** Enquanto isso a tela segue em
  "gerando", sem deixar enviar de novo com a versão velha da entrevista.
- **Sair da tela cancela** o `fetch`, e o Core não grava a rodada; a tentativa conta e a reserva
  de custo também.
- **Sessão.** O `fetch` não passa pelos interceptors do Axios. `postEventStream` renova a sessão
  no 401 e repete uma vez, pela mesma `session.renewAfter` (conhecimento `renovacao-da-sessao`),
  e só manda o cookie para a mesma origem.
- **No Kong, todo `POST` sob `/api/v1/card-interviews`** (iniciar, rodada e proposta) passa pelo
  service de stream: 20 por minuto por sessão e 330 segundos de espera. O 429 dele vem fora do
  formato do Core e já sai do leitor com a mensagem de "muitas tentativas".

## Proposta, onde é traiçoeira

- **O pedido usa o `api` com espera própria de 330 segundos**, a mesma do Kong para a rota; o
  padrão de 15 segundos cortaria a chamada.
- **A mudança traz `text` ou `items`.** No tipo interno vira `proposed`, texto ou lista; a lista
  só vem nos critérios de aceite. O valor atual do card sai de `currentValueOf`, na mesma forma.
- **`InterviewProposalOutdated` (409)** pode deixar a proposta pendente ou já descartada, conforme
  o instante em que o Core percebeu. A tela mostra a mensagem em toast, que sobrevive à troca da
  lista, e, se a proposta continua pendente, troca "Aplicar" por "Pedir outra proposta".
- **Pedir outra descarta a pendente no Core.** Por isso a tela só oferece pedir outra quando a
  pendente não serve mais (venceu ou veio sem mudança); nos outros casos a pessoa decide primeiro.
- **Proposta sem mudança** (`changes` vazio) mostra "A IA não propôs nenhuma mudança" e oferece
  descartar ou pedir outra.

## Erros

- Rodada e pedido de proposta mostram a falha num aviso fixo, perto do botão, com a mensagem do
  Core e, quando vem `retry_after_seconds`, "Disponível de novo em …" (`describeApiFailure`, de `shared/api`).
  O aviso fica até a próxima tentativa; nada é repetido sozinho.
- `InterviewRoundLimitReached` (422) não aparece como falha: chega depois de as respostas da
  décima rodada serem gravadas, e a tela já mostra o aviso do limite.
- `InterviewRoundAttemptsExhausted` (422): a mensagem do Core manda encerrar e iniciar outra, e o
  botão de pedir a rodada some enquanto a falha está na tela.
- `InterviewNotEnabled` (403), ao iniciar, pedir rodada ou pedir proposta: além da mensagem, a
  organização é relida, e as ações somem.
- `InterviewRoundAlreadyAsked` (409), `InterviewClosed` e `InterviewAlreadyFinished` (422): a
  mensagem do Core, e a entrevista relida mostra o que vale.
- Iniciar: `InterviewAlreadyOpen`, `InterviewLimitReached` e `InterviewCardArchived` em toast.
- Decidir proposta: `InterviewProposalFieldsInvalid` vem com `property: fields` e aparece abaixo
  da lista de mudanças; `InterviewProposalAlreadyDecided` e `InterviewClosed`, em toast, com a
  lista recarregada.
- Erros de IA (`AiNotConfigured`, `AiOrganizationQuotaReached`, `AiGlobalCapReached`,
  `AiRequesterLimitReached`, `AiCallTooLarge`, `LlmProviderFailed`, `LlmProviderInterrupted`,
  `LlmProviderRateLimited`, `LlmInvalidResponse`, `InterviewRoundInvalid`,
  `InterviewProposalInvalid`): todos pela mensagem do Core, sem tratamento por código. Na rodada
  chegam pelo evento `error`; na proposta, como erro HTTP.

## Decisões

- **Mutation com `useMutation` em volta do stream.** O service devolve uma promessa (a rodada);
  o hook guarda a falha e o `AbortController`. Assim o stream segue o mesmo desenho de service,
  mutation e hook do resto do front.
- **Aplicar invalida o cache inteiro.** A feature não conhece as chaves de `card`, e a tela do
  card tem de mostrar o card novo. As outras mutations invalidam só as consultas de entrevista.
- **O título da pergunta é texto do React**, como o título de task e de card relacionado; corpo,
  recomendação, resposta e proposta passam pelo `MarkdownContent`, com o destino de cada link à
  vista.
- **A resposta da pessoa também passa pelo markdown**: quando ela segue a recomendação, a resposta
  é texto do modelo.
- **A decisão da proposta não é um `<form>`.** As caixas ficam num `div`, e só o clique em
  "Aplicar as mudanças escolhidas" aplica. Num formulário, Enter com o foco numa caixa enviaria
  tudo, e todas as mudanças nascem marcadas. O RHF continua validando: `handleSubmit` não precisa
  do elemento.
- **O pedido de proposta mora na conversa** (`CardInterviewConversation`): a condução o dispara
  quando a IA termina, e a seção de propostas mostra a espera e a falha do mesmo pedido.
- **A espera da rodada não mostra o texto do stream** (pergunta 67): o JSON pela metade não serve
  para ler, e interpretá-lo mostraria como pergunta o que ainda não foi validado.

## Armadilhas

- **Em teste de tela, afirmar que o texto de um `delta` não aparece pede esperar a leitura do
  stream.** O evento é lido em microtarefas depois do `enqueue`; sem uma volta de `setTimeout`
  dentro do `act`, a afirmação passa antes de o evento chegar e não prova nada.
- **Em teste, o corpo simulado do stream precisa reagir ao cancelamento.** O `fetch` de verdade
  derruba o corpo quando o sinal aborta; um `Response` de teste, não. Sem ligar o `abort` ao
  `controller.error`, a leitura nunca termina e o teste fica esperando.
- **Depois do evento final o leitor cancela o corpo.** Chamar `controller.close()` no teste depois
  de `round` ou `error` lança "Controller is already closed".
- **`controller.error()` apaga o que ainda estava na fila do stream.** Para simular "chegou um
  evento e depois a conexão caiu", entregue os pedaços por `pull`, um por leitura.
- **Quem simula o client em teste de tela precisa simular também `REQUESTED_WITH_HEADER` e
  `session`**, que o leitor do stream importa de `shared/api/client`.
- **Caixa de marcar registrada no RHF não pode ser desabilitada**: o RHF ignora a caixa
  desabilitada ao montar a lista de valores. As da proposta ficam sempre habilitadas.
- **A proposta pendente tem `key` pelo id.** Sem ela, a proposta nova herdaria as caixas e o aviso
  de "venceu" da anterior.

## Ainda não existe

- Atualização da conversa para quem só lê, sem recarregar.
- Quantas tentativas e quantos pedidos de proposta restam: o contrato não traz.
- O texto das mudanças de propostas já decididas: a tela mostra o resumo e os campos aplicados.
- Aviso de proposta vencida antes de tentar aplicar: o contrato não traz a versão do card.
- Tela de consumo de IA da organização: o Core não tem a rota.
