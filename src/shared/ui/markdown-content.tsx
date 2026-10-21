import DOMPurify from "dompurify";
import { marked } from "marked";
import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";

const EXTERNAL_LOAD_ATTRIBUTES = ["src", "srcset", "poster", "background"];
const OVERLAY_ATTRIBUTES = ["style", "class", "popover", "popovertarget"];

const SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "iframe", "form", "dialog"],
  FORBID_ATTR: [...EXTERNAL_LOAD_ATTRIBUTES, ...OVERLAY_ATTRIBUTES],
};

function isExternalHref(href: string | null) {
  if (!href || !URL.canParse(href, window.location.origin)) {
    return false;
  }

  return new URL(href, window.location.origin).origin !== window.location.origin;
}

function openExternalLinksSafely(node: Element) {
  if (node.tagName !== "A" || !isExternalHref(node.getAttribute("href"))) {
    return;
  }

  node.setAttribute("target", "_blank");
  node.setAttribute("rel", "noopener noreferrer");
}

function readDestination(href: string) {
  if (!URL.canParse(href, window.location.origin)) {
    return href;
  }

  const url = new URL(href, window.location.origin);
  url.username = "";
  url.password = "";

  return url.origin === window.location.origin
    ? `${url.pathname}${url.search}${url.hash}`
    : url.href;
}

function isWrittenOut(link: Element, destination: string) {
  const text = link.textContent?.trim();

  return link.childElementCount === 0 && (text === destination || `${text}/` === destination);
}

function showLinkDestination(node: Element) {
  const href = node.getAttribute("href");

  if (node.tagName !== "A" || !href) {
    return;
  }

  const destination = readDestination(href);

  if (!isWrittenOut(node, destination)) {
    node.append(` (${destination})`);
  }
}

const purifier = DOMPurify(window);
purifier.addHook("afterSanitizeAttributes", openExternalLinksSafely);

const linkRevealingPurifier = DOMPurify(window);
linkRevealingPurifier.addHook("afterSanitizeAttributes", openExternalLinksSafely);
linkRevealingPurifier.addHook("afterSanitizeAttributes", showLinkDestination);

function toSafeHtml(content: string, showsLinkDestination: boolean) {
  const sanitizer = showsLinkDestination ? linkRevealingPurifier : purifier;

  return sanitizer.sanitize(marked.parse(content, { async: false }), SANITIZE_CONFIG);
}

type MarkdownContentProps = {
  content: string;
  className?: string;
  showsLinkDestination?: boolean;
};

export function MarkdownContent({
  content,
  className,
  showsLinkDestination = false,
}: MarkdownContentProps) {
  const html = useMemo(
    () => toSafeHtml(content, showsLinkDestination),
    [content, showsLinkDestination]
  );

  return (
    <div className={cn("markdown-content", className)} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
