import { ApiError } from "@/shared/api/api-error";

type ApiErrorOptions = {
  property?: string;
  metadata?: Record<string, unknown>;
};

export function apiError(
  status: number | null,
  code: string,
  details: string,
  { property, metadata }: ApiErrorOptions = {}
) {
  return new ApiError({
    title: "Falha",
    status,
    errors: [
      { code, details, errorType: null, property: property ?? null, metadata: metadata ?? null },
    ],
  });
}

export const networkFailure = apiError(
  null,
  "NetworkFailure",
  "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
);

export const gatewayRateLimit = apiError(
  429,
  "UnexpectedResponse",
  "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo."
);
