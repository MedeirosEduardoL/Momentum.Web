import { Button } from "@/shared/ui/button";
import { Notice } from "@/shared/ui/notice";

type ChangedMeanwhileNoticeProps = {
  subject: string;
  onLoadCurrentVersion: () => void;
};

export function ChangedMeanwhileNotice({
  subject,
  onLoadCurrentVersion,
}: ChangedMeanwhileNoticeProps) {
  return (
    <Notice tone="danger">
      <span className="flex flex-col gap-2">
        {subject} foi alterado por outra pessoa enquanto você editava, e nada foi salvo. O que você
        digitou continua aqui: copie o que precisar e carregue a versão atual para refazer a
        alteração.
        <span>
          <Button variant="secondary" size="sm" onClick={onLoadCurrentVersion}>
            Carregar a versão atual
          </Button>
        </span>
      </span>
    </Notice>
  );
}
