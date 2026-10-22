export const MAXIMUM_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const PREVIEWABLE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export function isPreviewable(contentType: string) {
  return PREVIEWABLE_TYPES.has(contentType);
}

export function isWithinTheSizeLimit(file: File) {
  return file.size > 0 && file.size <= MAXIMUM_ATTACHMENT_BYTES;
}
