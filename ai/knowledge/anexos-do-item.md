---
id: anexos-do-item
titulo: Anexos do card, do subitem, da feature e do epic, enviados um a um e mostrados só como download ou imagem por blob
status: ativo
criado: 2026-10-22
atualizado: 2026-10-22
touches:
  - src/features/attachment/**
  - src/shared/ui/file-drop-zone.tsx
  - src/shared/lib/download-blob.ts
  - src/shared/lib/format-file-size.ts
  - src/widgets/card-panels.tsx
  - src/pages/feature/feature-detail/index.tsx
  - src/pages/feature/epic-detail/index.tsx
simbolos:
  - AttachmentPanel
  - AttachmentTarget
  - uploadAttachment
  - downloadAttachmentContent
  - useUploadAttachments
  - useDownloadAttachment
  - useAttachmentContent
  - isPreviewable
  - isWithinTheSizeLimit
  - MAXIMUM_ATTACHMENT_BYTES
  - AttachmentPreviewDialog
  - FileDropZone
  - downloadBlob
  - AttachmentTooLarge
  - AttachmentLimitReached
relacionados: [telas-de-card, telas-de-feature-e-epic]
---

## PARA_QUE_SERVE

- Deixa juntar arquivos a um card (guia "Anexos"), a um subitem (no diálogo dele), a uma feature
  e a um epic (seção "Anexos" da tela de cada um), arrastando ou escolhendo, e baixá-los,
  pré-visualizar imagens e excluí-los.

## POR_QUE_EXISTE

- Pedido do usuário para o beta, em 2026-10-22 (passo 11.4, D-08 e ADR 0006 do Core): anexos em
  todo item, como no VSTS. O contrato e os limites estão em
  `../Momentum.Core/ai/memory/incremental/anexos.md` e no conhecimento `anexo` de lá.
- O Core responde o conteúdo sempre como download, para que um HTML ou SVG enviado não rode na
  origem do Momentum. Por isso a tela nunca aponta `src` nem `href` para a rota do conteúdo: baixa
  o blob pela sessão e, só para imagem de tipo conhecido, mostra por URL de blob.
- Um arquivo por requisição, em sequência, porque o Core aceita um por vez e o Kong limita o
  corpo; enviar em paralelo competiria pelo limite de envios por minuto e embaralharia o progresso.
- A feature `attachment` não conhece card, feature nem epic: recebe o alvo (`kind` e `id`) e o
  projeto (para o nome de quem enviou). Quem a encaixa em cada tela são as páginas e
  `widgets/card-panels.tsx`, porque `card` e `feature` não podem importá-la.

## INVARIANTES

- INV-1: O conteúdo de um anexo só chega à tela por `downloadAttachmentContent` (Axios, blob, pela
  sessão): nenhum `src`, `href` ou `window.open` aponta para `/api/v1/attachments/{id}/content`.
- INV-2: Só `image/png`, `image/jpeg`, `image/gif` e `image/webp` têm "Visualizar"
  (`isPreviewable`), num `<img>` com URL de blob criada e revogada no efeito; o resto só se baixa.
- INV-3: Os arquivos escolhidos são enviados um de cada vez, na ordem, e o que tem 0 bytes ou mais
  de 20 MB (`MAXIMUM_ATTACHMENT_BYTES`) não sai: vira um aviso com o nome dele, e os outros seguem.
- INV-4: Enviar e excluir, com sucesso ou com erro, invalidam só a lista daquele alvo
  (`attachmentKeys.byTarget`).
- INV-5: Excluir anexo só chama a API pelo `onConfirm` do `ConfirmButton` da linha.
- INV-6: O nome do arquivo aparece como texto do React, nunca por `MarkdownContent` nem por HTML.
- INV-7: `src/features/attachment` só exporta o `AttachmentPanel`, e nenhuma outra feature o
  importa: ele entra pelas páginas e por `widgets/card-panels.tsx`.

## LIMITACOES

- Sem cancelar um envio em andamento; fechar a modal do card no meio deixa o envio terminar sem
  barra.
- Quem enviou aparece pelo nome no time do projeto; quem saiu do time vira "Alguém que saiu do
  time".
- A pré-visualização baixa a imagem inteira (até 20 MB) e a guarda no cache enquanto a tela vive.
- A guia "Anexos" não mostra a contagem antes de ser aberta.

## OBJETIVOS

- Nenhum arquivo enviado por alguém roda como página do Momentum.

## NAO_OBJETIVOS

- Pré-visualizar PDF, vídeo, texto ou HTML.
- Renomear anexo, versões ou mover entre itens.

## VERIFICACAO

- `rg -n "/content" src --glob '!**/*.test.*' --glob '!src/shared/api/generated/**'` só devolve
  o `downloadAttachmentContent` do service (INV-1).
- `npx vitest run src/features/attachment src/shared/lib/format-file-size.test.ts` cobre o envio,
  a recusa acima de 20 MB, a pré-visualização só de imagem e a exclusão com confirmação (INV-2,
  INV-3, INV-5); o envio em sequência é o `for` com `await` de `use-upload-attachments.ts` (INV-3).
- `rg -n "MarkdownContent|dangerouslySetInnerHTML" src/features/attachment` não devolve nada
  (INV-6).
- `cat src/features/attachment/index.ts` e `rg -n "@/features/attachment" src --glob
  '!**/*.test.*'` → só `widgets/card-panels.tsx` e as páginas de feature e de epic (INV-7).
