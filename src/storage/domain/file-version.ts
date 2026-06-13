/**
 * The rendition of a stored file. Images get all three; PDFs (and any
 * non-image) store only `original`.
 *
 *   original  — the bytes as uploaded, unmodified.
 *   preview   — ≤1600px long edge, WebP (in-app viewing).
 *   thumbnail — ≤256px long edge, WebP (list/grid).
 */
export const FILE_VERSIONS = {
  original: 'original',
  preview: 'preview',
  thumbnail: 'thumbnail',
} as const;

export type FileVersion = (typeof FILE_VERSIONS)[keyof typeof FILE_VERSIONS];

/** Image-only renditions derived by the processor. `original` is universal. */
export const DERIVED_VERSIONS: FileVersion[] = [FILE_VERSIONS.preview, FILE_VERSIONS.thumbnail];
