import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListProjectMembers } from "@/features/project";
import { createQueryWrapper } from "@/test/query-wrapper";
import { deleteAttachment, listAttachments, uploadAttachment } from "../api/attachment.service";
import type { Attachment } from "../model/types/attachment.types";
import { AttachmentPanel } from "./attachment-panel";

vi.mock("../api/attachment.service");
vi.mock("@/features/project", () => ({ useListProjectMembers: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const attachment: Attachment = {
  id: "attachment-1",
  fileName: "fluxo.png",
  contentType: "image/png",
  sizeBytes: 1536,
  uploadedBy: "user-1",
  createdAt: "2026-10-22T10:00:00Z",
};

function renderPanel() {
  render(<AttachmentPanel target={{ kind: "card", id: "card-1" }} projectId="project-1" />, {
    wrapper: createQueryWrapper().wrapper,
  });

  return userEvent.setup();
}

beforeEach(() => {
  vi.mocked(useListProjectMembers).mockReturnValue({
    data: [{ userId: "user-1", name: "Ana Souza", email: "ana@exemplo.test", role: "member" }],
  } as unknown as ReturnType<typeof useListProjectMembers>);
  vi.mocked(listAttachments).mockReset().mockResolvedValue([attachment]);
  vi.mocked(uploadAttachment).mockReset().mockResolvedValue(attachment);
  vi.mocked(deleteAttachment).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
});

describe("AttachmentPanel", () => {
  it("lista cada anexo com o tamanho, quem enviou e a prévia só para imagem", async () => {
    renderPanel();

    const list = within(await screen.findByRole("list", { name: "Anexos" }));
    expect(list.getByText("fluxo.png")).toBeVisible();
    expect(list.getByText(/1,5 KB · Ana Souza/)).toBeVisible();
    expect(list.getByRole("button", { name: "Visualizar" })).toBeVisible();
    expect(list.getByRole("button", { name: "Baixar fluxo.png" })).toBeVisible();
  });

  it("envia o arquivo escolhido para o item", async () => {
    const user = renderPanel();
    const file = new File(["log"], "log.txt", { type: "text/plain" });

    await user.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, file);

    await waitFor(() => expect(uploadAttachment).toHaveBeenCalledOnce());
    expect(vi.mocked(uploadAttachment).mock.calls[0][0]).toEqual({ kind: "card", id: "card-1" });
    expect(vi.mocked(uploadAttachment).mock.calls[0][1]).toBe(file);
  });

  it("recusa na tela o arquivo acima de 20 MB, sem enviar", async () => {
    const user = renderPanel();
    const huge = new File(["x"], "video.mp4", { type: "video/mp4" });
    Object.defineProperty(huge, "size", { value: 21 * 1024 * 1024 });

    await user.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, huge);

    await waitFor(() => expect(toast.error).toHaveBeenCalledOnce());
    expect(uploadAttachment).not.toHaveBeenCalled();
  });

  it("exclui o anexo depois da confirmação", async () => {
    const user = renderPanel();

    await user.click(await screen.findByRole("button", { name: "Excluir fluxo.png" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Excluir" }));

    await waitFor(() =>
      expect(deleteAttachment).toHaveBeenCalledWith("attachment-1", expect.anything())
    );
  });
});
