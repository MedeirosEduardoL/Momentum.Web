import { downloadBlob } from "./download-blob";

const MARKDOWN = "text/markdown;charset=utf-8";

export function downloadTextFile(fileName: string, content: string, type = MARKDOWN) {
  downloadBlob(fileName, new Blob([content], { type }));
}
