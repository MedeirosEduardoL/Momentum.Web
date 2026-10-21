import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGetCurrentOrganization } from "@/features/organization";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { generateCardBrief } from "../../api/card-brief.service";
import { useGenerateCardBrief } from "./use-generate-card-brief";

vi.mock("../../api/card-brief.service");
vi.mock("@/features/organization", () => ({ useGetCurrentOrganization: vi.fn() }));

type OrganizationResult = ReturnType<typeof useGetCurrentOrganization>;

const refetchOrganization = vi.fn<OrganizationResult["refetch"]>();

beforeEach(() => {
  vi.mocked(generateCardBrief).mockReset();
  refetchOrganization.mockReset();
  vi.mocked(useGetCurrentOrganization).mockReturnValue({
    refetch: refetchOrganization,
  } as unknown as OrganizationResult);
});

describe("useGenerateCardBrief", () => {
  it("não pede dois briefings ao mesmo tempo", async () => {
    let finish = () => {};
    vi.mocked(generateCardBrief).mockReturnValue(
      new Promise(resolve => {
        finish = () =>
          resolve({
            cardId: "card-1",
            fileName: "MOM-12.md",
            content: "# MOM-12",
            promptVersion: "card-brief-v1",
            generatedAt: "2026-10-17T12:00:00Z",
            isOutdated: false,
          });
      })
    );
    const { result } = renderHook(() => useGenerateCardBrief("card-1"), {
      wrapper: createQueryWrapper().wrapper,
    });

    act(() => void result.current.generate());
    await act(() => result.current.generate());
    await act(async () => finish());

    expect(generateCardBrief).toHaveBeenCalledTimes(1);
  });

  it("guarda a falha sem tentar de novo sozinho", async () => {
    const refusal = apiError(424, "AiNotConfigured", "Os recursos de IA não estão configurados.");
    vi.mocked(generateCardBrief).mockRejectedValue(refusal);
    const { result } = renderHook(() => useGenerateCardBrief("card-1"), {
      wrapper: createQueryWrapper().wrapper,
    });

    await act(() => result.current.generate());

    expect(result.current.failure).toBe(refusal);
    expect(generateCardBrief).toHaveBeenCalledTimes(1);
    expect(refetchOrganization).not.toHaveBeenCalled();
  });

  it("relê a permissão quando o Core diz que a pessoa não pode usar a IA", async () => {
    const refusal = apiError(
      403,
      "CardBriefNotEnabled",
      "Gerar o briefing pede a permissão de IA, e quem a concede é o administrador da organização."
    );
    vi.mocked(generateCardBrief).mockRejectedValue(refusal);
    const { result } = renderHook(() => useGenerateCardBrief("card-1"), {
      wrapper: createQueryWrapper().wrapper,
    });

    await act(() => result.current.generate());

    expect(result.current.failure).toBe(refusal);
    expect(refetchOrganization).toHaveBeenCalledTimes(1);
  });
});
