---
name: get-knowledge-conflicts-with-docs
description: "Audita o código inteiro contra ai/knowledge/, invariante por invariante, e gera um relatório HTML e um plano de adequação versionado com status e dúvidas por desvio. Use quando o usuário pedir para auditar ou conferir se a implementação ainda segue o que foi documentado, antes de um release ou refatoração grande, ou quando houver suspeita de que o conhecimento envelheceu."
---

# get-knowledge-conflicts-with-docs — auditar código contra conhecimento

Percorre cada invariante de `ai/knowledge/` e confronta com o que o código faz **hoje**.
Produz duas saídas com públicos diferentes: um HTML para o humano olhar e um plano de
adequação versionado, que sobrevive entre execuções e acumula status e dúvidas.

## Por que esta skill existe

Conhecimento e código derivam em silêncio. Ninguém quebra um invariante de propósito — ele se
perde numa refatoração, e a documentação segue afirmando algo que deixou de ser verdade. A
partir daí todo agente que ler o registro decide errado com confiança.

O ponto sutil: **um desvio nem sempre é bug no código.** Às vezes o código evoluiu certo e o
conhecimento é que ficou para trás. Por isso a saída é um plano de adequação com decisão
pendente, e não uma lista de correções — quem decide de que lado está o erro é o usuário.

## Processo

### 1. Levantar o conhecimento ativo

```bash
ai/scripts/knowledge-match.sh --all --json
```

Revogados ficam fora da auditoria, mas entram numa seção própria do relatório: código que
ainda obedece a um invariante revogado costuma ser dívida esquecida.

### 2. Verificar invariante por invariante

Para cada `INV-n` de cada conhecimento ativo:

1. Rode o que a seção `VERIFICACAO` daquele arquivo indicar — ela existe justamente para
   tornar esta passagem barata e repetível.
2. Quando não houver comando, leia os arquivos de `touches` e `simbolos`.
3. Classifique com honestidade:

| Veredito | Quando |
| --- | --- |
| `CONFORME` | o código sustenta o invariante, e você viu onde |
| `DESVIO` | o código contradiz o invariante, com arquivo e linha |
| `INDETERMINADO` | não deu para verificar sem rodar o sistema ou consultar o banco |

`INDETERMINADO` é resultado legítimo e deve aparecer no relatório. Chutar `CONFORME` para
fechar a auditoria é o pior desfecho possível: cria confiança onde não há verificação.

Em base grande, despache um subagente por conhecimento — os invariantes são independentes e a
paralelização não perde nada.

### 3. Relatório HTML

Escreva em `$TMPDIR` (ou `/tmp`), como `conflitos-conhecimento-<timestamp>.html`, e abra com
`open`. **Não versione o HTML** — é a mesma convenção do `improve-codebase-architecture`, e
existe para que relatório gerado não polua o diff.

Estrutura: um placar no topo (conforme / desvio / indeterminado), depois um cartão por
conhecimento com os invariantes coloridos por veredito, e para cada desvio o trecho do código
ao lado do texto do invariante. O que o humano precisa em dez segundos é *quantos desvios e
onde*; o resto é detalhe sob demanda.

### 4. Plano de adequação

`ai/knowledge/auditoria/PLANO-DE-ADEQUACAO.md`, **versionado e centralizado**: um arquivo só,
que acumula execuções em vez de nascer de novo a cada auditoria. É o que permite ao usuário
retomar de onde parou e ao agente saber o que já foi decidido.

Ao reexecutar, **atualize as entradas existentes**; não duplique. Desvio que sumiu recebe
`CORRIGIDO` com a data — o histórico é parte do valor.

```markdown
# Plano de adequação — código vs. conhecimento

Atualizado: AAAA-MM-DD | Auditorias: N

| # | Conhecimento | INV | Status | Resumo |
| --- | --- | --- | --- | --- |
| 1 | <id> | INV-2 | ABERTO | filtro só em SQL em X.cs:44 |

## 1 — <id> · INV-2

**Status:** ABERTO
**Detectado em:** AAAA-MM-DD
**Invariante:** <texto na íntegra>
**Encontrado:** <arquivo:linha + o que o código faz>
**De que lado está o erro:** <código violou | conhecimento envelheceu | indeterminado>
**Ação proposta:** <corrigir código | atualizar conhecimento via /teach | investigar>
**Dúvidas para o usuário:**
- <pergunta objetiva que trava a decisão>
```

Status possíveis: `ABERTO`, `EM_ANALISE`, `DUVIDA` (esperando o usuário), `ACEITO` (desvio
aceito, conhecimento a atualizar), `CORRIGIDO`, `DESCARTADO` (falso positivo, com motivo).

### 5. Fechar

Reporte ao usuário o placar, o caminho do HTML e os desvios que precisam de decisão dele.
**Não corrija nada nesta skill.** Auditar e consertar na mesma passagem produz diff enorme e
tira do usuário a escolha de que lado está o erro — que é exatamente a decisão que só ele
pode tomar.

Quando ele decidir, a correção segue o caminho normal: código muda pelo fluxo de entrega,
conhecimento muda por `/teach`, e o plano recebe o novo status na mesma entrega.
