import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./client";
import { putOrDelete } from "./put-or-delete";

vi.mock("./client", () => ({ api: { put: vi.fn(), delete: vi.fn() } }));

const PATH = "/api/v1/cards/card-1/assignee";

beforeEach(() => {
  vi.mocked(api.put).mockReset().mockResolvedValue({ data: null });
  vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null });
});

describe("putOrDelete", () => {
  it("define o valor com PUT quando há corpo", async () => {
    await putOrDelete(PATH, { user_id: "user-1" });

    expect(api.put).toHaveBeenCalledWith(PATH, { user_id: "user-1" });
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("tira o valor com DELETE quando o corpo é nulo", async () => {
    await putOrDelete(PATH, null);

    expect(api.delete).toHaveBeenCalledWith(PATH);
    expect(api.put).not.toHaveBeenCalled();
  });

  it("repassa a falha da chamada", async () => {
    const failure = new Error("falha");
    vi.mocked(api.put).mockRejectedValue(failure);

    await expect(putOrDelete(PATH, { user_id: "user-1" })).rejects.toBe(failure);
  });
});
