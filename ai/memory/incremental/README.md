# incremental/ — índice por assunto

A memória incremental é organizada **por assunto** (uma área da tela ou um fluxo), não por pasta:
um assunto costuma cruzar feature, widget e página, e é na costura entre eles que mora o que o
código não conta sozinho.

Antes de escrever, consulte esta tabela. **Se o assunto já tem casa, escreva nela.** Arquivo novo
só quando o assunto for de fato novo.

## Mexendo em → leia antes

| Caminhos | Memória | Cobertura |
| --- | --- | --- |
| `src/shared/api/**`, `src/app/providers/**`, proxy do `vite.config.ts` | [`integracao-com-o-core.md`](integracao-com-o-core.md) | Client HTTP, sessão por cookie, erro do Core e do Kong, o `POST` lido em stream, retry e tipos gerados |
| `src/shared/ui/**`, `src/shared/lib/cn.ts`, `src/index.css`, `DESIGN.md` | [`interface-base.md`](interface-base.md) | Tokens, componentes de base, `MarkdownContent` e armadilhas do Vite |
| `src/features/{account,first-access}/**`, a leitura e o aceite em `src/features/{organization,project,invitation}/**`, `src/app/routes/**`, `src/app/providers/session-cache.ts`, `src/pages/{account,invitation,home}/**`, `src/pages/organization/first-access/**` | [`identidade-e-acesso.md`](identidade-e-acesso.md) | Conta, sessão e o aviso de expiração, guard de rota, primeiro acesso, aceite de convite e as decisões de onde cada ação mora |
| Membros, convites, criação de projeto e times em `src/features/{organization,invitation,project}/**`, `src/app/layouts/organization-settings-layout.tsx`, `src/app/routes/organization.routes.tsx`, `src/pages/organization/{members,invitations,projects,project-team}/**` | [`configuracoes-da-organizacao.md`](configuracoes-da-organizacao.md) | A área `/organizacao`: quem vê o quê, papéis, convites, times, erros do Core por tela e por que a criação de projeto é da feature `project` |
| `src/features/card/**`, `src/features/project/ui/project-content.tsx`, `src/pages/card/**`, `src/app/routes/card.routes.tsx`, `src/app/routes/card-list-search.ts` | [`cards.md`](cards.md) | Lista, detalhe e formulários de card, e as tasks, as relações e a feature do card: rotas e filtros na URL, o `PATCH` com nulos e o grupo do tipo inteiro, o 409, a feature no card novo, a busca do outro card de uma relação e os erros por tela |
| `src/features/feature/**`, `src/pages/feature/**`, `src/app/routes/feature.routes.tsx` | [`features-e-epics.md`](features-e-epics.md) | Hierarquia do projeto e telas de feature e de epic, inclusive as de criar e de editar: rotas, por que as consultas nascem vencidas, por que excluir fica nas listas, de onde vem o epic da feature nova e os erros por tela |
| `src/features/board/**`, o board na feature `card` (`src/features/card/ui/card-state-columns.tsx`, `card-lane-row.tsx`, `card-tile.tsx`, `card-state-column-header.tsx`, `card-completion-dialog.tsx`, `card-quick-create.tsx`, `src/features/card/model/hooks/use-move-card.ts`, `use-card-drag.ts`, `use-completion-confirmation.ts`, `use-quick-create-card.ts`, `src/features/card/model/lib/card-state-columns.ts`, `card-completion.ts`), `src/pages/board/**`, `src/app/routes/board.routes.tsx`, `src/app/routes/board-search.ts`, `src/app/stores/first-board.store.ts` | [`board.md`](board.md) | A tela dos boards do projeto: a rota e o que fica na URL, por que mover e criar o card moram na feature `card`, o card novo na primeira coluna, arrastar sem biblioteca, o movimento otimista entre colunas e raias, a confirmação de concluir com task aberta, a visão por responsável e as raias de todo o time, o aviso do board que não existe mais, o formulário do filtro, o diálogo do primeiro board (também no fim do primeiro acesso) e os erros por tela |
| `src/features/card-brief/**`, `src/shared/lib/copy-text.ts`, `src/shared/lib/download-text-file.ts`, a seção em `src/pages/card/detail/**` | [`briefing-do-card.md`](briefing-do-card.md) | A seção do briefing na tela do card: pedir, a pré-visualização sanitizada, copiar e baixar, os erros e as armadilhas de teste da área de transferência e do `URL` |
| `src/features/card-interview/**`, `src/shared/api/event-stream.ts`, o painel em `src/pages/card/detail/**` | [`entrevista-do-card.md`](entrevista-do-card.md) | O painel da entrevista na tela do card: quem vê o quê, o início com a primeira rodada, o stream das rodadas, as respostas, a proposta de mudança campo a campo, os erros por código e as armadilhas de teste do stream |

**"Sem memória" é informação, não lacuna a tapar às pressas.** Se a sua entrega produzir
conhecimento durável sobre uma área sem casa, aí sim crie o arquivo do assunto.

## Manutenção

Esta tabela faz parte da memória e envelhece como o resto dela. Ao criar um arquivo novo, ao mudar
o escopo de um existente ou ao dar casa a uma área que estava sem, **atualize aqui na mesma
entrega** — a skill `deliver` conduz essa passagem.
