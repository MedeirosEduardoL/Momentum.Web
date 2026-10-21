import { describe, expect, it } from "vitest";
import { apiError, networkFailure } from "@/test/api-errors";
import { describeApiFailure } from "./describe-api-failure";

describe("describeApiFailure", () => {
  it("mostra a mensagem do Core", () => {
    expect(
      describeApiFailure(
        apiError(424, "AiNotConfigured", "Os recursos de IA não estão configurados neste ambiente.")
      )
    ).toBe("Os recursos de IA não estão configurados neste ambiente.");
  });

  it("diz quando dá para tentar de novo, quando o Core manda o tempo de espera", () => {
    expect(
      describeApiFailure(
        apiError(
          429,
          "AiOrganizationQuotaReached",
          "A cota de IA da organização acabou neste mês.",
          {
            metadata: { retryAfterSeconds: 1555200 },
          }
        )
      )
    ).toBe("A cota de IA da organização acabou neste mês. Disponível de novo em 18 dias.");
    expect(
      describeApiFailure(
        apiError(429, "LlmProviderRateLimited", "O serviço de IA está no limite de uso.", {
          metadata: { retryAfterSeconds: 30 },
        })
      )
    ).toBe("O serviço de IA está no limite de uso. Disponível de novo em 30 segundos.");
  });

  it("mostra a falha técnica em português, sem mensagem interna", () => {
    expect(describeApiFailure(networkFailure)).toBe(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(describeApiFailure(new SyntaxError("Unexpected token"))).toBe(
      "Não foi possível concluir a operação. Tente de novo."
    );
  });
});
