import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, networkFailure } from "@/test/api-errors";
import { toastApiError } from "./toast-api-error";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

beforeEach(() => {
  vi.mocked(toast.error).mockClear();
});

describe("toastApiError", () => {
  it("mostra a mensagem do Core", () => {
    toastApiError(
      apiError(
        422,
        "OrganizationLastAdministrator",
        "A organização precisa de pelo menos um administrador."
      )
    );

    expect(toast.error).toHaveBeenCalledWith(
      "A organização precisa de pelo menos um administrador."
    );
  });

  it("mostra a mensagem em português da falha técnica", () => {
    toastApiError(networkFailure);

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
  });

  it("não mostra o texto de um erro que não veio da API", () => {
    toastApiError(new Error("Cannot read properties of undefined"));

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível concluir a operação. Tente de novo."
    );
  });
});
