import { AxiosError, isAxiosError } from "axios";

export type ApiErrorItem = {
  code: string;
  details: string;
  errorType: string | null;
  property: string | null;
  metadata: Record<string, unknown> | null;
};

type ApiErrorInit = {
  title: string;
  status: number | null;
  traceId?: string | null;
  errors: ApiErrorItem[];
};

export class ApiError extends Error {
  readonly status: number | null;
  readonly traceId: string | null;
  readonly errors: ApiErrorItem[];

  constructor({ title, status, traceId = null, errors }: ApiErrorInit) {
    super(title);
    this.name = "ApiError";
    this.status = status;
    this.traceId = traceId;
    this.errors = errors;
  }

  hasCode(code: string) {
    return this.errors.some(item => item.code === code);
  }
}

type ProblemDetailsItem = {
  code: string;
  details: string;
  error_type?: string | null;
  property?: string | null;
  metadata?: Record<string, unknown> | null;
};

type ProblemDetails = {
  title: string;
  status: number;
  trace_id?: string | null;
  errors: ProblemDetailsItem[];
};

const TIMEOUT_CODES = new Set([AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT]);
const TOO_MANY_REQUESTS = 429;

function toCamelCase(value: string) {
  return value.replace(/_([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

function camelizeKeys(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [toCamelCase(key), value])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalText(value: unknown) {
  return value == null || typeof value === "string";
}

function isProblemDetailsItem(value: unknown): value is ProblemDetailsItem {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.details === "string" &&
    isOptionalText(value.error_type) &&
    isOptionalText(value.property) &&
    (value.metadata == null || isRecord(value.metadata))
  );
}

function isErrorList(value: unknown): value is ProblemDetailsItem[] {
  return Array.isArray(value) && value.length > 0 && value.every(isProblemDetailsItem);
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.status === "number" &&
    isOptionalText(value.trace_id) &&
    isErrorList(value.errors)
  );
}

function toErrorItem(item: ProblemDetailsItem): ApiErrorItem {
  return {
    code: item.code,
    details: item.details,
    errorType: item.error_type ?? null,
    property: item.property ? toCamelCase(item.property) : null,
    metadata: item.metadata ? camelizeKeys(item.metadata) : null,
  };
}

function clientFailure(code: string, title: string, details: string, status: number | null = null) {
  return new ApiError({
    title,
    status,
    errors: [{ code, details, errorType: null, property: null, metadata: null }],
  });
}

function unexpectedResponse(status: number) {
  if (status === TOO_MANY_REQUESTS) {
    return clientFailure(
      "UnexpectedResponse",
      "Muitas tentativas",
      "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo.",
      status
    );
  }

  return clientFailure(
    "UnexpectedResponse",
    "Resposta inesperada",
    "Não foi possível concluir a operação. Tente de novo.",
    status
  );
}

export function networkFailure() {
  return clientFailure(
    "NetworkFailure",
    "Falha de conexão",
    "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
  );
}

export function fromResponse(status: number, data: unknown) {
  if (!isProblemDetails(data)) {
    return unexpectedResponse(status);
  }

  return new ApiError({
    title: data.title,
    status: data.status,
    traceId: data.trace_id ?? null,
    errors: data.errors.map(toErrorItem),
  });
}

export function fromErrorList(errors: unknown) {
  if (!isErrorList(errors)) {
    return toApiError(errors);
  }

  return new ApiError({
    title: "Falha na operação",
    status: null,
    errors: errors.map(toErrorItem),
  });
}

function fromRequestFailure(error: AxiosError) {
  if (error.response) {
    return fromResponse(error.response.status, error.response.data);
  }

  if (error.code && TIMEOUT_CODES.has(error.code)) {
    return clientFailure(
      "RequestTimeout",
      "Tempo esgotado",
      "O servidor demorou para responder. Tente de novo."
    );
  }

  return networkFailure();
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    return fromRequestFailure(error);
  }

  return clientFailure(
    "UnexpectedFailure",
    "Erro inesperado",
    "Não foi possível concluir a operação. Tente de novo."
  );
}

export function getApiErrorMessage(error: unknown) {
  return toApiError(error)
    .errors.map(item => item.details)
    .join(" ");
}

export function isTransientFailure(error: unknown) {
  return error instanceof ApiError && (error.status === null || error.status >= 500);
}

export function hasErrorCode(error: unknown, code: string) {
  return error instanceof ApiError && error.hasCode(code);
}

export function hasErrorStatus(error: unknown, status: number) {
  return error instanceof ApiError && error.status === status;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function getRetryAfterSeconds(error: unknown) {
  const waits = toApiError(error).errors.map(item => item.metadata?.retryAfterSeconds);

  return waits.find(isNumber) ?? null;
}
