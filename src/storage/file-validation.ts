import { unprocessable } from '@/utils/helpers/http-errors';

/** What an attachment is, persistence-side. Images get versions; PDFs don't. */
export type FileKind = 'image' | 'pdf';

export type SniffedType = {
  kind: FileKind;
  mime: string;
  ext: 'jpg' | 'png' | 'webp' | 'pdf';
};

/**
 * Magic-byte signatures for the only types we accept. The client-sent MIME
 * is NEVER trusted — a spoofed `Content-Type` can't smuggle an executable
 * past this. WebP needs a two-part check ("RIFF"…"WEBP").
 */
function sniff(buffer: Buffer): SniffedType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { kind: 'image', mime: 'image/jpeg', ext: 'jpg' };
  }
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buffer.length >= 8 && PNG.every((b, i) => buffer[i] === b)) {
    return { kind: 'image', mime: 'image/png', ext: 'png' };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { kind: 'image', mime: 'image/webp', ext: 'webp' };
  }
  if (buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') {
    return { kind: 'pdf', mime: 'application/pdf', ext: 'pdf' };
  }
  return null;
}

/**
 * Validate an uploaded buffer. **Size is checked first** (before any
 * type sniffing or downstream image processing) so an out-of-bound buffer
 * is rejected at the boundary and sharp never runs on it. Then the real
 * bytes are sniffed against the allow-list (JPEG / PNG / WebP / PDF).
 * Throws 422 on oversize, empty, or disallowed type.
 */
export function validateUpload(buffer: Buffer, maxFileMb: number): SniffedType {
  if (buffer.length === 0) {
    throw unprocessable('file', 'File is empty.');
  }
  const maxBytes = maxFileMb * 1024 * 1024;
  if (buffer.length > maxBytes) {
    throw unprocessable('file', `File exceeds the ${maxFileMb} MB size limit.`);
  }
  const sniffed = sniff(buffer);
  if (!sniffed) {
    throw unprocessable('file', 'Unsupported file type. Allowed: JPEG, PNG, WebP, PDF.');
  }
  return sniffed;
}
