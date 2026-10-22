# Design

Direção visual do Momentum.Web, decidida pelo usuário para o beta em 2026-10-22 (D-07 e ADR 0008
do Core, `../Momentum.Core/docs/adr/0008-board-como-tela-principal-e-card-em-modal.md`): o
acabamento do Linear e do YouTrack, o design system e a paleta do Megabrain e o comportamento do
Azure DevOps (VSTS). Substitui a de 2026-10-19 (identidade do Megabrain.Web em índigo sobre a
estrutura do Azure DevOps), que por sua vez substituiu a de 2026-10-03 (pergunta 6 do roadmap).
Os tokens moram em `@theme static` de `src/index.css`; os componentes de base, em `src/shared/ui`,
com o inventário em `.claude/rules/shared-ui.md`.

## Identidade

- **Ícone:** lua crescente — `Moon` do lucide-react na interface e `public/favicon.svg` no
  navegador.
- **Versão de lançamento:** v1.0.0, "Las Noches".
- **Lane:** a paleta do Megabrain — coral no matiz 28 sobre neutros quentes, superfícies de vidro,
  brilho coral discreto no fundo escuro — com o acabamento enxuto do Linear e do YouTrack (ação
  principal neutra e escura, coral só para seleção e foco, pouca borda), sobre o comportamento do
  Azure DevOps: o board como tela principal, o card aberto numa modal com guias, menu de três
  pontos no cartão e no board, a cor do tipo na borda do card. Denso como uma ferramenta de
  trabalho: o card é o destaque, a interface recua.

## Estrutura

- **Barra superior** (`app/layouts/top-bar.tsx`): recolher a navegação, a marca, o caminho
  organização › projeto, o tema, a pessoa e "Sair". No celular, com projeto no caminho, a
  organização sai do caminho.
- **Navegação lateral** (`app/layouts/side-nav.tsx`), presa à borda: Projetos; o projeto atual com
  Boards, Features e epics e Lista de cards, nessa ordem, porque o board é a tela principal; no pé, Configurações do projeto e Organização. Recolhida, mostra
  só os ícones; abaixo de `lg`, fica sempre recolhida. O projeto atual vem da rota ou, nas telas de
  card, feature e epic, do que a tela informa (`ValueReporter`). Os ícones e a chave do projeto
  ficam numa coluna de 32 px centrada em 24 px da borda, a mesma do botão de recolher da barra
  superior, aberta ou recolhida: recolher só corta os rótulos (`overflow-hidden`, sem quebrar
  linha), e nada muda de lugar na transição. Recolhido, cada item é um quadrado com `title`.
- **Telas de trabalho** (board, lista de cards, hierarquia, detalhe do card) usam a largura toda da
  área de conteúdo (`Screen` com `isWide`); formulários e telas de texto (feature, epic) ficam na
  largura de leitura. Os hubs que a navegação lateral alcança não têm link "Voltar"; o detalhe e os
  formulários têm.
- **Cabeçalho da tela:** título à esquerda e a ação principal à direita, como botão com ícone
  (`Plus` em "Novo card", "Novo board", "Novo epic", "Novo projeto"; `Pencil` em "Editar"). Link
  que leva a outra tela com cara de botão é `ButtonLink`.
- **Barra de ferramentas e filtros:** uma linha que quebra, com o rótulo ao lado do seletor
  (`SelectField` com `isLabelInline`) e as ações à direita, de ícone e fantasma, sobre uma
  divisória.
- **Abas** de seção (pivôs do Azure DevOps): `TabLink` quando cada aba é uma rota, `Tabs` quando são
  guias dentro de uma tela (o card aberto, a tela de features e epics); sublinhado no accent, sem
  fundo, e a contagem numa pílula discreta. As guias visitadas ficam montadas, só escondidas.
- **Lista** de muitos itens com colunas é tabela dentro de `panel`, com rolagem horizontal própria;
  coluna secundária some abaixo de `xl`. A linha inteira é clicável: o link do título se estica
  sobre ela (`after:absolute after:inset-0`, a linha `relative`), e continua sendo o único link da
  linha para o leitor de tela.
- **Card aberto** (o work item do VSTS): modal larga (`Modal` `size="xl"`), presa ao topo, com o
  identificador em cima do título, o estado, o responsável e a prioridade embaixo dele, e à
  direita "Editar", o menu de três pontos ("Abrir em página inteira") e o X. O conteúdo vem em
  guias: Detalhes, Relações, Anexos, Entrevista com IA e Briefing. Abre sobre o board e a lista,
  pelo `?card=` da URL; a página própria do card mostra as mesmas guias.
- **Detalhes** de item com propriedades: conteúdo à esquerda, propriedades num painel à direita
  (`lg:grid-cols-[minmax(0,1fr)_20rem]`), empilhado no celular.
- **Board:** as colunas esticam até preencher a largura (`min-w-64 flex-1`) e rolam na horizontal
  quando não cabem. O cabeçalho da coluna tem o nome, a contagem numa pílula discreta e um traço
  de 2 px em cima, no tom da categoria do estado; a coluna é uma zona rebaixada
  (`bg-well`). O cartão é vidro com a borda esquerda na cor do tipo: identificador e
  tipo, a prioridade só quando alta ou urgente, o título como link, as tasks concluídas (quando
  há) e, no rodapé, o avatar e o nome do responsável (ou "Sem responsável") e o seletor de estado
  discreto (`SelectField` `variant="quiet"`). O topo do cartão tem o menu de três pontos, com
  "Adicionar task", "Adicionar bug" e "Adicionar impedimento". "Novo card" fica no topo da primeira
  coluna, como o "New item" do Azure DevOps; o menu de três pontos da barra do board leva a editar
  o board, editar as colunas, o acesso ao board e excluir, e o selo "Acesso restrito" aparece ao
  lado dele quando o board é só das pessoas escolhidas.
- **Board de features e de epics:** o mesmo desenho de colunas (`BoardColumn`), uma por estado
  derivado (a fazer, em andamento, concluída), com cartões de vidro que trazem o título, a barra de
  progresso e a contagem de cards; sem arrastar, porque o estado é derivado.
- **Anexos:** zona de soltar com o botão "Escolher arquivos" (`FileDropZone`), barra de progresso
  durante o envio e a lista com nome, tamanho, quem enviou e as ações Visualizar (só imagem),
  Baixar e Excluir.

## Tema

Claro por padrão e escuro opcional, pelo botão da barra superior. Os tokens são semânticos — dizem
o papel, não a cor —, e o componente só usa o papel (`bg-surface`, `text-ink-muted`,
`border-line`). O claro mora em `@theme static`; o escuro, em `html[data-theme="dark"]`, que
redefine os mesmos `--color-*`. Por isso `dark:` não aparece em componente.

A escolha fica na store `preferences` (`app/stores`), persistida no `localStorage` com a chave
`momentum-preferences`, junto com a navegação recolhida. O `App` aplica o `data-theme` no `<html>`,
e um script em `index.html` aplica o escuro antes do primeiro desenho, para a tela não piscar
clara. Uma CSP futura precisa do hash desse script.

## Cor

Tokens em OKLCH, com a paleta padrão do Tailwind removida (`--color-*: initial`): `bg-zinc-900`
não existe. Neutros quentes, puxados para o coral do Megabrain (matiz 28).

| Token | Claro | Escuro | Papel |
| --- | --- | --- | --- |
| `canvas` | `oklch(0.95 0.004 28)` | `oklch(0.105 0.005 28)` | Fundo da aplicação |
| `canvas-deep` | `oklch(0.925 0.006 28)` | `oklch(0.075 0.004 28)` | Fim do degradê do fundo |
| `well` | `oklch(0.915 0.008 28)` | `oklch(0.135 0.007 28)` | Zona rebaixada (coluna do board): mais escura que o fundo no claro, mais clara no escuro |
| `surface` | `oklch(0.985 0.003 28)` | `oklch(0.155 0.008 28)` | Superfície opaca |
| `surface-raised` | `oklch(0.915 0.008 28)` | `oklch(0.205 0.01 28)` | Hover, item ativo, opção escolhida, badge neutro |
| `line` | `oklch(0.85 0.01 28)` | `oklch(0.25 0.01 28)` | Divisória |
| `line-strong` | `oklch(0.6 0.012 28)` | `oklch(0.53 0.012 28)` | Borda de campo e de controle |
| `ink` | `oklch(0.2 0.009 28)` | `oklch(0.93 0.006 28)` | Texto principal |
| `ink-muted` | `oklch(0.4 0.01 28)` | `oklch(0.75 0.008 28)` | Texto secundário |
| `ink-subtle` | `oklch(0.47 0.01 28)` | `oklch(0.63 0.008 28)` | Metadado, placeholder |
| `action` | `oklch(0.28 0.012 28)` | `oklch(0.32 0.012 28)` | Preenchimento da ação primária |
| `action-hover` | `oklch(0.34 0.014 28)` | `oklch(0.39 0.014 28)` | Hover da ação primária |
| `action-ink` | `oklch(0.97 0.004 28)` | `oklch(0.95 0.005 28)` | Texto sobre `action` |
| `accent` | `oklch(0.48 0.18 28)` | `oklch(0.57 0.18 28)` | Traço da aba ativa |
| `accent-text` | `oklch(0.43 0.17 28)` | `oklch(0.76 0.14 28)` | Link, anel de foco, aba e ícone ativos, borda da opção escolhida |
| `accent-soft` | `oklch(0.91 0.045 28)` | `oklch(0.245 0.065 28)` | Fundo de avatar, chave do projeto, badge, zona de soltar ativa |
| `danger`, `success`, `warning`, `info` | tons 0.42–0.48 | tons 0.7–0.83 | Texto e ícone de estado |
| `*-soft` dos quatro | tons 0.93–0.94 | tons 0.27–0.29 | Fundo de badge e de aviso |
| `type-user-story`, `type-spike`, `type-issue`, `type-tech-debt` | tons 0.55–0.58 | tons 0.7–0.8 | Marca e borda do tipo do card |

Contraste conferido (razão WCAG, pior caso contra `canvas`, `canvas-deep`, `well`, `surface` e
`surface-raised`), recalculado em 2026-10-22 com a paleta coral:

| Par | Claro | Escuro |
| --- | --- | --- |
| `ink` | 14,1:1 | 14,6:1 |
| `ink-muted` | 7,2:1 | 8,0:1 |
| `ink-subtle` | 5,3:1 | 5,1:1 |
| `accent-text` | 6,9:1 | 7,9:1 |
| `accent` (traço, gráfico) | 5,6:1 | 3,7:1 |
| `danger`, `success`, `warning`, `info` | ≥ 5,5:1 | ≥ 6,3:1 |
| `line-strong` | 3,1:1 | 3,4:1 |
| cores de tipo (gráfico, não texto) | ≥ 3,4:1 | ≥ 6,3:1 |
| `action-ink` sobre `action` / `action-hover` | 13,4:1 / 10,8:1 | 11,0:1 / 8,3:1 |
| `accent-text` sobre `accent-soft` | 6,7:1 | 7,3:1 |
| texto do badge sobre o `*-soft` do tom | ≥ 5,8:1 | ≥ 5,4:1 |

Texto fica em 4,5:1 ou mais; borda que identifica controle e marca gráfica, em 3:1 ou mais.

**Um accent:** coral — texto no link, no foco, na aba e no item ativo da navegação, a borda da
opção escolhida e a zona de soltar ativa. A ação primária não é coral: é o `action`, neutro e
escuro, como no Linear, para que o coral marque só o que está selecionado. Nunca como decoração.

**Cor de estado só em badge.** O estado do card e a prioridade aparecem pelo `Badge`, com o tom
decidido em `features/card/model/lib/card-tones.ts` (a fazer neutro, em andamento info, feito
success, cancelado neutro; prioridade alta warning, urgente danger). A exceção é o traço do
cabeçalho da coluna do board, no mesmo tom da categoria do estado (`line-strong` no neutro), sempre
com o nome do estado embaixo, e o botão de impedimentos do cartão do board, em `danger-soft`
enquanto há impedimento em aberto, sempre com a palavra "Impedimentos" e a contagem. A cor do tipo só aparece na
marca (`CardTypeMark`) e na borda do card no board, sempre com o nome do tipo por perto.

## Vidro

Superfície de vidro, à moda do Megabrain, só pelas utilidades de `src/index.css`:

| Utilidade | Onde |
| --- | --- |
| `glass` | Barra superior, navegação lateral, card do board |
| `panel` | Painel de conteúdo: `glass` com borda `glass-line` e `rounded-lg` |
| `glass-strong` | Modal e toast, mais opacos |
| `glass-control` | Campo e botão secundário |

O fundo do `body` é um degradê de `canvas` a `canvas-deep`, com dois brilhos radiais
(`glow-primary`, `glow-secondary`) que só existem no escuro. O vidro é translúcido o bastante para
o brilho atravessar e opaco o bastante para o texto manter o contraste das superfícies.

## Tipografia

- **Inter** na interface; **JetBrains Mono** (`font-mono`) em identificador (`MOM-123`), chave de
  projeto, código e trecho técnico. As duas variáveis, servidas pelo próprio app
  (`@fontsource-variable`), sem requisição a terceiros.
- Escala fixa em rem, densa:

  | Classe | Tamanho / altura |
  | --- | --- |
  | `text-xs` | 12 / 16 px |
  | `text-sm` | 13 / 20 px |
  | `text-base` | 14 / 22 px — corpo |
  | `text-lg` | 16 / 24 px |
  | `text-xl` | 20 / 28 px |
  | `text-2xl` | 24 / 32 px — título da tela |

- Pesos: 400 no corpo, 500 em rótulo e botão, 600 em título e badge. Nada acima de 600.

## Espaço, raio e elevação

- Escala 4pt do Tailwind (`--spacing: 0.25rem`): `p-1` é 4 px, `p-2` é 8 px. `gap` em vez de
  margin entre irmãos.
- Raio: `rounded-sm` 4 px (chave do projeto), `rounded-md` 6 px (botão, campo, card do board),
  `rounded-lg` 8 px (painel, modal). `rounded-full` só em avatar, badge e indicador.
- Elevação: uma sombra, `shadow-overlay`, para modal e toast. No resto, a hierarquia vem do vidro,
  da superfície e da borda.

## Componentes

- Todo elemento interativo tem default, hover, foco visível (anel de 2 px em `accent-text`, global
  em `:focus-visible`), disabled (opacidade 50%) e, quando assíncrono, carregando.
- Ação secundária de uma tela (editar, configurar, excluir) fica no menu de três pontos
  (`ActionMenu`), como no VSTS; a ação principal continua à vista no cabeçalho.
- Campos (`TextField`, `TextAreaField`, `SelectField`) com 36 px de altura (`h-9`), `px-3` e texto
  `text-base`; rótulo `text-sm` em cima, a 6 px, e dica e erro embaixo. O `SelectField` não usa a
  seta do sistema (`appearance-none`): desenha o `ChevronDown` dentro do campo, com `pr-9`, e não
  fica mais estreito que 160 px (`min-w-40`). A variante `quiet` é o seletor que parece texto (o
  estado no cartão do board): 28 px, sem borda, do tamanho da opção escolhida
  (`field-sizing-content`, onde o navegador oferece).
- Botão `md` com 36 px, da altura dos campos, e `sm` com 32 px, para barra de ferramentas e linha
  de lista; o ícone do botão é sempre 16 px.
- **Radix só dentro de `src/shared/ui`**, embrulhado num componente nosso; o ESLint barra o import
  fora dali.
- Ícones do lucide-react, 16 px (`size-4`) na interface; ícone sozinho tem `aria-label`.
- Botão não quebra linha (`whitespace-nowrap`), e a ação do cabeçalho da tela não encolhe.
- Toast pelo Sonner, no canto inferior direito, no tema atual e com as cores dos tokens.
- Texto de terceiros (card, chamado, resposta da IA) só pelo `MarkdownContent`.

## Movimento

120 a 200 ms, `ease-out`, só para comunicar estado (hover, foco, abrir e fechar).
`prefers-reduced-motion: reduce` desliga animação e transição.

## Proibições

- Cor fora dos tokens: hex, `rgb()` ou `oklch()` em componente, e valor arbitrário
  (`bg-[#123456]`) sem motivo registrado na tabela abaixo.
- Segundo accent, ou o accent como decoração (fundo de seção, borda lateral, ícone enfeite).
- Cor de estado fora do `Badge`, do `Notice` e do traço do cabeçalho da coluna do board; cor de
  tipo fora da marca e da borda do card.
- Vidro, `backdrop-filter` ou degradê escritos no componente: só pelas utilidades acima.
- Texto com degradê; brilho ou degradê fora do fundo do `body`.
- Sombra fora do `shadow-overlay`; borda e sombra larga juntas no mesmo elemento.
- Raio acima de 8 px, fora do `rounded-full` de avatar, badge e indicador.
- `dark:` ou tema parcial em componente: o tema vem dos tokens.
- Emoji como ícone.
- Texto abaixo de 4,5:1; borda de controle abaixo de 3:1.

## Valores fora dos tokens

| Onde | Valor | Motivo |
| --- | --- | --- |
| `public/favicon.svg` | `#fd8c7e` | O favicon não lê variável CSS; é o `accent-text` do escuro em hex. |
| `index.html` (`theme-color`) | `#f1eded` | A meta tag não lê variável CSS; é o `canvas` do claro em hex. |
| `card-list-results.tsx` | `min-w-[40rem]` | Largura mínima da tabela de cards antes da rolagem horizontal. |
| `card-details-tab.tsx` | `20rem` na grade | Largura do painel de propriedades do card. |
| `attachment-preview-dialog.tsx` | `max-h-[70dvh]` | A imagem pré-visualizada cabe na modal sem rolar a página. |
| `card-type-mark.tsx`, `card-tile.tsx` | `w-[3px]`, `border-l-[3px]` | Espessura da marca do tipo, a do Azure DevOps. |
| `screen.tsx`, `organization-settings-layout.tsx` | `tracking-[-0.01em]` | Aperto do título da tela em `text-2xl`. |
| `side-nav.tsx` | `h-[calc(100dvh-3rem)]` | Altura da navegação lateral abaixo da barra superior de 3rem. |
