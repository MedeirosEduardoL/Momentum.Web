# Features e epics

A hierarquia de um projeto (epics, features de cada um e features sem epic), as telas de uma
feature e de um epic e as de criar e de editar cada um. O contrato da API está em
`../Momentum.Core/ai/memory/incremental/cards.md`, seção "Tasks, relações, features e epics"; o
que não pode quebrar, no conhecimento `telas-de-feature-e-epic`. A feature do card e o filtro da lista por feature estão em `cards.md`.
Aqui fica o que o código não conta.

## Rotas

| Rota | Tela | Por que este caminho |
| --- | --- | --- |
| `/projetos/$projectId/features` | Hierarquia do projeto: epics e features | É irmã de `/projetos/$projectId/cards`: a hierarquia é de um projeto. O nome é o da feature, que é quem agrupa cards; o epic aparece na mesma tela. |
| `/features/$featureId` | Feature | A feature se acha pelo id, como em `GET /api/v1/features/{featureId}`; o card aponta para cá sem saber o projeto. |
| `/epics/$epicId` | Epic | O mesmo, para `GET /api/v1/epics/{epicId}`. |
| `/projetos/$projectId/epics/novo` | Criar epic | O epic nasce num projeto, como o card em `/projetos/$projectId/cards/novo`. Não existe `/projetos/$projectId/epics`: a lista é a hierarquia. |
| `/projetos/$projectId/features/nova` | Criar feature sem epic | Irmã da hierarquia, de onde parte o "Nova feature" de "Features sem epic". |
| `/epics/$epicId/features/nova` | Criar feature dentro de um epic | O epic da feature nova vem do endereço, e o projeto, do epic lido: a feature nasce no projeto do epic, e um epic que não existe mais dá o 404 da tela, antes de a pessoa escrever. |
| `/features/$featureId/editar` | Editar feature | Segue a tela da feature, como `/cards/$cardId/editar`. |
| `/epics/$epicId/editar` | Editar epic | O mesmo, para o epic. |

- As oito ficam na área `member`. Chega-se à hierarquia pelo link "Epics e features" de cada
  projeto na página inicial e pelo item "Features e epics" da navegação lateral, e à feature e ao
  epic também pela seção "Feature" do card. A hierarquia, alcançada pela navegação, não tem link
  "Voltar"; as telas de feature, de epic e os formulários têm.
- `feature` e `epic` ficam em inglês nos caminhos porque são os termos do glossário; `nova` e
  `novo` concordam com eles ("Nova feature", "Novo epic").
- "Novo epic", "Nova feature", "Nova feature em <epic>" e "Editar" são links com a cara de botão
  (`ButtonLink`), com ícone, como "Novo card" e o "Editar" do card: levam a outra tela.

## Quem é dono de quê

- A feature `feature` (`src/features/feature`) é dona de `/api/v1/features` e de `/api/v1/epics`.
  O nome da pasta repete o da camada, como no Core (`src/Feature/Feature`).
- Ela lê da feature `project`: `ProjectContent`, para o título da hierarquia e das telas de criar
  epic e feature sem epic, e o "Projeto não encontrado".
- A feature `card` lê daqui (`useListFeatures`, `useListEpics` e os tipos); o contrário não
  existe. No Core a dependência é ao contrário (a slice `Feature` depende de `Card`), mas no front
  quem manda é quem lê de quem. A feature `board` lê as mesmas duas listas, para os critérios de
  feature e de epic do filtro do board.
- `PUT` e `DELETE /api/v1/cards/{cardId}/feature` são de card e moram na feature `card`.
- Os links entram pela página, inclusive os de criar e de editar (`newEpicLink`,
  `newFeatureWithoutEpicLink`, `renderNewFeatureLink`, `editLink`), e a navegação depois de gravar,
  por `onCreated` e `onSaved`; os que se repetem entre as páginas estão em
  `pages/feature/feature-links.tsx`.

## Fluxos

- **Hierarquia.** Na largura toda da área de conteúdo. Uma seção por epic, na ordem de criação, com o título (link para o epic), o
  estado derivado, o progresso e as quantidades de features e de cards; dentro dela, as features
  do epic. Por último, "Features sem epic". Cada feature mostra título (link), estado derivado,
  progresso e quantidade de cards, o link "Cards" (a lista de cards filtrada pela feature) e
  "Excluir". "Novo epic" fica no topo; "Nova feature" fica em cada epic, e leva à tela de criar
  dentro dele, e em "Features sem epic", que leva à tela de criar sem epic.
- **Feature.** Título, o seletor de epic (muda ao escolher, com "Sem epic"), o resumo, o link para
  os cards e a descrição. "Editar" leva à tela de editar título e descrição.
- **Epic.** Título, o resumo, a descrição e as features dele, com "Nova feature" (que leva à tela
  de criar dentro do epic) e "Excluir" em cada feature. "Editar" leva à tela de editar título e
  descrição.
- **Criar.** Título e descrição (markdown), com uma frase sobre o que é um epic ou uma feature e
  onde ela nasce. Depois de criar, a tela vai para o item novo, como o card; o "Voltar" leva à
  hierarquia, ou ao epic quando a feature nasce dentro dele.
- **Editar.** Os mesmos dois campos, começando com o que o item tem. Depois de gravar, a tela
  volta para o item.
- **Excluir.** Sempre com confirmação, e a confirmação diz o que fica: excluir a feature deixa os
  cards sem feature; excluir o epic deixa as features sem epic.

## Contrato, onde é traiçoeiro

- **As listas não trazem a descrição.** `FeatureSummary` e `EpicSummary` não têm o campo; a
  descrição só existe em `Feature` e `Epic`, lidos um a um. Por isso a tela de editar lê o item
  (`useGetFeature`, `useGetEpic`), e o link para ela fica na tela do item, não na hierarquia.
- **Não há rota da árvore.** A tela pede epics e features do projeto em paralelo e monta os grupos
  em `toHierarchy`. A feature cujo epic não veio na lista de epics (as duas consultas não são
  atômicas) cai em "Features sem epic", para não sumir.
- **O epic é a média dos cards das features dele, não a média das features**: o progresso do epic
  não é a média dos progressos que a tela mostra embaixo dele.
- **Só conta card não arquivado e não cancelado**: a quantidade de cards da feature pode ser menor
  que a da lista de cards filtrada por ela com "Arquivados: Incluídos".
- **`PATCH` com `null` mantém.** O formulário manda sempre título e descrição; a descrição apagada
  vai como `""`.
- **Criar devolve o item criado** (`FeatureResponseDto`, `EpicResponseDto`), com o id para onde a
  tela vai em seguida: `useGroupForm` entrega ao `onSaved` o que o `save` devolveu.
- **O epic da feature não vai no `PATCH`**: `PUT` e `DELETE /api/v1/features/{featureId}/epic`. Na
  criação vai em `epic_id`.
- **`GET /api/v1/features` aceita `epic_id`**, que a tela não usa: a tela do epic filtra a lista
  do projeto, que já está em cache por causa da hierarquia.

## Erros

- Formulários: `applyApiErrors`. `title` e `description` batem com os campos.
- `FeatureLimitReached` (422, 500 por projeto) e `EpicLimitReached` (422, 100 por projeto) vêm sem
  `property`: toast com a mensagem do Core, e a tela de criar continua com o que foi escrito.
- `FeatureEpicInvalid` (422, `property: epic_id`): o epic foi excluído. Ao criar uma feature
  dentro dele, o erro não tem campo no formulário e aparece num aviso no topo do formulário
  (`root.epic`), com o texto mantido; no seletor de epic da feature, vira toast. Nos dois casos as
  listas voltam recarregadas.
- `FeatureNotFound` e `EpicNotFound` (404) ao abrir a tela do item, a de editar ou a de criar
  feature dentro de um epic: o erro do `QueryContent`, com a mensagem do Core, sem formulário. É o
  que vê quem não enxerga o projeto, e quem volta, pelo navegador, à tela de um item que acabou de
  excluir. Na gravação (outra pessoa excluiu no meio-tempo), vira toast.

## Decisões

- **Criar e editar em tela própria, como o card** (pergunta 54, decidida em 2026-10-17). Até o
  passo 5.6 eram diálogos, para criar várias features sem sair da hierarquia; o clique fora e o
  Esc fechavam o diálogo e perdiam a descrição digitada. O preço da tela própria está em
  "Limitações" do conhecimento: criar em sequência custa voltar à hierarquia a cada item.
- **Depois de criar, a tela vai para o item novo**, como o card, e não volta para de onde a
  criação partiu: a tela de criar não sabe se veio da hierarquia ou da tela do epic.
- **O epic de uma feature nova vem do endereço de onde a criação partiu**
  (`/epics/$epicId/features/nova` ou `/projetos/$projectId/features/nova`), e não de um campo: o
  formulário fica igual para feature e epic, criar e editar. A tela com epic lê o epic
  (`useGetEpic`) e dele tira o projeto; a alternativa de um parâmetro `?epic=` na rota do projeto
  pediria validar o id na URL e procurar o epic na lista para dizer onde a feature nasce.
- **Um schema e um hook de formulário para os quatro casos** (`groupSchema`, `useGroupForm`). O
  nome "group" vem do glossário, em que epic e feature são agrupadores, e do `GroupTextReader` do
  Core.
- **Excluir fica nas listas, não na tela do item.** Com a tela do item aberta, recarregar o cache
  depois de excluir pediria ao Core o item que acabou de sumir, e o `QueryContent` continuaria
  mostrando o item excluído. Fora dela, a leitura guardada do item é apagada sem ninguém olhando.
- **As consultas nascem vencidas** (`staleTime` zero): progresso, estado e quantidade de cards
  mudam quando a feature `card` mexe num card, e ela não conhece as chaves daqui. A tela mostra o
  último valor lido e o corrige quando a resposta chega.
- **Excluir feature invalida o cache inteiro**, como as mutations de membro da organização: os
  cards dela ficam sem feature, e esta feature não conhece as chaves de card.
- **`Section` passou a aceitar um nó no título**, para o título do epic ser o link para a tela
  dele.

## Armadilhas

- **Quem chama `useListFeatures` ou `useListEpics` de um componente que monta depois de a primeira
  consulta voltar pede a lista de novo**, porque ela já nasce vencida. Chame os dois no mesmo
  componente (é o que `CardFeature`, do card, faz) ou passe o dado para baixo.
- **`useGroupForm` recebe o item inteiro em `text`**, mas só leva título e descrição para o
  formulário; o resto do item nunca chega ao corpo do `PATCH`.
- **Dois controles com o mesmo nome na hierarquia.** O link "Nova feature" de um epic tem
  `aria-label="Nova feature em <título>"` (posto por `renderNewEpicFeatureLink`, na página), e o
  de "Features sem epic" fica só "Nova feature"; "Excluir" não tem rótulo próprio em cada linha,
  como nas listas da organização. Em teste, ache o botão dentro da linha (`within`).
- **O formulário de editar não acompanha o cache.** Ele lê o item uma vez, ao montar, e a consulta
  nasce vencida: ao abrir a edição vindo da tela do item, o formulário começa com o valor em cache
  e a releitura que volta depois não o troca. É o mesmo desenho do card.

## Ainda não existe

- Tela ou filtro com os cards de uma feature dentro da hierarquia: o link leva à lista de cards.
- Mover feature de epic pela hierarquia: só pelo seletor da tela da feature.
- Busca, paginação e ordenação de features e de epics: o Core devolve tudo, na ordem de criação.
- Responsável, datas e ordem manual em feature e epic: não existem no Core.
