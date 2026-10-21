import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { session } from "@/shared/api/client";
import { networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { useSignOut } from "./use-sign-out";

vi.mock("@/shared/api/client", () => ({ session: { open: vi.fn(), close: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

beforeEach(() => {
  vi.mocked(session.close).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
});

describe("useSignOut", () => {
  it("encerra a sessão", async () => {
    const { result } = renderHook(() => useSignOut(), { wrapper: createQueryWrapper().wrapper });

    act(() => result.current.onSignOut());

    await waitFor(() => expect(session.close).toHaveBeenCalledTimes(1));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("avisa quando o servidor não confirma a saída", async () => {
    vi.mocked(session.close).mockRejectedValue(networkFailure);
    const { result } = renderHook(() => useSignOut(), { wrapper: createQueryWrapper().wrapper });

    act(() => result.current.onSignOut());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
      )
    );
  });
});
