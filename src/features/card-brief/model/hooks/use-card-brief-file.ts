import { toast } from "sonner";
import { copyText } from "@/shared/lib/copy-text";
import { downloadTextFile } from "@/shared/lib/download-text-file";
import type { CardBrief } from "../types/card-brief.types";

export function useCardBriefFile(brief: CardBrief) {
  async function copy() {
    if (await copyText(brief.content)) {
      toast.success("Briefing copiado.");
      return;
    }

    toast.error("Não foi possível copiar o briefing. Baixe o arquivo.");
  }

  function download() {
    downloadTextFile(brief.fileName, brief.content);
  }

  return { copy, download };
}
