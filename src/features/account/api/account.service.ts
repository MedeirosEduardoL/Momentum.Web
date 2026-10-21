import { hasErrorStatus } from "@/shared/api/api-error";
import { api } from "@/shared/api/client";
import type { components, paths } from "@/shared/api/generated/openapi";
import type {
  Account,
  AccountRegistration,
  EmailVerification,
  EmailVerificationPreview,
  LinkPassword,
} from "../model/types/account.types";

type Schemas = components["schemas"];

const ACCOUNTS_PATH = "/api/v1/accounts" satisfies keyof paths;
const CURRENT_ACCOUNT_PATH = "/api/v1/accounts/me" satisfies keyof paths;
const EMAIL_VERIFICATIONS_PATH = "/api/v1/email-verifications" satisfies keyof paths;
const EMAIL_VERIFICATION_PREVIEWS_PATH =
  "/api/v1/email-verification-previews" satisfies keyof paths;
const EMAIL_VERIFICATION_REQUESTS_PATH =
  "/api/v1/email-verification-requests" satisfies keyof paths;
const PASSWORD_RESET_REQUESTS_PATH = "/api/v1/password-reset-requests" satisfies keyof paths;
const PASSWORD_RESETS_PATH = "/api/v1/password-resets" satisfies keyof paths;
const UNAUTHORIZED = 401;

function toAccount(dto: Schemas["AccountResponseDto"]): Account {
  return { id: dto.user_id, name: dto.name, email: dto.email };
}

export async function getCurrentAccount(): Promise<Account | null> {
  try {
    const response = await api.get<Schemas["AccountResponseDto"]>(CURRENT_ACCOUNT_PATH);
    return toAccount(response.data);
  } catch (error) {
    if (hasErrorStatus(error, UNAUTHORIZED)) {
      return null;
    }

    throw error;
  }
}

export async function registerAccount(registration: AccountRegistration): Promise<void> {
  const payload: Schemas["RegisterAccountRequestDto"] = registration;

  await api.post(ACCOUNTS_PATH, payload);
}

export async function previewEmailVerification(token: string): Promise<EmailVerificationPreview> {
  const payload: Schemas["EmailVerificationTokenRequestDto"] = { token };
  const response = await api.post<Schemas["EmailVerificationPreviewResponseDto"]>(
    EMAIL_VERIFICATION_PREVIEWS_PATH,
    payload
  );

  return { name: response.data.name };
}

export async function verifyEmail(verification: EmailVerification): Promise<void> {
  const payload: Schemas["VerifyEmailRequestDto"] = verification;

  await api.post(EMAIL_VERIFICATIONS_PATH, payload);
}

export async function requestEmailVerification(email: string): Promise<void> {
  const payload: Schemas["AccountEmailRequestDto"] = { email };

  await api.post(EMAIL_VERIFICATION_REQUESTS_PATH, payload);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const payload: Schemas["AccountEmailRequestDto"] = { email };

  await api.post(PASSWORD_RESET_REQUESTS_PATH, payload);
}

export async function resetPassword(reset: LinkPassword): Promise<void> {
  const payload: Schemas["ResetPasswordRequestDto"] = reset;

  await api.post(PASSWORD_RESETS_PATH, payload);
}
