import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, type ApiErrorItem } from "./api-error";
import { applyApiErrors } from "./apply-api-errors";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type CardFormValues = {
  title: string;
  cardType: string;
};

function errorItem(code: string, details: string, property: string | null = null): ApiErrorItem {
  return { code, details, errorType: "request_error", property, metadata: null };
}

function invalidRequest(...errors: ApiErrorItem[]) {
  return new ApiError({ title: "Requisição inválida", status: 400, errors });
}

describe("applyApiErrors", () => {
  const setError = vi.fn();

  beforeEach(() => {
    setError.mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("põe o erro com property no campo do formulário", () => {
    applyApiErrors<CardFormValues>(
      { setError },
      invalidRequest(errorItem("CardTitleRequired", "Informe o título do card.", "title"))
    );

    expect(setError).toHaveBeenCalledWith("title", {
      type: "server",
      message: "Informe o título do card.",
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("leva o erro ao campo indicado quando o formulário usa outro nome para a property", () => {
    applyApiErrors<CardFormValues>(
      { setError },
      invalidRequest(errorItem("CardTypeRequired", "Informe o tipo do card.", "type")),
      { type: "cardType" }
    );

    expect(setError).toHaveBeenCalledWith("cardType", {
      type: "server",
      message: "Informe o tipo do card.",
    });
  });

  it("leva ao formulário, fora dos campos, o erro de uma property que não tem campo próprio", () => {
    applyApiErrors<CardFormValues>(
      { setError },
      invalidRequest(errorItem("CardLabelsInvalid", "Uma das etiquetas não existe.", "labels")),
      { labels: "root.labels" }
    );

    expect(setError).toHaveBeenCalledWith("root.labels", {
      type: "server",
      message: "Uma das etiquetas não existe.",
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("mostra em toast o erro sem property", () => {
    applyApiErrors<CardFormValues>(
      { setError },
      invalidRequest(
        errorItem("CardTypeRequired", "Informe o tipo do card.", "cardType"),
        errorItem("ProjectArchived", "O projeto está arquivado.")
      )
    );

    expect(setError).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("O projeto está arquivado.");
  });

  it("mostra a falha que não veio do Core sem mensagem técnica", () => {
    applyApiErrors<CardFormValues>({ setError }, new Error("socket hang up"));

    expect(setError).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível concluir a operação. Tente de novo."
    );
  });
});
