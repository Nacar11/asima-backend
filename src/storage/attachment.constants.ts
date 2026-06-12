/**
 * What a stored attachment is. Images carry derived versions (preview +
 * thumbnail); PDFs are stored as `original` only. Postgres enum +
 * const-object pattern (mirrors the leave-request enums).
 */
export const ATTACHMENT_KINDS = {
  image: 'image',
  pdf: 'pdf',
} as const;

export type AttachmentKind = (typeof ATTACHMENT_KINDS)[keyof typeof ATTACHMENT_KINDS];

/** Object-key prefix namespace for leave-request attachments. */
export const LEAVE_ATTACHMENT_PREFIX = 'leave-attachments';
