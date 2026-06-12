import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

/** WebP renditions derived from an uploaded image. `original` is stored separately. */
export type ProcessedVersions = {
  preview: Buffer;
  thumbnail: Buffer;
};

/** Long-edge pixel caps for the derived renditions. */
const PREVIEW_MAX_EDGE = 1600;
const THUMBNAIL_MAX_EDGE = 256;

/**
 * Default decode cap (~24 megapixels — comfortably above a 6000×4000 photo).
 * Bounds the *decoded* dimensions independent of byte size, so a crafted
 * "image bomb" (small file, enormous canvas) can't exhaust memory even
 * within the byte-size limit enforced by `file-validation`.
 */
const DEFAULT_MAX_INPUT_PIXELS = 24 * 1024 * 1024;

/**
 * Turns an uploaded image into `preview` + `thumbnail` WebP buffers. PDFs
 * never reach here — the orchestrator stores those as `original` only.
 */
@Injectable()
export class ImageProcessorService {
  constructor(private readonly maxInputPixels: number = DEFAULT_MAX_INPUT_PIXELS) {}

  async deriveVersions(original: Buffer): Promise<ProcessedVersions> {
    const [preview, thumbnail] = await Promise.all([
      this.toWebp(original, PREVIEW_MAX_EDGE),
      this.toWebp(original, THUMBNAIL_MAX_EDGE),
    ]);
    return { preview, thumbnail };
  }

  /**
   * Resize so the long edge is at most `maxEdge` (never upscaling) and
   * re-encode as WebP. `limitInputPixels` caps the decoded canvas — sharp
   * throws before allocating if the source exceeds it.
   */
  private toWebp(input: Buffer, maxEdge: number): Promise<Buffer> {
    return sharp(input, { limitInputPixels: this.maxInputPixels })
      .rotate() // honour EXIF orientation before stripping metadata
      .resize(maxEdge, maxEdge, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  }
}
