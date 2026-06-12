import { Attachment } from '@/storage/domain/attachment';
import { AttachmentEntity } from '@/storage/persistence/entities/attachment.entity';
import { AttachmentMapper } from '@/storage/persistence/mappers/attachment.mapper';

describe('AttachmentMapper', () => {
  const now = new Date('2026-06-12T10:00:00.000Z');

  function entity(): AttachmentEntity {
    const e = new AttachmentEntity();
    e.id = 7;
    e.bucket = 'asima';
    e.object_key_prefix = 'leave-attachments/3f8c1e2a-1b2c-4d5e-9f01-2a3b4c5d6e7f';
    e.original_filename = 'medical-certificate.pdf';
    e.content_type = 'application/pdf';
    e.size_bytes = 24576;
    e.kind = 'pdf';
    e.has_versions = false;
    e.owner_id = 12;
    e.created_by = 12;
    e.updated_by = 12;
    e.deleted_by = null;
    e.created_at = now;
    e.updated_at = now;
    e.deleted_at = null;
    return e;
  }

  it('toDomain copies every field', () => {
    const domain = AttachmentMapper.toDomain(entity());
    expect(domain).toBeInstanceOf(Attachment);
    expect(domain).toMatchObject({
      id: 7,
      bucket: 'asima',
      object_key_prefix: 'leave-attachments/3f8c1e2a-1b2c-4d5e-9f01-2a3b4c5d6e7f',
      original_filename: 'medical-certificate.pdf',
      content_type: 'application/pdf',
      size_bytes: 24576,
      kind: 'pdf',
      has_versions: false,
      owner_id: 12,
      deleted_at: null,
    });
  });

  it('round-trips domain → entity → domain without loss', () => {
    const original = AttachmentMapper.toDomain(entity());
    const back = AttachmentMapper.toDomain(AttachmentMapper.toPersistence(original));
    expect(back).toEqual(original);
  });

  it('preserves the image kind + has_versions flag', () => {
    const e = entity();
    e.kind = 'image';
    e.has_versions = true;
    e.content_type = 'image/webp';
    const domain = AttachmentMapper.toDomain(e);
    expect(domain.kind).toBe('image');
    expect(domain.has_versions).toBe(true);
  });
});
