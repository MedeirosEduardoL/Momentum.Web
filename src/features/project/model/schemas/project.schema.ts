import { z } from "zod";

const NAME_MAX_LENGTH = 120;
const PROJECT_KEY_PATTERN = /^[A-Z]{2,5}$/;

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do projeto.")
    .max(NAME_MAX_LENGTH, "O nome do projeto pode ter no máximo 120 caracteres."),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(PROJECT_KEY_PATTERN, "A chave do projeto tem de 2 a 5 letras, sem acento."),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
