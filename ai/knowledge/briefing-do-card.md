---
id: briefing-do-card
titulo: O briefing do card só aparece sanitizado, sai como veio do Core e só é pedido com um clique
status: ativo
criado: 2026-10-17
atualizado: 2026-10-20
touches:
  - src/features/card-brief/**
  - src/shared/lib/copy-text.ts
  - src/shared/lib/download-text-file.ts
simbolos:
  - CardBriefSection
  - useGenerateCardBrief
  - useCardBriefFile
  - generateCardBrief
  - getCardBrief
  - explainGenerateRestriction
  - CardBriefNotEnabled
relacionados: [entrevista-do-card, telas-de-card, administracao-da-organizacao]
---

## PARA_QUE_SERVE

- A seção "Briefing" da tela do card: pede o briefing à IA, mostra a pré-visualização e entrega o
  `MOM-123.md` por cópia e download (passo 8.2).

## POR_QUE_EXISTE

- Contrato do Core (`../Momentum.Core/ai/memory/incremental/ia.md`, "Para o Momentum.Web (passo
  8.2)", e o conhecimento `briefing-do-card` de lá): o briefing é texto do modelo, composto pelo
  Core, e vai para um agente que age sobre código. A tela não o reescreve: mostra sanitizado e
  entrega exatamente o que o Core devolveu, para o que o desenvolvedor revisou ser o que o agente
  recebe.
- Cada pedido é uma chamada paga, contada no Core (10 por card por dia). Repetir sozinho gastaria
  a cota sem ninguém decidir, como na entrevista.
- Resposta 74 do roadmap: só gera quem tem a permissão de IA ("Pode usar a IA"), a mesma da
  entrevista, e a tela a lê da mesma fonte que o painel da entrevista, o `ai_enabled` de
  `GET /api/v1/organizations/me`. Quem recusa é o Core (403 `CardBriefNotEnabled`); a tela só
  deixa de oferecer o botão e diz a quem não tem a permissão que é o administrador da organização
  quem a concede. Ler, copiar e baixar não custam nada e ficam abertos a quem enxerga o card.

## INVARIANTES

- INV-1: O conteúdo do briefing só aparece na tela pelo `MarkdownContent`, com
  `showsLinkDestination`.
- INV-2: Copiar e baixar entregam `content` exatamente como o Core o devolveu, e o arquivo baixado
  tem o nome `file_name`.
- INV-3: Nenhum pedido de briefing sai sem um clique em "Gerar briefing" ou "Gerar de novo": o hook
  não tem nova tentativa e recusa o segundo pedido enquanto um corre.
- INV-4: O pedido usa a espera de 150 segundos, a mesma do Kong para a rota.
- INV-5: `src/features/card` não importa de `src/features/card-brief`; a seção chega à tela do card
  pela página (`renderBrief`).
- INV-6: O `index.ts` da feature exporta só `CardBriefSection`.
- INV-7: "Gerar briefing" e "Gerar de novo" só aparecem quando `explainGenerateRestriction`
  devolve `null`: card não arquivado e `isAiEnabled` verdadeiro em
  `useGetCurrentOrganization`. No lugar deles, a seção mostra o motivo; a quem não tem a
  permissão, diz que é o administrador da organização quem a concede. Copiar e baixar não
  dependem da permissão.
- INV-8: A recusa `CardBriefNotEnabled` do Core relê a organização (`refetch`) e não repete o
  pedido de briefing.

## LIMITACOES

- Quem só lê vê o briefing novo ao recarregar a tela.
- A permissão é a do cache da organização: quem a perde continua vendo "Gerar" até a próxima
  consulta ou até o Core recusar o pedido, e quem a ganha só vê o botão depois da próxima
  consulta.
- Copiar depende da área de transferência do navegador; quando ela é recusada, a tela manda baixar
  o arquivo.

## OBJETIVOS

- O desenvolvedor revisa e entrega ao agente o mesmo arquivo, com a origem e a data à vista.

## NAO_OBJETIVOS

- Editar o briefing na tela.
- Histórico das versões do briefing.

## VERIFICACAO

- `rg -n "MarkdownContent" src/features/card-brief/ui` mostra só o uso com `showsLinkDestination`
  (INV-1).
- `rg -n "retry|setTimeout|setInterval" src/features/card-brief --glob '!**/*.test.*'` não devolve
  nada (INV-3).
- `rg -n "card-brief" src/features/card` não devolve nada (INV-5).
- `cat src/features/card-brief/index.ts` tem uma linha de export (INV-6).
- `rg -n "isAiEnabled|isArchived" src/features/card-brief --glob '!**/*.test.*'` só devolve
  `card-brief-access.ts` e a leitura da organização em `card-brief-section.tsx` (INV-7).
- `npx vitest run src/features/card-brief` cobre INV-1 a INV-4, INV-7 e INV-8.
