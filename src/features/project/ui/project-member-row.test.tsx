import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/test/query-wrapper";
import type { ProjectMember } from "../model/types/project.types";
import { ProjectMemberRow } from "./project-member-row";

const member: ProjectMember = {
  userId: "user-1",
  name: "Ana Souza",
  email: "ana@exemplo.test",
  role: "administrator",
};

function renderRow(isSelf: boolean, onRemove = vi.fn().mockResolvedValue(undefined)) {
  render(
    <ul>
      <ProjectMemberRow
        member={member}
        isSelf={isSelf}
        canAdminister
        pendingRoleChange={null}
        onRoleChange={vi.fn()}
        onRemove={onRemove}
      />
    </ul>,
    { wrapper: createQueryWrapper().wrapper }
  );

  return { user: userEvent.setup(), onRemove };
}

describe("ProjectMemberRow — sair do time", () => {
  it("pede confirmação para a própria conta sair do time e avisa dos cards", async () => {
    const { user, onRemove } = renderRow(true);

    await user.click(screen.getByRole("button", { name: "Sair do time" }));

    const dialog = await screen.findByRole("dialog", { name: "Sair do time do projeto?" });
    expect(dialog).toHaveTextContent("os cards em que você é responsável ficam sem responsável");
    expect(onRemove).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Sair do time" }));

    expect(onRemove).toHaveBeenCalledWith(member);
  });

  it("avisa dos cards também ao tirar outra pessoa do time", async () => {
    const { user } = renderRow(false);

    await user.click(screen.getByRole("button", { name: "Tirar do time" }));

    expect(
      await screen.findByRole("dialog", { name: "Tirar Ana Souza do time?" })
    ).toHaveTextContent("os cards em que é responsável ficam sem responsável");
  });
});
