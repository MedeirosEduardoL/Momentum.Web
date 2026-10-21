import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { OrganizationMemberList } from "./organization-member-list";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

type Role = "administrator" | "member";

const MEMBER_PATH = "/api/v1/organizations/me/members/user-2";

let membersDto = [
  {
    user_id: "user-1",
    name: "Ana Souza",
    email: "ana@exemplo.test",
    role: "administrator",
    ai_enabled: true,
  },
  {
    user_id: "user-2",
    name: "Bia Lima",
    email: "bia@exemplo.test",
    role: "member",
    ai_enabled: false,
  },
];

function simulateCore(role: Role) {
  const responses: Record<string, () => unknown> = {
    "/api/v1/accounts/me": () => ({
      user_id: "user-1",
      name: "Ana Souza",
      email: "ana@exemplo.test",
    }),
    "/api/v1/organizations/me": () => ({
      organization_id: "org-1",
      name: "Lua Nova",
      role,
      ai_enabled: true,
    }),
    "/api/v1/organizations/me/members": () => membersDto,
  };

  vi.mocked(api.get).mockImplementation(async (path: string) => ({ data: responses[path]() }));
}

function renderMembers(role: Role) {
  simulateCore(role);
  render(<OrganizationMemberList />, { wrapper: createQueryWrapper().wrapper });

  return userEvent.setup();
}

async function findRow(name: string) {
  const row = (await screen.findByText(name)).closest("li");

  if (!row) {
    throw new Error(`Linha de ${name} não encontrada.`);
  }

  return within(row);
}

beforeEach(() => {
  membersDto = membersDto.map(member => ({
    ...member,
    ai_enabled: member.user_id === "user-1",
  }));
  vi.mocked(api.get).mockReset();
  vi.mocked(api.patch).mockReset().mockResolvedValue({ data: null });
  vi.mocked(toast.error).mockClear();
});

describe("OrganizationMemberList — quem pode usar a IA", () => {
  it("mostra ao administrador da organização a marcação de cada membro", async () => {
    renderMembers("administrator");

    expect(await screen.findByRole("checkbox", { name: "Ana Souza pode usar a IA" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Bia Lima pode usar a IA" })).not.toBeChecked();
  });

  it("concede a permissão de IA ao membro ao marcar, sem botão de salvar", async () => {
    vi.mocked(api.patch).mockImplementation(async () => {
      membersDto = membersDto.map(member => ({ ...member, ai_enabled: true }));
      return { data: null };
    });
    const user = renderMembers("administrator");
    const bia = await screen.findByRole("checkbox", {
      name: "Bia Lima pode usar a IA",
    });

    await user.click(bia);

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(MEMBER_PATH, { ai_enabled: true }));
    await waitFor(() => expect(bia).toBeEnabled());
    expect(bia).toBeChecked();
  });

  it("retira a permissão de IA ao desmarcar", async () => {
    const user = renderMembers("administrator");

    await user.click(await screen.findByRole("checkbox", { name: "Ana Souza pode usar a IA" }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/api/v1/organizations/me/members/user-1", {
        ai_enabled: false,
      })
    );
  });

  it("volta a marcação ao que vale e mostra a recusa do Core", async () => {
    vi.mocked(api.patch).mockRejectedValue(
      apiError(403, "AccessDenied", "Você não tem permissão para esta operação.")
    );
    const user = renderMembers("administrator");
    const bia = await screen.findByRole("checkbox", {
      name: "Bia Lima pode usar a IA",
    });

    await user.click(bia);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Você não tem permissão para esta operação.")
    );
    await waitFor(() => expect(bia).toBeEnabled());
    expect(bia).not.toBeChecked();
  });

  it("mostra ao membro quem pode usar a IA, sem deixar mudar", async () => {
    renderMembers("member");

    expect((await findRow("Ana Souza")).getByText("Pode usar a IA")).toBeVisible();
    expect((await findRow("Bia Lima")).queryByText("Pode usar a IA")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});

describe("OrganizationMemberList — o próprio papel", () => {
  it("pede confirmação antes de mudar o próprio papel e só muda depois dela", async () => {
    const user = renderMembers("administrator");
    const row = await findRow("ana@exemplo.test");

    await user.selectOptions(
      row.getByRole("combobox", { name: "Papel de Ana Souza na organização" }),
      "member"
    );

    const dialog = await screen.findByRole("dialog", { name: "Mudar o seu próprio papel?" });
    expect(api.patch).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Mudar o meu papel" }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/api/v1/organizations/me/members/user-1", {
        role: "member",
      })
    );
  });

  it("não muda o próprio papel quando a pessoa volta atrás", async () => {
    const user = renderMembers("administrator");
    const row = await findRow("ana@exemplo.test");

    await user.selectOptions(
      row.getByRole("combobox", { name: "Papel de Ana Souza na organização" }),
      "member"
    );
    await user.click(
      within(await screen.findByRole("dialog", { name: "Mudar o seu próprio papel?" })).getByRole(
        "button",
        { name: "Voltar" }
      )
    );

    expect(api.patch).not.toHaveBeenCalled();
    expect(row.getByRole("combobox", { name: "Papel de Ana Souza na organização" })).toHaveValue(
      "administrator"
    );
  });

  it("muda o papel de outra pessoa sem confirmação", async () => {
    const user = renderMembers("administrator");
    const row = await findRow("Bia Lima");

    await user.selectOptions(
      row.getByRole("combobox", { name: "Papel de Bia Lima na organização" }),
      "administrator"
    );

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith(MEMBER_PATH, { role: "administrator" })
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
