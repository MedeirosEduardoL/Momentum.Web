import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, gatewayRateLimit } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { registerAccount } from "../../api/account.service";
import type { SignUpFormValues } from "../schemas/sign-up.schema";
import { useSignUp } from "./use-sign-up";

vi.mock("../../api/account.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const validValues: SignUpFormValues = {
  name: "Ana Souza",
  email: "ana@exemplo.test",
};

async function signUp(values: SignUpFormValues) {
  const { result } = renderHook(() => useSignUp(), { wrapper: createQueryWrapper().wrapper });

  await act(async () => {
    result.current.form.reset(values);
    await result.current.onSubmit();
  });

  return result;
}

beforeEach(() => {
  vi.mocked(registerAccount).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
});

describe("useSignUp", () => {
  it("cadastra a conta e diz para qual e-mail o link foi enviado", async () => {
    const result = await signUp({ ...validValues, email: " Ana@Exemplo.Test " });

    expect(vi.mocked(registerAccount).mock.calls[0][0]).toEqual(validValues);
    await waitFor(() => expect(result.current.sentTo).toBe("ana@exemplo.test"));
  });

  it("não chama a API quando o schema recusa os campos", async () => {
    const result = await signUp({ name: "", email: "ana" });

    expect(registerAccount).not.toHaveBeenCalled();
    expect(result.current.sentTo).toBeNull();
    expect(result.current.form.getFieldState("name").error?.message).toBe("Informe o seu nome.");
  });

  it("põe no campo o erro do Core que vem com property", async () => {
    vi.mocked(registerAccount).mockRejectedValue(
      apiError(400, "AccountNameInvalid", "O nome não pode ter quebra de linha.", {
        property: "name",
      })
    );

    const result = await signUp(validValues);

    expect(result.current.form.getFieldState("name").error?.message).toBe(
      "O nome não pode ter quebra de linha."
    );
    expect(result.current.sentTo).toBeNull();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("pede para aguardar quando o Kong limita o cadastro", async () => {
    vi.mocked(registerAccount).mockRejectedValue(gatewayRateLimit);

    const result = await signUp(validValues);

    expect(toast.error).toHaveBeenCalledWith(
      "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo."
    );
    expect(result.current.sentTo).toBeNull();
  });
});
