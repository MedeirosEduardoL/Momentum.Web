---
name: deliver
description: Fecha uma entrega do front — revisa o diff contra as regras de arquitetura FSD, roda npm run quality, atualiza o roadmap do produto, changelog, memória e conhecimento, e resume ao usuário. Use ao concluir uma feature, correção ou mudança de comportamento, antes de dizer que terminou.
---

# deliver

## Estado atual

!`git status --short`

!`bash ai/scripts/check-diff-rules.sh || true`

!`bash ai/scripts/knowledge-match.sh --diff || true`

## 1. Diff

Violação mecânica listada acima se corrige antes de responder — não entregue apontando a própria
dívida como observação. Depois leia o diff inteiro (`git diff` e os arquivos novos) atrás do que o
script não pega:

- **Camadas:** import só da esquerda para a direita; outro slice só pelo `index.ts`; nenhuma
  feature importa mutation, hook de ação ou UI de ação de outra; nenhum import de `pages/` fora de
  `app/routes/`.
- **Placement:** componente na camada certa; nada em `shared/` com domínio; nada em `widgets/`
  antes do segundo uso; sem pasta `components/` em feature ou widget.
- **Public API:** o `index.ts` da feature não exporta mutation, hook de orquestração, schema de
  ação nem UI de ação; feature não exporta rota.
- **Página:** sem `useQuery`, `useMutation` ou estado de domínio; reexportada em
  `pages/<area>/index.ts`.
- **Estado e dados:** servidor em Query; formulário com RHF + Zod; mutation invalida o que afeta;
  snake_case só dentro do service; erro do Core tratado pelo `code`.
- **Conteúdo não confiável:** texto de card, chamado e IA só pelo renderizador sanitizado.
- **UI:** loading, erro e vazio tratados; textos em português com o vocabulário do glossário;
  elemento interativo acessível.
- **Reuso:** nada criado onde já havia equivalente; item novo de `shared/` ou `widgets/` registrado
  no inventário de `.claude/rules/shared-ui.md`.
- Nenhum arquivo fora do escopo do pedido.

## 2. Quality

`npm run quality` (typecheck + lint + test + build) passa, rodado com o Node do `.nvmrc`. O hook
de fim de turno roda typecheck, lint e os testes relacionados, mas o resultado completo precisa
estar no resumo. Lógica nova ou alterada sem teste é pendência, não observação. Antes do passo 2.1
do roadmap, diga que não há projeto para rodar.

Mudou o consumo da API: os tipos gerados estão em dia com o `openapi.json` do Core.

## 3. Roadmap e memória

Regras de escrita em `.claude/rules/memory.md`.

- Roadmap do produto (`../Momentum.Core/ai/roadmap.md`): o passo **[Web]** entregue vira `[x]` com
  a data; "Onde estamos" e "Próximo passo" atualizados. A alteração fica pendente no repositório do
  Core: diga isso no resumo.
- Changelog: seção nova em `ai/memory/changelog/<AAAA-MM-DD>.md` (data de hoje).
- Incremental: o arquivo do assunto indicado em `ai/memory/incremental/README.md`; arquivo novo só
  para assunto novo, registrado no índice.
- Project-map: só se a entrega mudou o que o front é ou faz.
- Releia a memória da área tocada e corrija no lugar o que a entrega tornou falso.

## 4. Conhecimento

Para cada conhecimento listado em "Estado atual", confira se algum `INV-n` deixou de ser verdade;
se deixou, corrija o registro neste mesmo commit com `/teach`. Regra durável nova que não está
registrada em lugar nenhum pede um conhecimento novo.

## 5. Resumo ao usuário

O que foi feito, em uma ou duas frases; arquivos relevantes como links; resultado do `quality`,
com a saída se falhou; alterações pendentes no repositório do Core; ações manuais pendentes; o que
ficou de fora e por quê. Não commite sem pedido.
