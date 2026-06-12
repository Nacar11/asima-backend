import sharp from 'sharp';
import { ImageProcessorService } from '@/storage/image-processor.service';

/** Build a solid-colour image of the given size in the given format. */
async function makeImage(
  width: number,
  height: number,
  format: 'png' | 'jpeg' = 'png',
): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 100, g: 150, b: 200 } },
  })
    [format]()
    .toBuffer();
}

describe('ImageProcessorService', () => {
  const processor = new ImageProcessorService();

  it('derives a preview (≤1600 long edge, WebP) and thumbnail (≤256 long edge, WebP)', async () => {
    const original = await makeImage(2000, 1000);

    const { preview, thumbnail } = await processor.deriveVersions(original);

    const previewMeta = await sharp(preview).metadata();
    expect(previewMeta.format).toBe('webp');
    expect(Math.max(previewMeta.width!, previewMeta.height!)).toBeLessThanOrEqual(1600);
    expect(previewMeta.width).toBe(1600); // 2000 → scaled down to the long-edge cap

    const thumbMeta = await sharp(thumbnail).metadata();
    expect(thumbMeta.format).toBe('webp');
    expect(Math.max(thumbMeta.width!, thumbMeta.height!)).toBeLessThanOrEqual(256);
  });

  it('does not upscale an image already smaller than the caps', async () => {
    const small = await makeImage(100, 80);

    const { preview } = await processor.deriveVersions(small);

    const meta = await sharp(preview).metadata();
    expect(meta.width).toBe(100); // unchanged — withoutEnlargement
  });

  it('rejects an image whose pixel count exceeds the input limit (image-bomb guard)', async () => {
    const tinyLimit = new ImageProcessorService(100); // 100-pixel cap
    const overLimit = await makeImage(11, 11); // 121 px > 100

    await expect(tinyLimit.deriveVersions(overLimit)).rejects.toThrow();
  });
});
