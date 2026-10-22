export type AttachmentTargetKind = "card" | "cardTask" | "feature" | "epic";

export type AttachmentTarget = {
  kind: AttachmentTargetKind;
  id: string;
};

export type Attachment = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string | null;
  createdAt: string;
};

export type AttachmentUploadProgress = {
  fileName: string;
  percent: number;
};
