import { z } from "zod";

const PERSON_NAME_MAX_LENGTH = 120;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;
const PERSON_NAME_PATTERN = /^[^<>"/\\:@\p{Cc}]*$/u;
const INVALID_EMAIL_MESSAGE = "Informe um e-mail válido.";
const PASSWORD_LENGTH_MESSAGE = "A senha precisa ter de 10 a 128 caracteres.";

export const personNameSchema = z
  .string()
  .trim()
  .min(1, "Informe o seu nome.")
  .max(PERSON_NAME_MAX_LENGTH, "O nome pode ter no máximo 120 caracteres.")
  .regex(
    PERSON_NAME_PATTERN,
    'O nome não pode ter quebra de linha nem os caracteres < > " / \\ : @.'
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, INVALID_EMAIL_MESSAGE)
  .pipe(z.email(INVALID_EMAIL_MESSAGE));

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_LENGTH_MESSAGE)
  .max(PASSWORD_MAX_LENGTH, PASSWORD_LENGTH_MESSAGE);
