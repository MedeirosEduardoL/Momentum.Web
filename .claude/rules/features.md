---
paths:
  - "src/features/**"
---

# Features

Uma feature por domínio, com o nome do glossário em inglês (`features/card`, `features/board`,
`features/card-interview`, `features/support-ticket`). Single-file por componente, hook e schema.

```
features/<nome>/
├── ui/<nome>-form.tsx
├── model/
│   ├── hooks/use-<acao>.ts          orquestração: state + mutation + navegação
│   ├── schemas/<acao>.schema.ts     Zod
│   ├── stores/  types/  lib/        opcionais
│   └── contexts/                    opcional, só quando Zustand não cabe
├── api/
│   ├── <nome>.service.ts
│   ├── <nome>.queries.ts
│   ├── <nome>.mutations.ts
│   └── <nome>-api-keys.ts
└── index.ts                          public API filtrada
```

## Public API — o filtro

```ts
export { CardSummaryItem } from "./ui/card-summary-item";
export { useListCards } from "./api/card.queries";
export type { CardSummary } from "./model/types/card.types";
```

Não saem: mutations, hooks de orquestração, schemas de ação, UI de ação.

## Formulários: React Hook Form + Zod

O schema é a fonte única de validação; estado do formulário, mutation, navegação e erro moram no
hook de orquestração; a UI consome o hook e fica fina.

```ts
export const cardSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do card."),
  cardType: z.enum(["user_story", "spike", "issue", "tech_debt"]),
});

export type CardFormValues = z.infer<typeof cardSchema>;
```

```ts
export function useCreateCard() {
  const createCard = useCreateCardMutation();
  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { title: "", cardType: "user_story" },
  });

  const onSubmit = form.handleSubmit(async values => {
    try {
      await createCard.mutateAsync(values);
    } catch (error) {
      applyApiErrors(form, error);
    }
  });

  return { form, onSubmit, isSaving: createCard.isPending };
}
```

- Mensagem de validação em português.
- Erro de negócio do Core com `property` vira erro no campo correspondente; sem `property`, toast
  com a mensagem do Core. O helper que faz isso é o `applyApiErrors` de `shared/api`.
- A opção de um select que vem de enum do Core usa o código snake_case do contrato como valor e o
  rótulo em português na UI.

## Recursos de IA na feature

- Resposta em streaming (a entrevista do card) chega por Server-Sent Events, consumida por um hook
  da feature que expõe o estado e o cancelamento, sem o texto parcial; sair da tela cancela.
- Proposta da IA que altera o card aparece como proposta, com aceitar e descartar; nada é aplicado
  sem o clique do usuário.
- Texto do LLM, de card e de chamado só aparece pelo renderizador de markdown sanitizado de
  `shared/ui`.
