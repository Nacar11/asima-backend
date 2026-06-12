import { registerAs } from '@nestjs/config';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import validateConfig from '@/utils/validate-config';
import { StorageConfig } from './storage-config.type';

/**
 * Env-var validator — populated by `class-transformer` from `process.env`.
 * Definite-assignment per the hexagonal data-class rule in CLAUDE.md.
 *
 * `STORAGE_ENDPOINT` is optional: empty in deployed (AWS) envs so the SDK
 * uses the default regional endpoint; set to the MinIO endpoint locally.
 */
class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  STORAGE_ENDPOINT!: string;

  @IsString()
  STORAGE_REGION!: string;

  @IsString()
  STORAGE_BUCKET!: string;

  @IsString()
  STORAGE_ACCESS_KEY!: string;

  @IsString()
  STORAGE_SECRET_KEY!: string;

  @IsString()
  @IsOptional()
  STORAGE_FORCE_PATH_STYLE!: string;

  @IsInt()
  @Min(1)
  @Max(1024)
  @IsOptional()
  STORAGE_MAX_FILE_MB!: number;
}

export default registerAs<StorageConfig>('storage', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    // Empty endpoint = AWS default. An empty string would make the SDK try
    // to hit "" as a host, so collapse it to undefined.
    endpoint: process.env.STORAGE_ENDPOINT || undefined,
    region: process.env.STORAGE_REGION ?? 'us-east-1',
    bucket: process.env.STORAGE_BUCKET ?? 'asima',
    accessKey: process.env.STORAGE_ACCESS_KEY!,
    secretKey: process.env.STORAGE_SECRET_KEY!,
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
    maxFileMb: process.env.STORAGE_MAX_FILE_MB ? parseInt(process.env.STORAGE_MAX_FILE_MB, 10) : 10,
  };
});
