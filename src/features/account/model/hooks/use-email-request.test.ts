import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, gatewayRateLimit } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { useRequestPasswordResetMutation } from "../../api/account.mutations";
import { requestPasswordReset } from "../../api/account.service";
import { useEmailRequest } from "./use-email-request";

vi.mock("../../api/account.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

async function request(email: string) {
  const { result } = renderHook(() => useEmailRequest(useRequestPasswordResetMutation()), {
    wrapper: createQueryWrapper().wrapper,
  });

  await act(async () => {
    result.current.form.setValue("email", email);
    await result.current.onSubmit();
  });

  return result;
}

beforeEach(() => {
  vi.mocked(requestPasswordReset).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
});

describe("useEmailRequest", () => {
  it("envia o pedido com o e-mail normalizado e marca como enviado", async () => {
    const result = await request(" Ana@Exemplo.Test ");

    expect(vi.mocked(requestPasswordReset).mock.calls[0][0]).toBe("ana@exemplo.test");
    await waitFor(() => expect(result.current.sentTo).toBe("ana@exemplo.test"));
  });

  it("não envia o que não é e-mail", async () => {
    const result = await request("ana@");

    expect(requestPasswordReset).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("email").error?.message).toBe(
      "Informe um e-mail válido."
    );
  });

  it("põe no campo o e-mail recusado pelo Core", async () => {
    vi.mocked(requestPasswordReset).mockRejectedValue(
      apiError(400, "AccountEmailInvalid", "Informe um e-mail válido.", { property: "email" })
    );

    const result = await request("ana@exemplo.test");

    expect(result.current.form.getFieldState("email").error?.message).toBe(
      "Informe um e-mail válido."
    );
    expect(result.current.sentTo).toBeNull();
  });

  it("pede para aguardar quando o Kong limita os pedidos", async () => {
    vi.mocked(requestPasswordReset).mockRejectedValue(gatewayRateLimit);

    const result = await request("ana@exemplo.test");

    expect(toast.error).toHaveBeenCalledWith(
      "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo."
    );
    expect(result.current.sentTo).toBeNull();
  });
});
