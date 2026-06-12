import { Attachment } from '@/storage/domain/attachment';
import { AttachmentEntity } from '@/storage/persistence/entities/attachment.entity';

export class AttachmentMapper {
  static toDomain(raw: AttachmentEntity): Attachment {
    const a = new Attachment();
    a.id = raw.id;
    a.bucket = raw.bucket;
    a.object_key_prefix = raw.object_key_prefix;
    a.original_filename = raw.original_filename;
    a.content_type = raw.content_type;
    a.size_bytes = raw.size_bytes;
    a.kind = raw.kind;
    a.has_versions = raw.has_versions;
    a.owner_id = raw.owner_id;
    a.created_by = raw.created_by;
    a.updated_by = raw.updated_by;
    a.deleted_by = raw.deleted_by;
    a.created_at = raw.created_at;
    a.updated_at = raw.updated_at;
    a.deleted_at = raw.deleted_at;
    return a;
  }

  static toPersistence(domain: Attachment): AttachmentEntity {
    const e = new AttachmentEntity();
    if (domain.id !== undefined) e.id = domain.id;
    e.bucket = domain.bucket;
    e.object_key_prefix = domain.object_key_prefix;
    e.original_filename = domain.original_filename;
    e.content_type = domain.content_type;
    e.size_bytes = domain.size_bytes;
    e.kind = domain.kind;
    e.has_versions = domain.has_versions;
    e.owner_id = domain.owner_id;
    e.created_by = domain.created_by;
    e.updated_by = domain.updated_by;
    e.deleted_by = domain.deleted_by;
    e.created_at = domain.created_at;
    e.updated_at = domain.updated_at;
    e.deleted_at = domain.deleted_at;
    return e;
  }
}
