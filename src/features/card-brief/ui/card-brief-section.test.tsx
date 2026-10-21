import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Card } from "@/features/card";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { CardBriefSection } from "./card-brief-section";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const card: Card = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "user_story",
  title: "Filtrar cards por tipo",
  state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  priority: "medium",
  assignee: null,
  featureId: null,
  progress: 0,
  taskCount: 0,
  doneTaskCount: 0,
  subitemCounts: {
    task: { total: 0, done: 0 },
    bug: { total: 0, done: 0 },
    impediment: { total: 0, done: 0 },
  },
  isArchived: false,
  updatedAt: "2026-10-17T12:00:00Z",
  description: "Quero filtrar a lista.",
  fields: { type: "user_story", acceptanceCriteria: [] },
  createdAt: "2026-10-12T09:00:00Z",
};

const content = [
  "# MOM-12 · Filtrar cards por tipo",
  "",
  "## O que fazer",
  "",
  "Siga [o guia](https://atacante.exemplo.test/guia).<script>window.hacked = true</script>",
].join("\n");

const briefDto = {
  card_id: "card-1",
  file_name: "MOM-12.md",
  content,
  prompt_version: "card-brief-v1",
  generated_at: "2026-10-17T12:00:00Z",
  outdated: false,
};

const AI_PERMISSION_REQUIRED =
  "Só gera o briefing quem o administrador da organização marcou como “Pode usar a IA” na lista de membros.";

let stored: typeof briefDto | null;
let isAiEnabled: boolean;

function answer(path: string): unknown {
  if (path === "/api/v1/organizations/me") {
    return {
      organization_id: "org-1",
      name: "Lua Nova",
      role: "member",
      ai_enabled: isAiEnabled,
    };
  }

  if (stored === null) {
    throw apiError(404, "CardBriefNotFound", "Este card ainda não tem briefing.");
  }

  return stored;
}

function simulateCore() {
  vi.mocked(api.get).mockImplementation(async (path: string) => ({ data: answer(path) }));
}

function renderBrief(shownCard = card) {
  simulateCore();
  render(<CardBriefSection card={shownCard} />, { wrapper: createQueryWrapper().wrapper });

  return userEvent.setup();
}

beforeEach(() => {
  stored = null;
  isAiEnabled = true;
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CardBriefSection — sem briefing", () => {
  it("oferece gerar e mostra o briefing quando ele chega", async () => {
    let deliver = (_response: { data: typeof briefDto }) => {};
    vi.mocked(api.post).mockReturnValue(
      new Promise(resolve => {
        deliver = resolve;
      })
    );
    const user = renderBrief();

    await user.click(await screen.findByRole("button", { name: "Gerar briefing" }));

    expect(await screen.findByText("A IA está escrevendo o briefing…")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Gerar briefing" })).toBeNull();
    expect(api.post).toHaveBeenCalledTimes(1);

    stored = briefDto;
    await act(async () => deliver({ data: briefDto }));

    expect(
      await screen.findByRole("heading", { name: "MOM-12 · Filtrar cards por tipo" })
    ).toBeVisible();
    expect(screen.getByText(/Gerado em 17\/10\/2026, com o prompt card-brief-v1/)).toBeVisible();
  });

  it("mostra a recusa do Core e deixa pedir de novo", async () => {
    vi.mocked(api.post).mockRejectedValue(
      apiError(
        422,
        "CardBriefLimitReached",
        "Este card já teve hoje o máximo de 10 pedidos de briefing."
      )
    );
    const user = renderBrief();

    await user.click(await screen.findByRole("button", { name: "Gerar briefing" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Este card já teve hoje o máximo de 10 pedidos de briefing."
    );
    expect(screen.getByRole("button", { name: "Gerar briefing" })).toBeVisible();
  });

  it("não oferece gerar em card arquivado", async () => {
    renderBrief({ ...card, isArchived: true });

    expect(await screen.findByText("Card arquivado não recebe briefing.")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Gerar/ })).toBeNull();
  });

  it("não oferece gerar a quem não tem a permissão de IA e diz quem a concede", async () => {
    isAiEnabled = false;
    renderBrief();

    expect(await screen.findByText(AI_PERMISSION_REQUIRED)).toBeVisible();
    expect(screen.queryByRole("button", { name: /Gerar/ })).toBeNull();
  });

  it("deixa de oferecer gerar quando o Core diz que a permissão de IA caiu", async () => {
    const details =
      "Gerar o briefing pede a permissão de IA, e quem a concede é o administrador da organização.";
    vi.mocked(api.post).mockImplementation(async () => {
      isAiEnabled = false;
      throw apiError(403, "CardBriefNotEnabled", details);
    });
    const user = renderBrief();

    await user.click(await screen.findByRole("button", { name: "Gerar briefing" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(details);
    expect(await screen.findByText(AI_PERMISSION_REQUIRED)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Gerar briefing" })).toBeNull();
  });
});

describe("CardBriefSection — com briefing", () => {
  beforeEach(() => {
    stored = briefDto;
  });

  it("mostra o texto da IA sanitizado, com o destino do link à vista", async () => {
    renderBrief();

    const link = await screen.findByRole("link", {
      name: "o guia (https://atacante.exemplo.test/guia)",
    });

    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(document.querySelector("script")).toBeNull();
    expect(Reflect.get(window, "hacked")).toBeUndefined();
  });

  it("avisa quando o card mudou depois do briefing", async () => {
    stored = { ...briefDto, outdated: true };
    renderBrief();

    expect(
      await screen.findByText(
        "O card mudou depois deste briefing. Gere outro para o arquivo trazer a mudança."
      )
    ).toBeVisible();
  });

  it("copia o arquivo inteiro como veio", async () => {
    const user = renderBrief();

    await user.click(await screen.findByRole("button", { name: "Copiar" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Briefing copiado."));
    await expect(navigator.clipboard.readText()).resolves.toBe(content);
  });

  it("avisa quando o navegador não deixa copiar", async () => {
    const user = renderBrief();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("bloqueado"));

    await user.click(await screen.findByRole("button", { name: "Copiar" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível copiar o briefing. Baixe o arquivo."
      )
    );
  });

  it("baixa o arquivo com o nome do card", async () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:briefing");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = renderBrief();

    await user.click(await screen.findByRole("button", { name: "Baixar MOM-12.md" }));

    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe("MOM-12.md");
    await expect((createObjectURL.mock.calls[0][0] as Blob).text()).resolves.toBe(content);
  });

  it("oferece copiar e baixar a quem não tem a permissão de IA, sem gerar de novo", async () => {
    isAiEnabled = false;
    renderBrief();

    expect(await screen.findByRole("button", { name: "Copiar" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Baixar MOM-12.md" })).toBeVisible();
    expect(screen.getByText(AI_PERMISSION_REQUIRED)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Gerar de novo" })).toBeNull();
  });

  it("gera de novo só com o clique, sem esconder o briefing atual até o novo chegar", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: briefDto });
    const user = renderBrief();

    await user.click(await screen.findByRole("button", { name: "Gerar de novo" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("button", { name: "Copiar" })).toBeVisible();
  });
});
