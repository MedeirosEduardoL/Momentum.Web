---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/test/**"
  - "vite.config.ts"
  - "vitest.config.ts"
---

# Testes

Vitest com jsdom e Testing Library, configurado no `vite.config.ts`; `npm run test:coverage` gera
a cobertura (v8). E2E: nenhum por ora — a tela é testada à mão (resposta 7 do roadmap). O que foi
conferido à mão é dito no resumo, nunca tratado como teste executado.

## Onde

- Lado a lado: `use-create-card.ts` ↔ `use-create-card.test.ts`.
- Setup comum em `src/test/setup.ts` (matchers do jest-dom; a limpeza do Testing Library é
  automática com `globals: true`). Mock de navegador que faltar ao jsdom entra ali.

## O quê

| Mudança | Exige |
| --- | --- |
| Só visual, sem lógica | Nada além dos gates estáticos. |
| Hook, schema, store, service, query, mutation, util, condição ou transformação | Teste unitário executável. |
| Fluxo crítico do usuário | Teste à mão no navegador, descrito no resumo; sem E2E por ora. |

Cobertura de um fluxo que importa: caminho feliz, validação do schema, erro de negócio do Core
(pelo `code`) e erro técnico (rede, 5xx, 424) tratado sem quebrar a tela.

## Como

- Teste comportamento observável, não detalhe interno: Testing Library por papel e rótulo
  (`getByRole("button", { name: "Salvar" })`).
- Service com mock do client HTTP; query e mutation com mock do service; nunca rede real.
- Dado de teste sintético, com o vocabulário do glossário.
- O portão de fim de turno roda `vitest related` dos arquivos alterados; a skill `deliver` roda
  `npm run quality`.
- Nunca apague nem pule teste que falhou para fechar a entrega: reporte a falha.
