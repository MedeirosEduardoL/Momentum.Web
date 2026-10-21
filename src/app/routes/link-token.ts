const TOKEN_PARAMETER = "token";

export function readLinkToken(fragment: string) {
  const parameters = new URLSearchParams(fragment.replace(/^#/, ""));

  return parameters.get(TOKEN_PARAMETER) || null;
}
