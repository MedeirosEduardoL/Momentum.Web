import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Project } from "../model/types/project.types";
import { ProjectTile } from "./project-tile";

const project: Project = { id: "project-1", name: "Atendimento", key: "ATD", role: "member" };

describe("ProjectTile", () => {
  it("mostra a chave, o nome como link, o papel da pessoa e os atalhos do projeto", () => {
    render(
      <ul>
        <ProjectTile
          project={project}
          nameLink={<a href="/projetos/project-1/boards">{project.name}</a>}
          action={<a href="/boards">Boards</a>}
        />
      </ul>
    );

    expect(screen.getByText("ATD")).toBeVisible();
    expect(screen.getByRole("link", { name: "Atendimento" })).toHaveAttribute(
      "href",
      "/projetos/project-1/boards"
    );
    expect(screen.getByText("Membro")).toBeVisible();
    expect(screen.getByRole("link", { name: "Boards" })).toBeVisible();
  });
});
