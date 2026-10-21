import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { createOrganization } from "./first-access.service";

vi.mock("@/shared/api/client", () => ({ api: { post: vi.fn() } }));

beforeEach(() => {
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: {} });
});

describe("createOrganization", () => {
  it("cria a organização pelo nome", async () => {
    await createOrganization("Lua Nova");

    expect(api.post).toHaveBeenCalledWith("/api/v1/organizations", { name: "Lua Nova" });
  });
});
