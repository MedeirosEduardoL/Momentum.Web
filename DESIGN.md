# Design

Direção visual do Momentum.Web: a identidade do Megabrain.Web sobre a estrutura do Azure DevOps,
decidida pelo usuário em 2026-10-19 e no lugar da direção de 2026-10-03 (pergunta 6 do roadmap do
produto, `../Momentum.Core/ai/roadmap.md`), que seguia o Linear. Os tokens moram em `@theme static`
de `src/index.css`; os componentes de base, em `src/shared/ui`, com o inventário em
`.claude/rules/shared-ui.md`.

## Identidade

- **Ícone:** lua crescente — `Moon` do lucide-react na interface e `public/favicon.svg` no
  navegador.
- **Versão de lançamento:** v1.0.0, "Las Noches".
- **Lane:** a pele do Megabrain — índigo, superfícies de vidro, brilho discreto no fundo escuro —
  sobre o esqueleto do Azure DevOps: barra superior com o caminho organização › projeto, navegação
  lateral pelos hubs do projeto, lista de cards em tabela, detalhe com as propriedades num painel à
  direita e board com colunas rebaixadas e a cor do tipo na borda do card. Denso como uma
  ferramenta de trabalho: o card é o destaque, a interface recua.

## Estrutura

- **Barra superior** (`app/layouts/top-bar.tsx`): recolher a navegação, a marca, o caminho
  organização › projeto, o tema, a pessoa e "Sair". No celular, com projeto no caminho, a
  organização sai do caminho.
- **Navegação lateral** (`app/layouts/side-nav.tsx`), presa à borda: Projetos; o projeto atual com
  Boards, Cards e Features e epics; no pé, Configurações do projeto e Organização. Recolhida, mostra
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
- **Abas** de seção (pivôs do Azure DevOps) pelo `TabLink`: sublinhado no accent, sem fundo.
- **Lista** de muitos itens com colunas é tabela dentro de `panel`, com rolagem horizontal própria;
  coluna secundária some abaixo de `xl`. A linha inteira é clicável: o link do título se estica
  sobre ela (`after:absolute after:inset-0`, a linha `relative`), e continua sendo o único link da
  linha para o leitor de tela.
- **Detalhe** de item com propriedades: conteúdo à esquerda, propriedades num painel à direita,
  preso ao rolar (`lg:grid-cols-[minmax(0,1fr)_20rem]`), empilhado no celular. Embaixo do título,
  o estado em badge, o responsável com avatar e a prioridade, quando alta ou urgente.
- **Board:** as colunas esticam até preencher a largura (`min-w-64 flex-1`) e rolam na horizontal
  quando não cabem. O cabeçalho da coluna tem o nome, a contagem numa pílula discreta e um traço
  de 2 px em cima, no tom da categoria do estado; a coluna é uma zona rebaixada
  (`bg-well`). O cartão é vidro com a borda esquerda na cor do tipo: identificador e
  tipo, a prioridade só quando alta ou urgente, o título como link, as tasks concluídas (quando
  há) e, no rodapé, o avatar e o nome do responsável (ou "Sem responsável") e o seletor de estado
  discreto (`SelectField` `variant="quiet"`). "Novo card" fica no topo da primeira coluna, como o
  "New item" do Azure DevOps.

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
não existe. Neutros frios, puxados para o índigo (matiz 275).

| Token | Claro | Escuro | Papel |
| --- | --- | --- | --- |
| `canvas` | `oklch(0.965 0.004 275)` | `oklch(0.16 0.008 275)` | Fundo da aplicação |
| `canvas-deep` | `oklch(0.94 0.006 275)` | `oklch(0.13 0.008 275)` | Fim do degradê do fundo |
| `well` | `oklch(0.935 0.006 275)` | `oklch(0.185 0.009 275)` | Zona rebaixada (coluna do board): mais escura que o fundo no claro, mais clara no escuro |
| `surface` | `oklch(0.99 0.002 275)` | `oklch(0.19 0.009 275)` | Superfície opaca |
| `surface-raised` | `oklch(0.935 0.006 275)` | `oklch(0.23 0.01 275)` | Hover, item ativo, badge neutro |
| `line` | `oklch(0.88 0.008 275)` | `oklch(0.28 0.01 275)` | Divisória |
| `line-strong` | `oklch(0.6 0.012 275)` | `oklch(0.53 0.012 275)` | Borda de campo e de controle |
| `ink` | `oklch(0.22 0.012 275)` | `oklch(0.95 0.005 275)` | Texto principal |
| `ink-muted` | `oklch(0.42 0.014 275)` | `oklch(0.77 0.01 275)` | Texto secundário |
| `ink-subtle` | `oklch(0.5 0.014 275)` | `oklch(0.63 0.012 275)` | Metadado, placeholder |
| `accent` | `oklch(0.5 0.16 282)` | `oklch(0.52 0.15 282)` | Preenchimento da ação primária |
| `accent-hover` | `oklch(0.45 0.16 282)` | `oklch(0.56 0.15 282)` | Hover da ação primária |
| `accent-ink` | `oklch(0.99 0.003 282)` | igual | Texto sobre `accent` |
| `accent-text` | `oklch(0.48 0.16 282)` | `oklch(0.78 0.11 285)` | Link, anel de foco, aba e ícone ativos |
| `accent-soft` | `oklch(0.93 0.03 282)` | `oklch(0.29 0.06 282)` | Fundo de avatar, chave do projeto, badge |
| `danger`, `success`, `warning`, `info` | tons 0.42–0.48 | tons 0.7–0.83 | Texto e ícone de estado |
| `*-soft` dos quatro | tons 0.93–0.94 | tons 0.27–0.29 | Fundo de badge e de aviso |
| `type-user-story`, `type-spike`, `type-issue`, `type-tech-debt` | tons 0.55–0.62 | tons 0.7–0.8 | Marca e borda do tipo do card |

Contraste conferido (razão WCAG, pior caso contra `canvas`, `canvas-deep`, `surface` e
`surface-raised`):

| Par | Claro | Escuro |
| --- | --- | --- |
| `ink` | 14,3:1 | 14,6:1 |
| `ink-muted` | 7,0:1 | 8,1:1 |
| `ink-subtle` | 5,0:1 | 4,8:1 |
| `accent-text` | 5,7:1 | 8,2:1 |
| `danger`, `success`, `warning`, `info` | ≥ 5,9:1 | ≥ 5,9:1 |
| `line-strong` | 3,3:1 | 3,2:1 |
| cores de tipo (gráfico, não texto) | ≥ 3,1:1 | ≥ 5,9:1 |
| `accent-ink` sobre `accent` / `accent-hover` | 6,2:1 / 7,7:1 | 5,6:1 / 4,7:1 |
| texto do badge sobre o `*-soft` do tom | ≥ 5,6:1 | ≥ 5,4:1 |

Texto fica em 4,5:1 ou mais; borda que identifica controle e marca gráfica, em 3:1 ou mais.

**Um accent:** índigo — preenchimento na ação primária, texto no link, no foco, na aba e no item
ativo da navegação. Nunca como decoração.

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
| `public/favicon.svg` | `#b0adfb` | O favicon não lê variável CSS; é o `accent-text` do escuro em hex. |
| `index.html` (`theme-color`) | `#f2f3f6` | A meta tag não lê variável CSS; é o `canvas` do claro em hex. |
| `card-list-results.tsx` | `min-w-[40rem]` | Largura mínima da tabela de cards antes da rolagem horizontal. |
| `card-detail.tsx` | `20rem` na grade | Largura do painel de propriedades do card. |
| `card-type-mark.tsx`, `card-tile.tsx` | `w-[3px]`, `border-l-[3px]` | Espessura da marca do tipo, a do Azure DevOps. |
| `screen.tsx`, `organization-settings-layout.tsx` | `tracking-[-0.01em]` | Aperto do título da tela em `text-2xl`. |
| `side-nav.tsx` | `h-[calc(100dvh-3rem)]` | Altura da navegação lateral abaixo da barra superior de 3rem. |
