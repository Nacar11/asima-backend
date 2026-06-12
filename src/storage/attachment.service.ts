import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { AllConfigType } from '@/config/config.type';
import { BaseStorageService } from '@/storage/base-storage.service';
import { ImageProcessorService } from '@/storage/image-processor.service';
import { validateUpload } from '@/storage/file-validation';
import { Attachment } from '@/storage/domain/attachment';
import { FileVersion, FILE_VERSIONS } from '@/storage/domain/file-version';
import { BaseAttachmentRepository } from '@/storage/persistence/base-attachment.repository';
import { AttachmentKind, LEAVE_ATTACHMENT_PREFIX } from '@/storage/attachment.constants';

/** A raw uploaded file — the subset of multer's File we depend on. */
export type UploadedFile = {
  buffer: Buffer;
  originalname: string;
};

export type UploadAttachmentInput = {
  file: UploadedFile;
  owner_id: number;
  actor_id: number;
  /** Object-key namespace. Defaults to the leave-attachments prefix. */
  namespace?: string;
};

/**
 * The product of `uploadForOwner`: the objects are already written to
 * storage; `persist` inserts the DB row (inside the caller's transaction)
 * and `cleanup` rolls the objects back if the transaction fails.
 */
export type PreparedAttachment = {
  object_key_prefix: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  kind: AttachmentKind;
  has_versions: boolean;
  owner_id: number;
  created_by: number;
  /** Every object key written, for the compensating delete. */
  uploaded_keys: string[];
};

/** The attachment fields needed to rebuild a version's object key. */
type KeyableAttachment = Pick<
  Attachment,
  'object_key_prefix' | 'content_type' | 'kind' | 'has_versions'
>;

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

/**
 * Orchestrates the storage side of an attachment: **validate → process →
 * upload → (persist) → return id (+ rollback handle)**. Keeps every storage
 * concern out of the consumer service (e.g. `LeaveRequestsService`), so the
 * leave service stays focused on leave rules and every future consumer
 * reuses this same seam. Depends only on the storage port, the image
 * processor, and the attachments repository — all mockable.
 */
@Injectable()
export class AttachmentService {
  private readonly logger = new Logger(AttachmentService.name);
  private readonly bucket: string;
  private readonly maxFileMb: number;

  constructor(
    private readonly storage: BaseStorageService,
    private readonly imageProcessor: ImageProcessorService,
    private readonly repository: BaseAttachmentRepository,
    configService: ConfigService<AllConfigType>,
  ) {
    const cfg = configService.getOrThrow('storage', { infer: true });
    this.bucket = cfg.bucket;
    this.maxFileMb = cfg.maxFileMb;
  }

  /**
   * Validate the bytes (size-first, then magic-byte sniff), derive image
   * versions, and upload every object under a fresh UUID prefix — all
   * **before** any DB transaction is opened. Returns a handle the caller
   * persists (inside its transaction) and, on failure, cleans up.
   */
  async uploadForOwner(input: UploadAttachmentInput): Promise<PreparedAttachment> {
    const { buffer } = input.file;
    const sniffed = validateUpload(buffer, this.maxFileMb);

    const namespace = input.namespace ?? LEAVE_ATTACHMENT_PREFIX;
    const object_key_prefix = `${namespace}/${uuid()}`;
    const uploaded_keys: string[] = [];

    const originalKey = `${object_key_prefix}/original.${sniffed.ext}`;
    await this.storage.put({ key: originalKey, body: buffer, content_type: sniffed.mime });
    uploaded_keys.push(originalKey);

    let has_versions = false;
    if (sniffed.kind === 'image') {
      const { preview, thumbnail } = await this.imageProcessor.deriveVersions(buffer);
      const previewKey = `${object_key_prefix}/preview.webp`;
      const thumbnailKey = `${object_key_prefix}/thumbnail.webp`;
      await this.storage.put({ key: previewKey, body: preview, content_type: 'image/webp' });
      uploaded_keys.push(previewKey);
      await this.storage.put({ key: thumbnailKey, body: thumbnail, content_type: 'image/webp' });
      uploaded_keys.push(thumbnailKey);
      has_versions = true;
    }

    return {
      object_key_prefix,
      original_filename: input.file.originalname,
      content_type: sniffed.mime,
      size_bytes: buffer.length,
      kind: sniffed.kind,
      has_versions,
      owner_id: input.owner_id,
      created_by: input.actor_id,
      uploaded_keys,
    };
  }

  /**
   * Insert the attachment row for an already-uploaded file. Runs inside the
   * caller's `manager` so it commits atomically with the consumer row
   * (e.g. the leave_request).
   */
  persist(prepared: PreparedAttachment, manager: EntityManager): Promise<Attachment> {
    return this.repository.create(
      {
        bucket: this.bucket,
        object_key_prefix: prepared.object_key_prefix,
        original_filename: prepared.original_filename,
        content_type: prepared.content_type,
        size_bytes: prepared.size_bytes,
        kind: prepared.kind,
        has_versions: prepared.has_versions,
        owner_id: prepared.owner_id,
        created_by: prepared.created_by,
      },
      manager,
    );
  }

  /**
   * Best-effort delete of every uploaded object — the compensating action
   * when the DB transaction fails after the objects were written. Storage
   * can't enlist in the SQL transaction, so this is eventual; failures are
   * logged (a periodic orphan sweep is out of scope).
   */
  async cleanup(prepared: PreparedAttachment): Promise<void> {
    for (const key of prepared.uploaded_keys) {
      try {
        await this.storage.delete(key);
      } catch (err) {
        this.logger.error(
          `Failed to clean up orphaned object ${key}: ${(err as Error).message}`,
        );
      }
    }
  }

  async findById(id: number): Promise<Attachment | null> {
    return this.repository.findById(id);
  }

  /**
   * The object key for a stored attachment's version. `original` carries the
   * source extension (derived from the stored content type); derived
   * versions are always WebP.
   */
  objectKeyFor(attachment: KeyableAttachment, version: FileVersion): string {
    if (version === FILE_VERSIONS.original) {
      const ext = EXT_BY_MIME[attachment.content_type] ?? 'bin';
      return `${attachment.object_key_prefix}/original.${ext}`;
    }
    return `${attachment.object_key_prefix}/${version}.webp`;
  }
}
