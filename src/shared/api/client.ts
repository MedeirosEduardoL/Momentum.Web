import axios, { isCancel } from "axios";
import { toApiError } from "./api-error";
import { createSession } from "./session";

const REQUEST_TIMEOUT_MS = 15_000;

function rejectAsApiError(error: unknown) {
  return Promise.reject(isCancel(error) ? error : toApiError(error));
}

export const REQUESTED_WITH_HEADER = { "X-Requested-With": "XMLHttpRequest" };

export const api = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    ...REQUESTED_WITH_HEADER,
  },
});

export const session = createSession(api);

api.interceptors.response.use(response => response, session.retryAfterRenewal);
api.interceptors.response.use(response => response, rejectAsApiError);
