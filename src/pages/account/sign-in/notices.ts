export const SIGN_IN_NOTICES = {
  "email-confirmado": { tone: "success", message: "E-mail confirmado. Entre com a sua senha." },
  "senha-redefinida": { tone: "success", message: "Senha redefinida. Entre com a senha nova." },
  "convite-aceito": { tone: "success", message: "Convite aceito. Entre com a sua senha." },
  "sessao-expirada": {
    tone: "info",
    message: "A sua sessão expirou. Entre de novo para continuar.",
  },
} as const;

export type SignInNotice = keyof typeof SIGN_IN_NOTICES;
