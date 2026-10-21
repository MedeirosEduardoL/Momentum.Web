import { MarkdownContent } from "@/shared/ui/markdown-content";
import { Section } from "@/shared/ui/section";

type MarkdownSectionProps = {
  title: string;
  content: string;
  emptyText: string;
};

export function MarkdownSection({ title, content, emptyText }: MarkdownSectionProps) {
  return (
    <Section title={title}>
      {content ? (
        <MarkdownContent content={content} />
      ) : (
        <p className="text-ink-subtle">{emptyText}</p>
      )}
    </Section>
  );
}
