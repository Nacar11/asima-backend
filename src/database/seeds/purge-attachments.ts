import 'dotenv/config';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
  type ObjectIdentifier,
} from '@aws-sdk/client-s3';
import storageConfig from '@/storage/config/storage.config';
import { LEAVE_ATTACHMENT_PREFIX } from '@/storage/attachment.constants';

/**
 * Deletes every object under the leave-attachment prefix.
 *
 * Demo-reset tooling, not application code — the running app never removes
 * objects in bulk. It pairs with the truncate + reseed in the demo-reset
 * workflow: truncating `attachments` orphans the bytes in the bucket, and
 * `LeaveRequestSeedService.uploadPlaceholder` re-uploads what the next seed
 * needs, so purging is safe and keeps orphans from accumulating against the
 * 1 GB Supabase free-tier ceiling.
 *
 * Credentials and endpoint come from the same `storageConfig()` factory the
 * app uses, so there is exactly one place that reads `STORAGE_*`. Only the
 * list/bulk-delete calls are new — `BaseStorageService` has no bulk API and
 * does not need one.
 */

/** `DeleteObjects` accepts at most 1000 keys per call. */
const DELETE_BATCH = 1000;

async function purgeAttachments(): Promise<void> {
  const logger = new Logger('PurgeAttachments');

  // `storageConfig()` defaults a missing bucket to 'asima'. For a destructive
  // job that default is a hazard — an unset secret would silently point the
  // purge at whatever 'asima' resolves to. Demand it explicitly.
  if (!process.env.STORAGE_BUCKET) {
    throw new Error(
      'STORAGE_BUCKET must be set explicitly — refusing to fall back to the default bucket name.',
    );
  }

  // `registerAs` types the factory as sync-or-async; awaiting narrows it.
  const cfg = await storageConfig();
  const client = new S3Client({
    // Undefined endpoint → AWS SDK resolves the default regional endpoint.
    endpoint: cfg.endpoint,
    region: cfg.region,
    forcePathStyle: cfg.forcePathStyle,
    credentials: {
      accessKeyId: cfg.accessKey,
      secretAccessKey: cfg.secretKey,
    },
  });

  const prefix = `${LEAVE_ATTACHMENT_PREFIX}/`;
  logger.log(`Purging s3://${cfg.bucket}/${prefix}`);

  let continuationToken: string | undefined;
  let deleted = 0;

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: cfg.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: DELETE_BATCH,
      }),
    );

    const objects = (listed.Contents ?? [])
      .map((object) => object.Key)
      .filter((key): key is string => typeof key === 'string' && key.length > 0)
      .map<ObjectIdentifier>((Key) => ({ Key }));

    if (objects.length > 0) {
      const result = await client.send(
        new DeleteObjectsCommand({
          Bucket: cfg.bucket,
          Delete: { Objects: objects, Quiet: true },
        }),
      );

      // A partial failure still returns 200 — the per-key errors live in the
      // body, so surface them rather than reporting a clean purge.
      const errors = result.Errors ?? [];
      if (errors.length > 0) {
        const [first] = errors;
        throw new Error(
          `Failed to delete ${errors.length} object(s); first failure: ` +
            `${first.Key ?? '<unknown key>'} (${first.Code ?? 'no code'}: ${first.Message ?? 'no message'})`,
        );
      }

      deleted += objects.length;
      logger.log(`Deleted ${deleted} object(s) so far`);
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);

  client.destroy();
  logger.log(
    deleted === 0
      ? 'Nothing to purge — prefix was already empty'
      : `Purge complete: ${deleted} object(s) deleted`,
  );
}

async function run(): Promise<void> {
  const logger = new Logger('PurgeAttachments');
  try {
    await purgeAttachments();
  } catch (err) {
    logger.error('Purge failed', err instanceof Error ? err.stack : String(err));
    process.exitCode = 1;
  }
}

void run();
