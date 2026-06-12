import { Readable } from 'stream';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { AllConfigType } from '@/config/config.type';
import { BaseStorageService } from '@/storage/base-storage.service';
import { StoredObject } from '@/storage/domain/stored-object';
import { UploadInput } from '@/storage/domain/upload-input';

/**
 * S3 storage driver. One adapter for both environments — MinIO locally
 * (custom endpoint + path-style) and AWS S3 deployed (default endpoint).
 * The difference is entirely in `STORAGE_*` config; there is no
 * `if (env === 'local')` branch here.
 */
@Injectable()
export class S3Storage extends BaseStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(configService: ConfigService<AllConfigType>) {
    super();
    const cfg = configService.getOrThrow('storage', { infer: true });
    this.bucket = cfg.bucket;
    this.client = new S3Client({
      // Undefined endpoint → AWS SDK resolves the default regional endpoint.
      endpoint: cfg.endpoint,
      region: cfg.region,
      forcePathStyle: cfg.forcePathStyle,
      credentials: {
        accessKeyId: cfg.accessKey,
        secretAccessKey: cfg.secretKey,
      },
    });
  }

  async put(input: UploadInput): Promise<StoredObject> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.content_type,
        ContentLength: input.body.length,
      }),
    );
    return {
      bucket: this.bucket,
      key: input.key,
      content_type: input.content_type,
      size_bytes: input.body.length,
    };
  }

  async getStream(key: string): Promise<Readable> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      // In Node the SDK returns the body as a Readable stream.
      return response.Body as Readable;
    } catch (err) {
      if (isNotFound(err)) {
        throw new NotFoundException(`Object ${key} not found`);
      }
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw err;
    }
  }
}

/** S3 / MinIO surface a 404 as either a typed name or an HTTP 404 status. */
function isNotFound(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e?.name === 'NotFound' || e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404;
}
