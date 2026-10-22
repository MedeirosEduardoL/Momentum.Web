---
name: new-feature
description: Receita para criar uma feature nova no front, ou uma tela nova numa feature existente — tipos, service, queries e mutations, schema, hook de orquestração, UI, public API, página e rota, testes, nessa ordem. Use antes de criar o primeiro arquivo de uma feature ou página.
---

# new-feature

## Antes de criar

1. Leia o passo **[Web]** do `../Momentum.Core/ai/roadmap.md` que a tela cumpre. Se o passo está
   `[?]`, a decisão que falta é do usuário: pergunte antes de criar.
2. Confira no `../Momentum.Core/openapi.json` os endpoints que a tela consome. Endpoint que não
   existe é trabalho do Core primeiro: diga isso em vez de inventar o contrato.
3. Use o vocabulário de `../Momentum.Core/CONTEXT.md` nos textos da UI e a tradução da tabela
   "Vocabulário no código" do project-map do Core nos nomes.
4. Procure o que reusar em `src/shared/`, `src/widgets/` e no inventário de
   `.claude/rules/shared-ui.md` antes de criar.
5. As regras de cada camada estão em `.claude/rules/` e entram no contexto quando você lê um
   arquivo daquela pasta. Numa feature nova ainda não há arquivo para ler — então leia
   `architecture.md`, `features.md` e `data-layer.md` antes de criar o primeiro.

## Ordem

| # | Passo | Regra |
| --- | --- | --- |
| 1 | Tipos internos em `model/types/<nome>.types.ts` | `code-style.md` |
| 2 | `api/<nome>-api-keys.ts` e `api/<nome>.service.ts`, adaptando do tipo gerado | `data-layer.md` |
| 3 | `api/<nome>.queries.ts` e `api/<nome>.mutations.ts` | `data-layer.md` |
| 4 | Schema Zod em `model/schemas/` | `features.md` |
| 5 | Hook de orquestração em `model/hooks/use-<acao>.ts` | `features.md` |
| 6 | Componentes single-file em `ui/`, com loading, erro e vazio | `code-style.md` |
| 7 | Public API filtrada em `index.ts` | `features.md` |
| 8 | Página fina em `pages/<area>/<page>/index.tsx` e reexport em `pages/<area>/index.ts` | `pages-and-routes.md` |
| 9 | Rota em `app/routes/<area>.routes.tsx`, com guard se exigir sessão | `pages-and-routes.md` |
| 10 | Testes lado a lado de service, schema, hook e o que tiver lógica | `testing.md` |
| 11 | Fechamento: skill `deliver` | — |

## Esqueleto

```
features/<nome>/
├── ui/<nome>-form.tsx
├── model/
│   ├── hooks/use-<acao>.ts + .test.ts
│   ├── schemas/<acao>.schema.ts + .test.ts
│   └── types/<nome>.types.ts
├── api/
│   ├── <nome>.service.ts + .test.ts
│   ├── <nome>.queries.ts
│   ├── <nome>.mutations.ts
│   └── <nome>-api-keys.ts
└── index.ts
```

- Componente que outra feature ou página já precisa: segundo uso, promova para `widgets/`
  (`.claude/rules/architecture.md`).
- A tela nova entra em "Telas" de `ai/memory/project/project-map.md`, com a rota e os endpoints que
  consome.
