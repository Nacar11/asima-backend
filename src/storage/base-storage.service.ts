import { Readable } from 'stream';
import { StoredObject } from '@/storage/domain/stored-object';
import { UploadInput } from '@/storage/domain/upload-input';

/**
 * Storage port. The concrete driver is `S3Storage` (MinIO locally, AWS S3
 * deployed — same API behind one adapter). Consumers depend on this
 * abstraction so unit tests mock it and a future non-S3 driver stays
 * possible. The persistence module binds `{ provide: BaseStorageService,
 * useClass: S3Storage }`.
 */
export abstract class BaseStorageService {
  /** Write one object. Resolves once the byte stream is committed. */
  abstract put(input: UploadInput): Promise<StoredObject>;

  /** Open a readable byte stream for `key` — the download endpoint pipes it. */
  abstract getStream(key: string): Promise<Readable>;

  /** Best-effort delete. Used by the compensating cleanup on a failed submit. */
  abstract delete(key: string): Promise<void>;

  /** True if an object exists at `key`. */
  abstract exists(key: string): Promise<boolean>;
}
