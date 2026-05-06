import { registerAs } from '@nestjs/config';
import validateConfig from '@/utils/validate-config';
import { IsInt, IsOptional, Min } from 'class-validator';

export type UploadConfig = {
  storeFileMaxSizeMB: number;
  storeFileMaxSizeBytes: number;
};

class EnvironmentVariablesValidator {
  @IsInt()
  @Min(1)
  @IsOptional()
  STORE_FILE_MAX_SIZE_MB: number;
}

export default registerAs<UploadConfig>('upload', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const storeFileMaxSizeMB = process.env.STORE_FILE_MAX_SIZE_MB
    ? parseInt(process.env.STORE_FILE_MAX_SIZE_MB, 10)
    : 10; // Default 10MB

  return {
    storeFileMaxSizeMB,
    storeFileMaxSizeBytes: storeFileMaxSizeMB * 1024 * 1024,
  };
});
