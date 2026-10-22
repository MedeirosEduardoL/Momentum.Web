---
id: entrevista-do-card
titulo: O painel da entrevista mostra o texto da IA só sanitizado, esconde o texto do stream e não pede nem aplica nada sem um clique
status: ativo
criado: 2026-10-13
atualizado: 2026-10-22
touches:
  - src/features/card-interview/api/card-interview.service.ts
  - src/features/card-interview/api/card-interview-proposal.service.ts
  - src/features/card-interview/api/card-interview.mutations.ts
  - src/features/card-interview/model/hooks/use-card-interview-round.ts
  - src/features/card-interview/model/hooks/use-start-card-interview.ts
  - src/features/card-interview/model/hooks/use-request-card-interview-proposal.ts
  - src/features/card-interview/model/hooks/use-decide-card-interview-proposal.ts
  - src/features/card-interview/model/lib/card-interview-access.ts
  - src/features/card-interview/model/lib/card-interview-progress.ts
  - src/features/card-interview/ui/card-interview-question.tsx
  - src/features/card-interview/ui/card-interview-round-view.tsx
  - src/features/card-interview/ui/card-interview-conduct.tsx
  - src/features/card-interview/ui/card-interview-detail.tsx
  - src/features/card-interview/ui/card-interview-proposal.tsx
  - src/features/card-interview/ui/card-interview-proposal-changes.tsx
  - src/features/card-interview/ui/card-interview-proposal-decision.tsx
  - src/features/card-interview/ui/card-interviews.tsx
  - src/features/card-interview/index.ts
  - src/shared/api/event-stream.ts
  - src/pages/card/detail/index.tsx
simbolos:
  - CardInterviews
  - askCardInterviewRound
  - postEventStream
  - useCardInterviewRound
  - useStartCardInterview
  - useRequestCardInterviewProposal
  - useDecideCardInterviewProposal
  - canStartInterview
  - canConductInterview
  - canCloseInterview
  - nextInterviewStep
  - cardInterviewKeys
  - showsLinkDestination
  - renderInterviews
  - InterviewRoundLimitReached
  - InterviewRoundAttemptsExhausted
  - InterviewProposalOutdated
  - InterviewNotEnabled
relacionados: [telas-de-card, renovacao-da-sessao, administracao-da-organizacao]
---

## PARA_QUE_SERVE

- Mostra, na tela do card, as entrevistas dele e a conversa de cada uma, para todo o time ler.
- Deixa quem iniciou a entrevista pedir rodadas à IA, responder, pedir a proposta de mudança no
  card e aplicá-la, campo a campo.
- Garante que o texto escrito pelo modelo não vire script nem link disfarçado na tela de quem o
  lê, e que nenhuma chamada paga saia sem a pessoa pedir.

## POR_QUE_EXISTE

- Contrato do Core (`../Momentum.Core/ai/memory/incremental/ia.md`, "Para o Momentum.Web (passo
  7.4)", e o conhecimento `entrevista` de lá): os eventos `delta` levam o texto do modelo antes da
  validação, e a rodada só existe no evento `round`. Por decisão do usuário (resposta 67 do
  roadmap), a tela não mostra o `delta`: enquanto a IA escreve, mostra só a espera. Mostrar o
  `delta` como pergunta poria na tela uma rodada que o Core pode recusar.
- O validador do Core limita a forma do texto do modelo, não a intenção: link em texto passa. A
  defesa que sobra é da tela, e por isso o destino de todo link aparece ao lado do texto dele. A
  alternativa, tirar os links, apagaria referência legítima que a pessoa mesma escreveu na
  resposta.
- Cada rodada e cada proposta é uma chamada paga, contada por tentativa no Core (cinco por rodada,
  dez propostas por entrevista). Repetir sozinho depois de um erro gastaria a cota e as tentativas
  sem ninguém decidir.
- O `POST` da rodada responde `text/event-stream`, que o `EventSource` não cobre e que o Axios do
  projeto não lê em pedaços. O `fetch` ficou em `shared/api`, e não na feature, para a sessão
  (cookie, `X-Requested-With`, renovação no 401) ter um dono só.
- As caixas de marcar da proposta não ficam num `<form>`: nos navegadores, Enter com o foco numa
  caixa envia o formulário, e todas as mudanças, que nascem marcadas, seriam aplicadas sem a
  pessoa pedir. Achado da revisão de segurança do passo 7.4.
- Aplicar uma proposta muda o card, e a feature `card-interview` não conhece as chaves de cache
  da feature `card`: é o mesmo caso da mudança de membro na organização, resolvido do mesmo jeito,
  com o cache inteiro invalidado. A alternativa, `card` exportar as chaves, abriria a public API
  dela para ação de outra feature.
- "Iniciar entrevista" já pede a primeira rodada, no mesmo clique (resposta 64 do roadmap). O
  pedido da rodada mora em `CardInterviews`, dona do botão, e desce até a condução: o clique
  precisa ser dono do stream antes de a condução existir. A alternativa, pedir a rodada num efeito
  ao montar a condução da entrevista nova, seria abortada pelo `StrictMode` no desenvolvimento
  (que desmonta e remonta) e pediria de novo a cada remontagem.
- O painel entra na tela do card pela página, como elemento entregue ao `CardDetail`: assim
  `card` não importa de `card-interview`, e a direção das dependências continua uma só.

## INVARIANTES

- INV-1: Corpo e resposta recomendada de pergunta, resposta da pessoa, resumo e valor proposto de
  uma proposta só aparecem pelo `MarkdownContent` com `showsLinkDestination`; o título da pergunta
  aparece como texto do React.
- INV-2: O texto dos eventos `delta` não aparece na tela: enquanto a rodada é gerada, o painel
  mostra a espera "A IA está escrevendo a rodada…", sem nenhum texto do stream.
- INV-3: `askCardInterviewRound` só devolve rodada no evento `round`; no evento `error` rejeita
  com os erros do Core, e o stream que acaba sem um dos dois é falha.
- INV-4: `askCardInterviewRound` descarta os eventos `delta`: não guarda o texto deles nem o
  entrega a quem chama.
- INV-5: Nenhum pedido de rodada nem de proposta é repetido sem um clique da pessoa: os hooks da
  feature não têm nova tentativa.
- INV-6: Enquanto um pedido de rodada ou de proposta corre, o hook recusa o seguinte antes de
  chamar a API.
- INV-7: Desmontar `CardInterviews` aborta o stream da rodada em andamento; o
  `useCardInterviewRound` da tela é um só, criado nela e entregue à condução.
- INV-8: O stream da rodada sai por `postEventStream`, de `shared/api`; a feature não chama
  `fetch` nem lê o corpo da resposta.
- INV-9: A proposta só é aplicada pelo clique em "Aplicar e encerrar" ou "Aplicar e continuar" de
  `CardInterviewProposalDecision`, com os campos marcados nele, e só o primeiro manda
  `close_interview` verdadeiro; as caixas não ficam dentro de um `<form>`. Descartar a proposta e encerrar a entrevista só chamam a API pelo `onConfirm` de um
  `ConfirmButton`.
- INV-10: Decidir uma proposta, com sucesso ou com erro, invalida o cache inteiro; as outras
  mutations da entrevista invalidam `cardInterviewKeys.all`.
- INV-11: Iniciar só aparece por `canStartInterview`; responder, pedir rodada, pedir e decidir
  proposta, por `canConductInterview`; encerrar, por `canCloseInterview`. Nenhum componente compara
  o estado da entrevista, quem a iniciou ou papel direto.
- INV-12: A primeira rodada e a nova tentativa vão com o corpo `{}`; as respostas vão com o número
  da pergunta a partir de 1, e só as preenchidas.
- INV-13: `src/features/card` não importa de `src/features/card-interview`; o painel chega ao
  `CardDetail` por `renderInterviews`, entregue pela página.
- INV-14: O `index.ts` da feature exporta só `CardInterviews`.
- INV-15: A proposta só é pedida sem o clique em "Pedir proposta de mudança" quando a rodada pedida
  nesta tela chega sem pergunta e a entrevista já tem resposta (`shouldRequestProposal`); abrir ou
  recarregar a tela nunca pede proposta.
- INV-16: Iniciar pede a primeira rodada uma vez, no `onSuccess` do início em
  `useStartCardInterview`, pelo mesmo `useCardInterviewRound` da condução; o início recusado não
  pede rodada, e nenhum efeito pede rodada.

## LIMITACOES

- Na modal do card e na página, a entrevista é a guia "Entrevista com IA", que fica montada depois
  de visitada (`Tabs` de `shared/ui`): trocar de guia não aborta a rodada, mas fechar a modal ou
  trocar de card desmonta o painel e aborta (INV-7).
- A espera da rodada não mostra progresso: a tela só sabe que a IA terminou no evento `round` ou
  `error`.
- Sair só da condução, com a tela do card aberta (a entrevista encerrada por outra pessoa e
  relida, ou a permissão retirada), não aborta o stream: ele segue até o Core responder.
- A falha da rodada é uma só por tela do card, e não por entrevista: se a mesma pessoa inicia
  outra entrevista fora desta tela (outra aba), a condução da nova mostra a falha da anterior até
  o próximo pedido; depois de `InterviewRoundAttemptsExhausted`, só recarregar a tela traz o botão.
- Quem só lê não vê a conversa mudar sozinha: as consultas valem 30 segundos e são refeitas ao
  voltar o foco para a aba.
- A falha de uma rodada vive no estado da tela. Recarregar a página depois de
  `InterviewRoundAttemptsExhausted` traz de volta o botão de pedir a rodada, e o Core recusa de
  novo.
- A tela só descobre que a proposta venceu ao tentar aplicar: o contrato não traz a versão do card
  de quando ela foi gerada.
- Quantas tentativas e quantos pedidos de proposta restam não aparece: o contrato não traz.
- Recarregar ou fechar a tela no meio do pedido de proposta perde a espera; o pedido conta entre
  os dez da entrevista.
- Cancelar a rodada não devolve o custo da tentativa (regra do Core); a tela avisa, não impede.
- Das propostas já decididas a tela mostra o resumo e os campos aplicados, não o texto de cada
  mudança.
- O erro que chega pelo evento `error` não tem status HTTP: vira `ApiError` com `status` nulo, e a
  tela reage pelo `code`.
- O destino mostrado ao lado do link é o endereço que o navegador abre, sem usuário e senha; link
  da mesma origem mostra só o caminho. Quem lê ainda precisa conferir o domínio.
- As mudanças da proposta nascem todas marcadas: quem aplica sem ler aplica tudo.

## OBJETIVOS

- Nenhum texto do modelo chega ao DOM sem passar pelo sanitizador ou pelo escape do React.
- Nenhuma chamada paga e nenhuma mudança no card sem um clique de quem conduz a entrevista.

## NAO_OBJETIVOS

- Substituir a validação do Core: quem conduz, os limites e o que encerra o quê são de lá.
- Conversa livre com a IA.
- Atualização em tempo real para quem só lê.

## VERIFICACAO

- `npx vitest run src/features/card-interview src/shared/api/event-stream.test.ts`
- `rg -n "dangerouslySetInnerHTML" src --glob '!**/*.test.*'` só devolve
  `src/shared/ui/markdown-content.tsx` (INV-1, INV-2).
- `rg -n "<MarkdownContent" -A4 src/features/card-interview/ui --glob '!**/*.test.*'` mostra
  `showsLinkDestination` em todo uso; em `card-interview-proposal-changes.tsx` ele vem de quem
  chama, ligado no valor "Proposta da IA" e desligado no "Atual no card", que é texto do card
  (INV-1).
- `rg -n "delta|partialText" src/features/card-interview --glob '!**/*.test.*'` não devolve
  nada (INV-2, INV-4).
- `rg -n "useCardInterviewRound\(" src/features/card-interview/ui` só devolve
  `card-interviews.tsx` (INV-7).
- `rg -n "useEffect" src/features/card-interview --glob '!**/*.test.*'` só devolve o aborto ao
  desmontar, em `use-card-interview-round.ts` (INV-7, INV-16).
- `rg -n "askRound\(|\.ask\(" src/features/card-interview --glob '!**/*.test.*'` mostra o
  `onSuccess` de `use-start-card-interview.ts` e o `askRound` de `card-interview-conduct.tsx`
  (INV-16).
- `rg -n "\bfetch\(|getReader" src/features --glob '!**/*.test.*'` não devolve nada (INV-8).
- `rg -n "retry|setTimeout|setInterval" src/features/card-interview --glob '!**/*.test.*'` não
  devolve nada (INV-5).
- `rg -n "closeInterview\(|discard\b" src/features/card-interview/ui --glob '!**/*.test.*'` só
  mostra `onConfirm` de `ConfirmButton` e a leitura do hook (INV-9).
- `rg -n "<form|apply\(" src/features/card-interview/ui/card-interview-proposal-decision.tsx` não
  mostra `<form`, e mostra `apply(true)` e `apply(false)` só no `onClick` dos dois botões (INV-9).
- `rg -n "onFinished|shouldRequestProposal" src/features/card-interview --glob '!**/*.test.*'`
  mostra o pedido só em `askRound`, de `card-interview-conduct.tsx` (INV-15).
- `rg -n "invalidateQueries" src/features/card-interview/api/card-interview.mutations.ts` mostra uma
  invalidação por `cardInterviewKeys.all` e uma do cache inteiro, a da decisão (INV-10).
- `rg -n "interview\.status|startedBy\?\.userId" src/features/card-interview --glob '!**/*.test.*'`
  só devolve `card-interview-access.ts` (INV-11).
- `rg -n "card-interview" src/features/card` não devolve nada (INV-13).
- `cat src/features/card-interview/index.ts` tem uma linha de export (INV-14).
