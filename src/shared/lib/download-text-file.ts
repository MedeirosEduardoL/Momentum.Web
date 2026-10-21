const MARKDOWN = "text/markdown;charset=utf-8";

export function downloadTextFile(fileName: string, content: string, type = MARKDOWN) {
  const address = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = address;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(address);
}
