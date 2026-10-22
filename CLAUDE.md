# Momentum.Web

Frontend React do Momentum, gerenciador de trabalho no estilo do Azure DevOps: cards tipados (user
story, spike, issue, dívida técnica), features, tasks, responsáveis, relações e board. Sobre isso,
a entrevista da IA com o P.O sobre o card e os arquivos `.md` gerados para o desenvolvedor; os
chamados de cada pessoa virão, no futuro, pela integração com o Megabrain. Consome a API do Momentum.Core,
repositório irmão em `../Momentum.Core`, pelo contrato `openapi.json` gerado lá.

**Estado (2026-10-22): Fase 3, as telas das Fases 4 a 8 e o beta (Fase 11) entregues no Web.**
Existem as telas de cadastro, confirmação de e-mail, login, troca de senha, primeiro acesso,
aceite de convite, a lista de projetos, a área da organização (membros, convites, projetos, o
time e os estados de cada projeto), os boards do projeto como tela principal (colunas por
estado, arrastar entre colunas e raias, menu de três pontos no cartão, acesso por board), o card
aberto em modal com guias (detalhes, relações, anexos, entrevista com IA e briefing) sobre o board
e a lista, a lista de cards, os formulários de card, as telas de feature e de epic, com os boards
de features e de epics ao lado da hierarquia, e os anexos de card, subitem, feature e epic, com
sessão e guard de rota, no layout com a paleta do Megabrain, o acabamento do Linear e do YouTrack
e o comportamento do Azure DevOps (`DESIGN.md`), tema claro e escuro; os chamados e a análise de
código ainda não. As regras descrevem a
arquitetura-alvo; o código nasce pelas fases do roadmap do produto. Comando que depende de arquivo ainda inexistente falha — confira em que passo ele
nasce antes de concluir que algo quebrou.

A tela mostra texto escrito por terceiros: descrição de card, chamado do Movidesk com HTML e
resposta do LLM. O defeito mais grave possível aqui é esse texto virar script na página do
usuário, ou um token de sessão ficar ao alcance dele.

## Produto, domínio e roadmap

O produto é um só, e o que vale para os dois repositórios mora no Momentum.Core:

- **Roadmap:** `../Momentum.Core/ai/roadmap.md` — decisões (D-nn), fases, passos **[Web]** e
  perguntas abertas. Leia "Onde estamos" e "Próximo passo" antes de começar um passo e marque-o lá
  ao fechar.
- **Glossário:** `../Momentum.Core/CONTEXT.md` — o vocabulário da UI e dos nomes no código vem
  dele. Termo novo ou ambíguo passa pela skill `domain-modeling`, que escreve lá.
- **Contrato:** `../Momentum.Core/openapi.json`, gerado no build do Core.

Editar esses arquivos deixa alteração pendente no repositório do Core: diga isso no resumo, para o
usuário commitar lá.

## Comandos

A partir do passo 2.1, sempre pelo `npm`, com o Node do `.nvmrc`:

```bash
nvm use                 # Node 22
npm ci
npm start               # Vite em desenvolvimento
npm run typecheck       # tsc --noEmit; não escreve nos arquivos
npm run lint            # ESLint; não escreve nos arquivos
npm run format          # Prettier, aplicando as correções
npm test                # Vitest
npm run quality         # typecheck + lint + test + build: o CI local
```

## Diretrizes

As 8 diretrizes base, e o que cada uma significa aqui:

1. **Sem comentários nem assinatura de autoria.** Nada de `//`, `/* */` ou `{/* */}` em
   TypeScript e JSX — se o código precisa de explicação, extraia um nome melhor. Decisão que
   precisa sobreviver vai para `ai/memory/` ou `ai/knowledge/`. Commit e PR não levam rodapé de
   atribuição (desligado em `.claude/settings.json`).
2. **KISS.** Componentes e hooks pequenos, nomes que dispensam explicação, early return, condição
   composta em função nomeada.
3. **Não duplique; promova.** Antes de criar, procure em `src/shared/` e `src/widgets/` e no
   inventário de `.claude/rules/shared-ui.md`. Segundo uso de algo com domínio → `widgets/`; sem
   domínio → `shared/`.
4. **Alterações pontuais.** Mude só o que a tarefa exige, sem renomear, reordenar ou reformatar
   vizinhos. Algo fora do escopo que mereça correção: relate em vez de corrigir.
5. **Pergunte.** Quando o pedido admitir leituras que levam a trabalhos diferentes, pergunte antes
   de implementar. Para plano ainda cru, `/grill-me`. Decisão de produto que falta vai para
   "Perguntas abertas" do roadmap.
6. **Consulte as definições de IA**: este arquivo, `.claude/rules/`, `ai/knowledge/`, o roadmap e
   o glossário do Core (ver "Como as instruções chegam").
7. **Siga a arquitetura** FSD descrita abaixo; não crie arquitetura paralela.
8. **Revise o diff ao terminar**, com a skill `deliver`.

## Regras do projeto

- **Camadas:** `app → pages → widgets → features → shared`, import só da esquerda para a direita,
  outro slice só pelo `index.ts`. O ESLint trava isso a partir do passo 2.2.
- **Página fina, feature gorda.** Página compõe; query, mutation, estado e orquestração ficam na
  feature. Rota mora em `app/routes/`, nunca na feature.
- **"Leitura cruza, ação não":** o `index.ts` de uma feature exporta queries, UI de leitura e
  tipos; nunca mutation, hook de orquestração ou UI de ação.
- **Estado:** servidor é TanStack Query, sempre; cliente global é Zustand em `app/stores/`;
  formulário é React Hook Form com Zod. Validação manual é antipadrão.
- **Contrato com o Core:** JSON snake_case da API vira tipo interno camelCase no service da
  feature; erro chega em `application/problem+json` e a UI reage pelo `code`, nunca pelo texto.
- **Conteúdo não confiável:** descrição de card, chamado e resposta da IA só aparecem pelo
  renderizador de markdown sanitizado de `shared/ui`. `dangerouslySetInnerHTML` fora dele é
  proibido.
- **Sessão:** nada de token em `localStorage` ou `sessionStorage`; a sessão é um cookie httpOnly
  lido pelo Kong (ADR 0003 do Core), e o client de `shared/api` manda as credenciais e o
  `X-Requested-With`, renova a sessão no 401 e avisa o `app/` quando ela abre ou acaba
  (conhecimentos `renovacao-da-sessao` e `guard-de-rota`).
- **Toda UI que consome dados** trata loading, erro e vazio.
- **Idioma:** código e nomes de arquivo em inglês, kebab-case; textos da UI em português, com o
  vocabulário do glossário.
- **Testes:** lógica nova ou alterada (hook, schema, store, service, util) tem teste Vitest ao
  lado do arquivo; mudança só visual não exige.
- **Conhecimento consolidado** (`ai/knowledge/`) fixa invariantes que o código não conta. Se o
  pedido ferir um invariante, pare antes de implementar: cite o `INV-n`, explique a consequência
  pelo `POR_QUE_EXISTE` e só siga com confirmação explícita daquele invariante. Mudou
  comportamento coberto? Atualize o registro no mesmo commit (`/teach`).
- **Memória** (`ai/memory/`): toda entrega registra changelog e corrige a memória da área tocada.

## Arquitetura

FSD pragmático (canon do Agache.Web), React 19, Vite, TypeScript `strict`.

```
src/
├── app/            bootstrap: providers, routes/<area>.routes.tsx, layouts, stores globais
├── pages/<area>/<page>/index.tsx    telas finas; pages/<area>/index.ts reexporta
├── widgets/        composições com domínio usadas por 2+ páginas ou features
├── features/<dominio>/
│   ├── ui/         componentes single-file
│   ├── model/      hooks/ (orquestração), schemas/ (Zod), stores/, types/, lib/
│   ├── api/        <x>.service.ts, <x>.queries.ts, <x>.mutations.ts, <x>-api-keys.ts
│   └── index.ts    public API filtrada
└── shared/         sem domínio: ui/, api/ (client, erros, tipos gerados), lib/, config/, types/
```

## Como as instruções chegam

- **Sempre:** este arquivo.
- **Por caminho:** `.claude/rules/*.md` entram no contexto quando você lê um arquivo coberto —
  arquitetura, estilo, páginas e rotas, features, dados e API, estado, shared e widgets, testes,
  memória e conhecimento. Ao criar o primeiro arquivo de uma pasta, leia a regra dela antes.
- **Por hook** (`.claude/settings.json`):
  - início de sessão: mostra o próximo passo do roadmap, o conhecimento consolidado, a versão do
    Node e o último changelog;
  - antes de ler: bloqueia `.env` e `launchSettings.json`, inclusive os do Momentum.Core;
  - antes de editar: bloqueia os tipos gerados e o `openapi.json` do Core e, na primeira edição de
    um arquivo coberto por conhecimento, devolve os invariantes para leitura;
  - fim de turno: formata os arquivos alterados, roda typecheck, lint e os testes relacionados, e
    `ai/scripts/check-diff-rules.sh`; o que falhar volta para você corrigir.
- **Skills:** `new-feature` (feature, página e rota), `deliver` (fechar a entrega),
  `get-knowledge` e `teach` (conhecimento), `conformance-review` (diff contra padrões e spec),
  `get-knowledge-conflicts-with-docs` (auditoria) e `domain-modeling`. A pedido do usuário:
  `/grill-me`, `/grill-with-docs` e `/improve-codebase-architecture`. As perguntas abertas do
  roadmap se respondem com `/open-questions start`, numa sessão do Momentum.Core.
- **Subagente:** `security-reviewer`, para auditar mudança que toca sessão, renderização de
  conteúdo externo, chamadas à API ou configuração de build.

## Guardrails

- Não commite nem faça push sem pedido; em `main`, crie uma branch antes.
- `.env` e variantes não são lidos nem têm valor exposto em terminal, contexto ou artefato; só
  `VITE_*` chega ao navegador, e segredo nunca é `VITE_*`.
- Dependência nova só com o OK do usuário: diga o pacote, o porquê e o que ele substitui.
- Reporte fielmente: typecheck, lint, teste ou build que falhou aparece com a saída.
