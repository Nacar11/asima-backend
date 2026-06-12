import { EntityManager } from 'typeorm';
import { Attachment } from '@/storage/domain/attachment';
import { AttachmentKind } from '@/storage/attachment.constants';

export type CreateAttachmentInput = {
  bucket: string;
  object_key_prefix: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  kind: AttachmentKind;
  has_versions: boolean;
  owner_id: number;
  created_by?: number | null;
};

export abstract class BaseAttachmentRepository {
  /**
   * Insert an attachment row. When a `manager` is passed the insert joins
   * that transaction — the leave submit inserts the attachment + the
   * leave_request in one short transaction.
   */
  abstract create(input: CreateAttachmentInput, manager?: EntityManager): Promise<Attachment>;

  abstract findById(id: number): Promise<Attachment | null>;
}
