---
paths:
  - "src/shared/**"
  - "src/widgets/**"
  - "src/index.css"
---

# `shared/` e `widgets/`

`shared/` não conhece o glossário: botão, campo, modal, client HTTP, utilitário puro. `widgets/`
conhece o domínio e só nasce no segundo uso. Se um componente de `shared/ui` passa a conhecer
domínio, ele não é mais shared: mova-o.

| Pasta | Conteúdo |
| --- | --- |
| `shared/ui/` | Componentes sem domínio, single-file. |
| `shared/lib/` | Funções puras: datas, formatação, classes (`cn`). |
| `shared/api/` | Client HTTP, erro tipado, `query-config`, tipos gerados em `generated/`. |
| `shared/config/` | Leitura das variáveis `VITE_*`, validada na subida. |
| `shared/types/` | Tipos utilitários sem domínio. |

## Inventário — consulte antes de criar

| Item | Cobre |
| --- | --- |
| `api` — `shared/api/client.ts` | Client Axios da API do Core: mesma origem, cookie de sessão, `X-Requested-With`, timeout de 15 s e erro convertido em `ApiError`. Cancelamento passa intacto. No 401 de rota protegida, renova a sessão uma vez e repete a requisição. |
| `session` — `shared/api/client.ts`, `createSession` — `shared/api/session.ts` | A sessão do client: `open` (login), `close` (logout), `listen` (o `app/` registra o que fazer quando ela abre ou acaba, e recebe o motivo do fim: `signed-out` ou `expired`) e a renovação compartilhada entre requisições simultâneas. `renewAfter` renova para quem recebeu 401 fora do Axios e, se a renovação é recusada, devolve esse 401. |
| `postEventStream`, `ServerSentEvent` — `shared/api/event-stream.ts` | `POST` cuja resposta é `text/event-stream`, lido com `fetch` em pedaços: entrega cada evento como `{ event, data }`, com o cookie de sessão, o `X-Requested-With` (`REQUESTED_WITH_HEADER`, de `client.ts`), renovação no 401 com uma repetição, cancelamento pelo `AbortSignal` e erro convertido em `ApiError`. Não sabe o que os eventos significam. |
| `ApiError`, `toApiError`, `getApiErrorMessage`, `isTransientFailure` — `shared/api/api-error.ts` | Erro tipado lido do `ApiProblemDetails` (camelCase, `hasCode`), mais falha de rede, tempo esgotado e resposta fora do formato do Core, todos com mensagem em português. |
| `fromResponse`, `fromErrorList`, `networkFailure` — `shared/api/api-error.ts` | `ApiError` para quem não passa pelo Axios: a partir do status e do corpo de uma resposta recusada, a partir de uma lista `errors` do Core que veio fora de uma resposta de erro (evento de stream, com `status` nulo) e a falha de conexão. |
| `describeApiFailure` — `shared/api/describe-api-failure.ts` | Texto de um erro para um aviso fixo na tela: a mensagem do Core e, quando vem `metadata.retryAfterSeconds`, "Disponível de novo em …". |
| `hasErrorCode`, `hasErrorStatus`, `getRetryAfterSeconds` — `shared/api/api-error.ts` | Perguntas sobre um erro qualquer, sem conversão na feature: tem este `code`, tem este status (para o 429 do Kong, que não tem `code`), e os segundos de espera de `metadata.retryAfterSeconds`. |
| `applyApiErrors` — `shared/api/apply-api-errors.ts` | Erro do Core num formulário RHF: com `property`, vai para o campo; sem, vira toast. Aceita um mapa de `property` para o nome do campo, quando os dois diferem, ou para `root.<nome>`, quando a `property` não tem campo próprio. |
| `toastApiError` — `shared/api/toast-api-error.ts` | Erro de uma ação fora de formulário (botão, seletor de linha): toast com a mensagem do Core, ou a mensagem em português da falha técnica. |
| `fillPath` — `shared/api/fill-path.ts` | Monta o caminho de uma rota com parâmetro (`/api/v1/projects/{projectId}/members`): o molde tem de existir no contrato e todo parâmetro é exigido pelo tipo e escapado. |
| `putOrDelete` — `shared/api/put-or-delete.ts` | Para o par de rotas em que `PUT` define um valor e `DELETE` o tira, no mesmo caminho: com corpo, `PUT`; com `null`, `DELETE`. |
| `createQueryClient`, `shouldRetryQuery` — `shared/api/query-config.ts` | QueryClient com `staleTime` de 30 s e retry só de falha transitória (rede, tempo esgotado, 5xx), até duas vezes. |
| `paths`, `components` — `shared/api/generated/openapi.d.ts` | Tipos do contrato do Core, gerados por `npm run api:types`; nunca editados à mão. |
| `cn` — `shared/lib/cn.ts` | Junta classes condicionais (clsx) e resolve conflito do Tailwind (tailwind-merge) a favor da última. |
| `zodResolver` — `shared/lib/zod-resolver.ts` | Liga um schema Zod ao React Hook Form: o primeiro erro de cada campo, e erro sem campo em `root`. Existe porque `@hookform/resolvers` não está instalado. |
| `personNameSchema`, `emailSchema`, `newPasswordSchema` — `shared/lib/field-schemas.ts` | Regras de campo iguais às do Core: nome de pessoa (até 120, sem quebra de linha nem `< > " / \ : @`), e-mail e senha nova (10 a 128), com mensagens em português. |
| `formatCount` — `shared/lib/format-count.ts` | Quantidade com o substantivo no singular ou no plural (`1 card`, `3 cards`), para substantivo que faz o plural com `s`. |
| `formatWaitTime` — `shared/lib/format-wait-time.ts` | Segundos de espera em texto para a tela, na maior unidade que couber: segundos, minutos, horas ou dias. |
| `formatDate` — `shared/lib/format-date.ts` | Data ISO da API em `dd/mm/aaaa`, no fuso de quem lê. |
| `copyText` — `shared/lib/copy-text.ts` | Copia um texto para a área de transferência e diz se deu certo, sem lançar quando o navegador recusa ou não a tem. |
| `WITHOUT_ASSIGNEE_SEARCH`, `toAssigneeSearch`, `fromAssigneeSearch` — `shared/lib/assignee-search.ts` | O `responsavel` da URL da lista de cards e do board: o id da pessoa ou `nenhum` para "Sem responsável", de e para `assigneeId` e `isUnassigned`. |
| `downloadTextFile` — `shared/lib/download-text-file.ts` | Baixa um texto como arquivo, com o nome dado e o tipo (markdown por padrão), e libera o endereço temporário. |
| `formatDay` — `shared/lib/format-date.ts` | Dia sem hora da API (`2026-10-20`, como o prazo do spike) em `dd/mm/aaaa`, sem deslocar pelo fuso de quem lê. |
| `Button` — `shared/ui/button.tsx` | Botão com `variant` (`primary`, `secondary`, `ghost`, `danger`), `size` (`sm`, 32 px; `md`, 36 px, a altura dos campos) e `isLoading` (spinner, desabilitado, `aria-busy`); `type="button"` por padrão, sem quebrar linha nem encolher. O ícone filho (`<Plus aria-hidden />`) sai com 16 px sem classe. |
| `ButtonLink` — `shared/ui/button-link.tsx` | Link do router (`createLink`, `to` e `params` tipados) com a cara do `Button`: mesmos `variant` e `size`. Para a ação de cabeçalho que leva a outra tela ("Novo card", "Editar"). |
| `buttonClassName`, `ButtonStyle` — `shared/ui/button-styles.ts` | As classes do botão por `variant`, `size` e `className`, a fonte única de `Button` e `ButtonLink`. |
| `TextField` — `shared/ui/text-field.tsx` | Campo de texto (36 px, `px-3`, `text-base`) com rótulo, `hint` e `error` ligados por `aria-describedby` e `aria-invalid`; recebe o `register` do RHF por spread, `inputClassName` ajusta só o input e `isLabelHidden` deixa o rótulo só para leitor de tela (com `placeholder` à vista). |
| `TextAreaField` — `shared/ui/text-area-field.tsx` | Campo de texto de várias linhas, com o mesmo rótulo, `hint` e `error` do `TextField`; recebe o `register` do RHF por spread, e `rows` diz a altura inicial. |
| `SearchField` — `shared/ui/search-field.tsx` | Campo de busca (`type="search"`) com o rótulo e a dica do `TextField`: entrega o texto digitado em `onSearch` depois de 300 ms sem digitar, e na hora com Enter, que não envia o formulário em volta. Não guarda o texto nem apara: quem chama decide o que fazer com ele. |
| `SelectField`, `SelectOption` — `shared/ui/select-field.tsx` | Seletor nativo com rótulo e `error`, para opções `{ value, label }`, com a seta própria (`ChevronDown`, `appearance-none`) e pelo menos 160 px de largura. Em formulário recebe o `register` do RHF por spread; numa linha de lista usa `value` com `onValueChange`, que devolve o valor já no tipo da opção. `isLabelHidden` deixa o rótulo só para leitor de tela; `isLabelInline` põe o rótulo ao lado, para barra de ferramentas e de filtros; `variant="quiet"` é o seletor que parece texto, sem borda e do tamanho da opção escolhida (o estado no cartão do board). |
| `CheckboxGroupField` — `shared/ui/checkbox-group-field.tsx` | Lista de valores num formulário: `fieldset` com rótulo, uma caixa de marcar por opção `{ value, label }`, `emptyText` quando não há opção e `error`; a lista rola quando é longa. Recebe o `register` do RHF por spread, e o valor do campo é a lista do que está marcado (o valor inicial tem de ser uma lista). Cada caixa é um `CheckboxField`. |
| `CheckboxField` — `shared/ui/checkbox-field.tsx` | Caixa de marcar avulsa, com o rótulo ao lado. Numa linha de lista usa `checked` com `onChange`; num formulário recebe o `register` do RHF por spread, e caixas com o mesmo nome viram a lista do que está marcado. Caixa registrada no RHF não leva `disabled`: ele a ignoraria. |
| `Panel` — `shared/ui/panel.tsx` | Cartão de uma tela de formulário: título, descrição, corpo e rodapé de links. |
| `Notice` — `shared/ui/notice.tsx` | Aviso dentro da tela, com `tone` (`info`, `success`, `danger`). |
| `LoadingState` — `shared/ui/loading-state.tsx` | Estado de carregamento com rótulo. |
| `TextLink` — `shared/ui/text-link.tsx` | Link de texto do router (`createLink`), com `to` e `search` tipados. |
| `SideNavLink` — `shared/ui/side-nav-link.tsx` | Item da navegação lateral (`createLink`): ícone e rótulo, com a página atual em `surface-raised` e o ícone no accent, pelo `aria-current` que o router põe; `activeOptions={{ exact: true }}` quando o caminho é prefixo dos outros. O rótulo não quebra linha e é cortado pelo próprio item (`overflow-hidden`): na navegação recolhida o item vira um quadrado só com o ícone, e o rótulo continua sendo o nome do link. |
| `TabLink` — `shared/ui/tab-link.tsx` | Aba de seção (`createLink`), o pivô do Azure DevOps: a atual sublinhada no accent. Fica numa `nav` com `border-b border-line`. |
| `Brand` — `shared/ui/brand.tsx` | A marca: a lua crescente e o nome Momentum. |
| `Avatar` — `shared/ui/avatar.tsx` | Círculo com as iniciais do primeiro e do último nome, fora da leitura de tela: o nome aparece ao lado. |
| `Badge`, `BadgeTone` — `shared/ui/badge.tsx` | Pílula com um ponto e o texto, no `tone` (`neutral`, `accent`, `info`, `success`, `warning`, `danger`): estado, prioridade, "Arquivado". O tom de cada valor do domínio é decidido na feature. |
| `ThemeToggle` — `shared/ui/theme-toggle.tsx` | Botão de ícone que troca entre o tema claro e o escuro; recebe o tema atual e `onToggle`. |
| `ValueReporter` — `shared/ui/value-reporter.tsx` | Não desenha nada: chama `onReport` com o `value` ao aparecer e a cada mudança. Serve para uma página contar ao `app` um dado que só ela carrega (o projeto do card aberto), sem o `app` conhecer a feature. `onReport` precisa ser estável, como a action de um store. |
| `Modal` — `shared/ui/modal.tsx` | Diálogo do Radix, controlado (`open`, `onOpenChange`), com título, descrição opcional, corpo e `footer` de ações; fecha no X, no Esc e no clique fora. `size` `md` (padrão) ou `lg`, para conteúdo largo como o subitem aberto. |
| `ConfirmButton` — `shared/ui/confirm-button.tsx` | Botão de ação destrutiva: o clique abre o `ConfirmDialog` com a pergunta e a consequência, e a ação (`onConfirm`) só roda no botão de confirmar, que fica ocupado até ela terminar. O `onConfirm` trata o próprio erro. |
| `useConfirmation` — `shared/ui/use-confirmation.ts` | O estado de um pedido de confirmação com ação assíncrona: `open`, `cancel`, `confirm` (roda a ação, fica ocupado e fecha no fim, com sucesso ou erro), `isOpen` e `isConfirming`. É o que o `ConfirmButton` usa; use direto quando quem abre a confirmação não é um botão (um item de menu). |
| `ActionMenu`, `ActionMenuItem` — `shared/ui/action-menu.tsx` | Menu de três pontos para as ações secundárias de uma tela: botão com `aria-label`, itens `{ label, icon, isDestructive, onSelect }` com `role="menuitem"`; abre com o foco no primeiro item, anda com as setas, fecha no Esc, no Tab, no clique fora e ao escolher, devolvendo o foco ao botão. Sem dependência: o Radix instalado é só o do diálogo. |
| `ConfirmDialog` — `shared/ui/confirm-dialog.tsx` | Pedido de confirmação controlado (`open`), para quando quem pergunta não é um botão (a escolha num seletor, o soltar de um arrasto): pergunta, consequência, "Voltar" e o botão de confirmar; `isDestructive` o pinta de perigo e `isConfirming` o deixa ocupado. Fechar no X, no Esc ou no clique fora chama `onCancel`. |
| `EmptyState` — `shared/ui/empty-state.tsx` | Estado vazio ou de erro: ícone, título, descrição e uma ação. |
| `QueryContent` — `shared/ui/query-content.tsx` | Os três estados de uma query do TanStack: carregando (`LoadingState`), erro com "Tentar de novo" (`EmptyState` com a mensagem do Core) e o conteúdo, numa função que recebe o dado. O vazio é de quem chama. |
| `Section` — `shared/ui/section.tsx` | Seção de uma tela autenticada: título em `h2` (texto ou um nó, como um link), descrição, ações à direita (que não encolhem) e corpo. |
| `Screen` — `shared/ui/screen.tsx` | Tela da área autenticada fora de `/organizacao`: link de volta, sobretítulo (`eyebrow`), título em `h1`, uma linha embaixo dele (`meta`, como o estado e o responsável do card), ações à direita (que não encolhem) e corpo, na largura de leitura; `isWide` usa a largura toda da área de conteúdo, para lista em tabela, board, hierarquia, grade de projetos e detalhe com painel lateral. As seções de dentro usam `Section`. |
| `Pagination` — `shared/ui/pagination.tsx` | Navegação de uma lista paginada: "Página N de M", com "Anterior" e "Próxima" travados nas pontas; quem chama decide se a mostra. |
| `Toaster` — `shared/ui/toaster.tsx` | Sonner no vidro forte e com as cores dos tokens, no `theme` que o `app` passa; montado uma vez em `app/app.tsx`; dispare com `toast` de `sonner`. |
| `MarkdownContent` — `shared/ui/markdown-content.tsx` | Único lugar que mostra texto de terceiros: markdown (marked) sanitizado (DOMPurify), com o estilo da classe `markdown-content` de `src/index.css`. `showsLinkDestination` põe o destino de cada link à vista, ao lado do texto dele: use no texto do modelo. |
| `MarkdownSection` — `shared/ui/markdown-section.tsx` | `Section` cujo corpo é um texto de terceiros pelo `MarkdownContent`; com o texto vazio, mostra `emptyText` no lugar. |

Ao criar um componente em `shared/ui`, um utilitário em `shared/lib` ou um widget, registre-o nesta
tabela na mesma entrega: é este inventário que o próximo agente consulta antes de criar. Se algo
cobre ~80% do caso, estenda em vez de criar.

## Conteúdo não confiável

Descrição de card, chamado do Movidesk (que traz HTML) e resposta da IA são escritos por terceiros.

- Só aparecem pelo renderizador de markdown sanitizado, `MarkdownContent` em
  `src/shared/ui/markdown-content.tsx`, que remove script, handler de evento, `iframe`, `style`,
  `form`, `dialog`, SVG e URL `javascript:` ou `data:` em link, e abre link externo em outra aba
  com `rel="noopener noreferrer"`.
- O texto não carrega nada de outro site (`src`, `srcset`, `poster` e `background` saem): uma
  imagem na resposta da IA vazaria o contexto na URL, e uma no chamado rastrearia quem o lê. Também
  não escolhe estilo nem camada (`class`, `popover`), para não cobrir a tela com interface falsa.
- `dangerouslySetInnerHTML` existe só dentro desse componente; `ai/scripts/check-diff-rules.sh`
  barra qualquer outro uso.
- Imagem de chamado só volta a aparecer pelo proxy que o Core expuser (Fase 9), liberado no hook do
  `MarkdownContent` só para o prefixo dele.

## Design

- Tailwind 4, com os tokens em `@theme` no `src/index.css`. Cor, espaçamento e raio vêm dos
  tokens — a paleta padrão do Tailwind foi removida —; valor arbitrário (`bg-[#123456]`) só com o
  motivo no `DESIGN.md`.
- Superfície de vidro só pelas utilidades de `src/index.css`: `panel` (painel de conteúdo, lista),
  `glass`, `glass-strong` (modal, toast) e `glass-control` (campo, botão secundário). Nada de
  `backdrop-blur` ou degradê escrito no componente.
- A direção visual está no `DESIGN.md` da raiz: tokens semânticos, tipografia, componentes de base
  e proibições. Leia antes de criar ou mudar UI.
- Acessibilidade: elemento interativo é `button` ou `a`, com rótulo; foco visível; contraste dos
  tokens conferido nos dois temas, o claro e o escuro.

## Limites

- Utilitário de `shared/lib` é puro: sem React, sem I/O.
- Widget é arquivo único; vira pasta só com subcomponentes ou `logic.ts`.
