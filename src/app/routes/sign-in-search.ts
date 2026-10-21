import type { SignInNotice } from "@/pages/account";

export type SignInSearch = {
  aviso?: SignInNotice;
};

const KNOWN_NOTICES: Record<SignInNotice, true> = {
  "email-confirmado": true,
  "senha-redefinida": true,
  "convite-aceito": true,
  "sessao-expirada": true,
};

function isSignInNotice(value: unknown): value is SignInNotice {
  return typeof value === "string" && Object.hasOwn(KNOWN_NOTICES, value);
}

export function toSignInSearch(search: Record<string, unknown>): SignInSearch {
  return isSignInNotice(search.aviso) ? { aviso: search.aviso } : {};
}
