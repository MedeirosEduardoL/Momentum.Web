# Briefing do card

A seção "Briefing" da tela do card: pedir o briefing, a pré-visualização, copiar e baixar o
`MOM-123.md`. O contrato está em `../Momentum.Core/ai/memory/incremental/ia.md` ("Para o
Momentum.Web (passos 8.2 e 8.4)"); o que não pode quebrar aqui, no conhecimento `briefing-do-card`.

## Onde fica

- Não tem rota própria: é a última seção de `/cards/$cardId`, depois de "Entrevista". A página
  (`pages/card/detail`) entrega a seção ao `CardDetail` por `renderBrief`, como faz com a
  entrevista.
- A feature é `card-brief`, dona de `/api/v1/card-briefs`. Lê o tipo `Card` da feature `card` e,
  da feature `organization`, se a pessoa tem a permissão de IA.

## Fluxos

- **Sem briefing.** O Core responde 404 `CardBriefNotFound`, que o service devolve como `null`, e a
  seção oferece "Gerar briefing", com o aviso de que cada pedido é uma chamada paga. Card
  arquivado não oferece: o Core recusaria.
- **Gerando.** A seção troca o conteúdo por "A IA está escrevendo o briefing…"; o pedido não é
  stream e pode levar até dois minutos, por isso a espera é de 150 segundos.
- **Com briefing.** Mostra a data e a versão do prompt, o aviso quando o card mudou depois
  (`outdated`), "Copiar", "Baixar MOM-123.md" e "Gerar de novo", e a pré-visualização numa caixa
  que rola.
- **Sem a permissão de IA.** Quem não tem `ai_enabled` em `GET /api/v1/organizations/me`
  (a mesma fonte do "Iniciar entrevista") não vê "Gerar briefing" nem "Gerar de novo": lê que só
  gera quem o administrador da organização marcou como “Pode usar a IA” na lista de membros, e
  continua lendo, copiando e baixando o briefing que existe. Card arquivado mostra o motivo dele
  no mesmo lugar (`explainGenerateRestriction`).
- **Erro.** A mensagem do Core num aviso fixo, com o tempo de espera quando vem
  `retry_after_seconds` (`describeApiFailure`, de `shared/api`, o mesmo da entrevista). Nada é
  repetido sozinho. A recusa `CardBriefNotEnabled` (a permissão caiu com a tela aberta) relê a
  organização, e o botão some, como na entrevista com `InterviewNotEnabled`.

## Decisões

- **Copiar e baixar ficam em `shared/lib`** (`copyText`, `downloadTextFile`): não sabem o que é
  briefing, e a próxima tela que entregar arquivo usa os mesmos.
- **"Gerar de novo" não pede confirmação.** Substitui o briefing anterior, mas o custo já está
  dito na tela, e o anterior não tem mais valor que o novo.

## Armadilhas

- **Em teste, `userEvent.setup()` troca a área de transferência do `navigator`.** Para conferir a
  cópia, leia `navigator.clipboard.readText()`; para simular a recusa, faça o `spyOn` depois do
  `setup`.
- **Não espalhe o objeto `URL` num `stubGlobal`.** Os métodos estáticos não são enumeráveis, e o
  `URL.canParse` some e quebra o renderizador; use `vi.spyOn(URL, "createObjectURL")`.
