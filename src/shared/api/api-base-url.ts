const TRAILING_SLASHES = /\/+$/;

export function toApiBaseUrl(configured: string | undefined) {
  return (configured ?? "").trim().replace(TRAILING_SLASHES, "");
}

export const API_BASE_URL = toApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
