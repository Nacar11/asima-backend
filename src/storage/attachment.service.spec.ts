import { UnprocessableEntityException } from '@nestjs/common';
import sharp from 'sharp';
import { AttachmentService } from '@/storage/attachment.service';
import { BaseStorageService } from '@/storage/base-storage.service';
import { ImageProcessorService } from '@/storage/image-processor.service';
import { BaseAttachmentRepository } from '@/storage/persistence/base-attachment.repository';
import { StoredObject } from '@/storage/domain/stored-object';

function makePng(width = 40, height = 30): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 1, g: 2, b: 3 } },
  })
    .png()
    .toBuffer();
}

const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(2048)]);

describe('AttachmentService', () => {
  let storage: jest.Mocked<Pick<BaseStorageService, 'put' | 'delete' | 'getStream' | 'exists'>>;
  let repo: jest.Mocked<Pick<BaseAttachmentRepository, 'create' | 'findById'>>;
  let service: AttachmentService;

  beforeEach(() => {
    storage = {
      put: jest.fn(
        async (input): Promise<StoredObject> => ({
          bucket: 'asima',
          key: input.key,
          content_type: input.content_type,
          size_bytes: input.body.length,
        }),
      ),
      delete: jest.fn(async (_key: string) => undefined),
      getStream: jest.fn(async (_key: string) => undefined as never),
      exists: jest.fn(async (_key: string) => true),
    };
    repo = { create: jest.fn(), findById: jest.fn() };
    service = new AttachmentService(
      storage as unknown as BaseStorageService,
      new ImageProcessorService(),
      repo as unknown as BaseAttachmentRepository,
      // config: maxFileMb
      { getOrThrow: () => ({ bucket: 'asima', maxFileMb: 10 }) } as never,
    );
  });

  it('uploads original + preview + thumbnail for an image and flags has_versions', async () => {
    const buffer = await makePng();

    const prepared = await service.uploadForOwner({
      file: { buffer, originalname: 'cert.png' },
      owner_id: 12,
      actor_id: 12,
    });

    expect(storage.put).toHaveBeenCalledTimes(3);
    const keys = storage.put.mock.calls.map((c) => c[0].key);
    expect(keys).toEqual([
      `${prepared.object_key_prefix}/original.png`,
      `${prepared.object_key_prefix}/preview.webp`,
      `${prepared.object_key_prefix}/thumbnail.webp`,
    ]);
    expect(prepared).toMatchObject({
      kind: 'image',
      has_versions: true,
      content_type: 'image/png',
      original_filename: 'cert.png',
      owner_id: 12,
    });
    expect(prepared.object_key_prefix).toMatch(/^leave-attachments\//);
  });

  it('uploads only the original for a PDF (no versions)', async () => {
    const prepared = await service.uploadForOwner({
      file: { buffer: PDF, originalname: 'note.pdf' },
      owner_id: 5,
      actor_id: 5,
    });

    expect(storage.put).toHaveBeenCalledTimes(1);
    expect(storage.put.mock.calls[0][0].key).toBe(`${prepared.object_key_prefix}/original.pdf`);
    expect(prepared).toMatchObject({ kind: 'pdf', has_versions: false });
  });

  it('rejects an unsupported type before any upload', async () => {
    await expect(
      service.uploadForOwner({
        file: { buffer: Buffer.from('GIF89a....'), originalname: 'x.gif' },
        owner_id: 1,
        actor_id: 1,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('cleanup best-effort deletes every uploaded object', async () => {
    const prepared = await service.uploadForOwner({
      file: { buffer: PDF, originalname: 'note.pdf' },
      owner_id: 5,
      actor_id: 5,
    });

    await service.cleanup(prepared);
    expect(storage.delete).toHaveBeenCalledWith(`${prepared.object_key_prefix}/original.pdf`);
  });

  it('cleanup swallows delete failures (orphan sweep is out of scope)', async () => {
    storage.delete.mockRejectedValueOnce(new Error('network'));
    const prepared = await service.uploadForOwner({
      file: { buffer: PDF, originalname: 'note.pdf' },
      owner_id: 5,
      actor_id: 5,
    });
    await expect(service.cleanup(prepared)).resolves.toBeUndefined();
  });

  it('objectKeyFor builds the version key from the stored prefix + content type', () => {
    const attachment = {
      object_key_prefix: 'leave-attachments/abc',
      content_type: 'image/jpeg',
      kind: 'image' as const,
      has_versions: true,
    };
    expect(service.objectKeyFor(attachment, 'original')).toBe('leave-attachments/abc/original.jpg');
    expect(service.objectKeyFor(attachment, 'preview')).toBe('leave-attachments/abc/preview.webp');
    expect(service.objectKeyFor(attachment, 'thumbnail')).toBe(
      'leave-attachments/abc/thumbnail.webp',
    );
  });
});
