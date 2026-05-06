import { registerAs } from '@nestjs/config';
import { IsBoolean, IsNumber } from 'class-validator';
import validateConfig from '@/utils/validate-config';

export class MediaFeatureFlagsConfig {
  @IsBoolean()
  enableMediaProcessing: boolean;

  @IsBoolean()
  enableImageProcessing: boolean;

  @IsBoolean()
  enableVideoProcessing: boolean;

  @IsBoolean()
  workerEnabled: boolean;

  @IsNumber()
  workerConcurrency: number;

  @IsBoolean()
  generateThumbnails: boolean;

  @IsBoolean()
  generateCompressed: boolean;

  @IsBoolean()
  generateWatermarks: boolean;

  @IsBoolean()
  queueEnabled: boolean;
}

export default registerAs<MediaFeatureFlagsConfig>('mediaFeatureFlags', () => {
  const config = {
    enableMediaProcessing: process.env.ENABLE_MEDIA_PROCESSING === 'true',
    enableImageProcessing: process.env.ENABLE_IMAGE_PROCESSING === 'true',
    enableVideoProcessing: process.env.ENABLE_VIDEO_PROCESSING === 'true',
    workerEnabled: process.env.WORKER_ENABLED === 'true',
    workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '1', 10),
    generateThumbnails: process.env.GENERATE_THUMBNAILS === 'true',
    generateCompressed: process.env.GENERATE_COMPRESSED === 'true',
    generateWatermarks: process.env.GENERATE_WATERMARKS === 'true',
    queueEnabled: process.env.QUEUE_ENABLED === 'true',
  };

  validateConfig(config, MediaFeatureFlagsConfig);

  return config;
});
