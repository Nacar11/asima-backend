export type StorageConfig = {
  /**
   * S3 endpoint. Set to the MinIO endpoint locally
   * (`http://asima-minio:9000`); left empty in deployed envs so the AWS SDK
   * resolves the default regional endpoint. One adapter, one code path —
   * the environment only changes config, never the driver.
   */
  endpoint?: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  /** MinIO needs path-style addressing; real S3 uses virtual-hosted (false). */
  forcePathStyle: boolean;
  /** Upload size cap in megabytes; the validation boundary rejects above this. */
  maxFileMb: number;
};
