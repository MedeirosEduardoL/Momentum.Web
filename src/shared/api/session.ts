import {
  isAxiosError,
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { toApiError } from "./api-error";
import type { components, paths } from "./generated/openapi";

const SESSIONS_PATH = "/api/v1/sessions" satisfies keyof paths;
const CURRENT_SESSION_PATH = "/api/v1/sessions/me" satisfies keyof paths;
const SESSION_PATHS: string[] = [SESSIONS_PATH, CURRENT_SESSION_PATH];
const UNAUTHORIZED = 401;
const SESSION_ALREADY_RENEWED = "SessionAlreadyRenewed";
const RETRY_MARK = "retriedAfterSessionRenewal";

export type SessionCredentials = {
  email: string;
  password: string;
};

export type SessionEndReason = "signed-out" | "expired";

export type SessionListeners = {
  onOpened: () => Promise<unknown> | void;
  onEnded: (reason: SessionEndReason) => void;
};

type RetriedRequest = InternalAxiosRequestConfig & { [RETRY_MARK]: true };
type RenewableFailure = AxiosError & { config: InternalAxiosRequestConfig };

function isRenewable(error: unknown): error is RenewableFailure {
  return (
    isAxiosError(error) &&
    error.response?.status === UNAUTHORIZED &&
    error.config !== undefined &&
    !(RETRY_MARK in error.config) &&
    !SESSION_PATHS.includes(error.config.url ?? "")
  );
}

export function createSession(client: AxiosInstance) {
  let listeners: SessionListeners = { onOpened: () => undefined, onEnded: () => undefined };
  let pendingRenewal: Promise<void> | null = null;

  async function requestRenewal() {
    try {
      await client.put(CURRENT_SESSION_PATH);
    } catch (error) {
      const failure = toApiError(error);

      if (failure.hasCode(SESSION_ALREADY_RENEWED)) {
        return;
      }

      if (failure.status === UNAUTHORIZED) {
        listeners.onEnded("expired");
      }

      throw failure;
    }
  }

  function renew() {
    pendingRenewal ??= requestRenewal().finally(() => {
      pendingRenewal = null;
    });

    return pendingRenewal;
  }

  async function renewAfter(unauthorized: unknown) {
    try {
      await renew();
    } catch (renewalFailure) {
      throw toApiError(renewalFailure).status === UNAUTHORIZED ? unauthorized : renewalFailure;
    }
  }

  async function retryAfterRenewal(error: unknown): Promise<AxiosResponse> {
    if (!isRenewable(error)) {
      throw error;
    }

    await renewAfter(error);

    const retriedRequest: RetriedRequest = { ...error.config, [RETRY_MARK]: true };

    return client.request(retriedRequest);
  }

  async function open(credentials: SessionCredentials) {
    const payload: components["schemas"]["SignInRequestDto"] = credentials;

    await client.post(SESSIONS_PATH, payload);
    await listeners.onOpened();
  }

  async function close() {
    await client.delete(CURRENT_SESSION_PATH);
    listeners.onEnded("signed-out");
  }

  function listen(nextListeners: SessionListeners) {
    listeners = nextListeners;
  }

  return { open, close, listen, renewAfter, retryAfterRenewal };
}
