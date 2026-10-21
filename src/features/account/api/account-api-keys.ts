export const accountKeys = {
  all: ["account"] as const,
  current: () => [...accountKeys.all, "current"] as const,
  emailVerificationPreview: (token: string | null) =>
    [...accountKeys.all, "email-verification-preview", token] as const,
};
