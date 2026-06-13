import { UnprocessableEntityException } from '@nestjs/common';
import { validateUpload } from '@/storage/file-validation';

/** Minimal real magic-byte headers padded to a plausible size. */
const headers = {
  jpeg: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  webp: Buffer.concat([
    Buffer.from('RIFF'),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    Buffer.from('WEBP'),
  ]),
  pdf: Buffer.from('%PDF-1.7\n...'),
  gif: Buffer.from('GIF89a'),
};

function pad(head: Buffer, bytes = 1024): Buffer {
  return Buffer.concat([head, Buffer.alloc(bytes)]);
}

describe('validateUpload', () => {
  it('accepts JPEG by magic bytes and reports kind=image', () => {
    expect(validateUpload(pad(headers.jpeg), 10)).toEqual({
      kind: 'image',
      mime: 'image/jpeg',
      ext: 'jpg',
    });
  });

  it('accepts PNG', () => {
    expect(validateUpload(pad(headers.png), 10)).toMatchObject({ kind: 'image', ext: 'png' });
  });

  it('accepts WebP', () => {
    expect(validateUpload(pad(headers.webp), 10)).toMatchObject({ kind: 'image', ext: 'webp' });
  });

  it('accepts PDF and reports kind=pdf', () => {
    expect(validateUpload(pad(headers.pdf), 10)).toEqual({
      kind: 'pdf',
      mime: 'application/pdf',
      ext: 'pdf',
    });
  });

  it('rejects a disallowed type (GIF) with 422', () => {
    expect(() => validateUpload(pad(headers.gif), 10)).toThrow(UnprocessableEntityException);
  });

  it('rejects a spoofed MIME — bytes are sniffed, not trusted', () => {
    // A JS text file that *claims* to be a PNG is rejected on its real bytes.
    const textPretendingToBePng = Buffer.from('<script>alert(1)</script>');
    expect(() => validateUpload(textPretendingToBePng, 10)).toThrow(UnprocessableEntityException);
  });

  it('enforces the size cap BEFORE type sniffing', () => {
    // An oversize but otherwise valid JPEG is rejected for size, not type —
    // proving the size guard runs before the sniff.
    const big = pad(headers.jpeg, 11 * 1024 * 1024);
    let thrown: UnprocessableEntityException | undefined;
    try {
      validateUpload(big, 10);
    } catch (e) {
      thrown = e as UnprocessableEntityException;
    }
    expect(thrown).toBeInstanceOf(UnprocessableEntityException);
    expect((thrown!.getResponse() as { errors: { file: string } }).errors.file).toMatch(
      /size limit/i,
    );
  });

  it('rejects an empty buffer', () => {
    expect(() => validateUpload(Buffer.alloc(0), 10)).toThrow(UnprocessableEntityException);
  });
});
