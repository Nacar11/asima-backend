import { registerAs } from '@nestjs/config';

const normalizeEnvValue = (value?: string | null): string | null => {
  const normalized = String(value || '').trim();
  return normalized.length > 0 ? normalized : null;
};

const inferBucketFromEndpoint = (endpoint?: string | null): string | null => {
  const normalizedEndpoint = normalizeEnvValue(endpoint);
  if (!normalizedEndpoint) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedEndpoint);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathFirstSegment = parsedUrl.pathname
      .split('/')
      .filter(Boolean)[0]
      ?.trim();

    // Virtual-hosted-style bucket endpoint:
    // https://<bucket>.s3.amazonaws.com or https://<bucket>.s3.<region>.amazonaws.com
    const awsVirtualHostedMatch = hostname.match(
      /^([^.]+)\.s3(?:[.-][^.]+)?\.amazonaws\.com$/,
    );
    if (awsVirtualHostedMatch?.[1]) {
      return decodeURIComponent(awsVirtualHostedMatch[1]);
    }

    // Path-style endpoint:
    // https://s3.amazonaws.com/<bucket>/... or https://s3.<region>.amazonaws.com/<bucket>/...
    if (
      (hostname === 's3.amazonaws.com' ||
        /^s3[.-][^.]+\.amazonaws\.com$/.test(hostname)) &&
      pathFirstSegment
    ) {
      return decodeURIComponent(pathFirstSegment);
    }

    return null;
  } catch {
    return null;
  }
};

const resolveS3Bucket = (): string => {
  const configuredBucketCandidates = [
    normalizeEnvValue(process.env.AWS_DEFAULT_S3_BUCKET),
    normalizeEnvValue(process.env.AWS_S3_BUCKET),
    normalizeEnvValue(process.env.S3_BUCKET),
  ].filter(Boolean) as string[];

  const inferredBucketCandidates = [
    inferBucketFromEndpoint(process.env.AWS_S3_PUBLIC_ENDPOINT),
    inferBucketFromEndpoint(process.env.AWS_S3_ENDPOINT),
  ].filter(Boolean) as string[];

  const bucketCandidates = Array.from(
    new Set([...configuredBucketCandidates, ...inferredBucketCandidates]),
  );

  if (bucketCandidates.length === 0) {
    return 'media';
  }

  const primaryBucket = bucketCandidates[0];

  // Safety: if env is set to a short base name (e.g. adtokart-prod-uploads)
  // but endpoint indicates the fully qualified bucket with account suffix
  // (e.g. adtokart-prod-uploads-477956547985), prefer the fully qualified one.
  const fullyQualifiedVariant = bucketCandidates.find(
    (candidate) =>
      candidate !== primaryBucket &&
      candidate.startsWith(`${primaryBucket}-`) &&
      /-\d{6,}$/.test(candidate),
  );

  return fullyQualifiedVariant || primaryBucket;
};

export default registerAs('storage', () => ({
  provider: process.env.FILE_DRIVER || 's3',
  config: {
    // S3 Config
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.AWS_S3_REGION || 'ap-northeast-1',
    bucket: resolveS3Bucket(),
    endpoint: process.env.AWS_S3_ENDPOINT, // MinIO endpoint (internal)
    publicEndpoint: process.env.AWS_S3_PUBLIC_ENDPOINT, // MinIO public-facing endpoint

    // Local Storage Config
    basePath: process.env.LOCAL_STORAGE_PATH || './uploads',

    // Azure Config (if needed)
    azureConnectionString: process.env.AZURE_CONNECTION_STRING,
    azureContainer: process.env.AZURE_CONTAINER,

    // GCP Config (if needed)
    gcpProjectId: process.env.GCP_PROJECT_ID,
    gcpBucket: process.env.GCP_BUCKET,
    gcpKeyFilename: process.env.GCP_KEY_FILENAME,
  },
}));
