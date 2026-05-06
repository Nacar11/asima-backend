import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '@/storage/storage.module';
import mediaFeatureFlagsConfig from '@/media/config/media-feature-flags.config';
import { MediaEntity } from '@/media/persistence/entities/media.entity';
import { ProductMediaMappingEntity } from '@/media/persistence/entities/product-media-mapping.entity';
import { ReviewMediaMappingEntity } from '@/media/persistence/entities/review-media-mapping.entity';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { ImageProcessorService } from '@/media/shared/services/image-processor.service';
import { VideoProcessorService } from '@/media/shared/services/video-processor.service';
import { MediaRepository } from '@/media/persistence/repositories/media.repository';
import { ProductMediaMappingRepository } from '@/media/persistence/repositories/product-media-mapping.repository';
import { ReviewMediaMappingRepository } from '@/media/persistence/repositories/review-media-mapping.repository';

@Module({
  imports: [
    ConfigModule.forFeature(mediaFeatureFlagsConfig),
    TypeOrmModule.forFeature([
      MediaEntity,
      ProductMediaMappingEntity,
      ReviewEntity,
      ReviewMediaMappingEntity,
    ]),
    StorageModule.register(),
  ],
  providers: [
    ImageProcessorService,
    VideoProcessorService,
    MediaRepository,
    ProductMediaMappingRepository,
    ReviewMediaMappingRepository,
  ],
  exports: [
    StorageModule,
    ImageProcessorService,
    VideoProcessorService,
    MediaRepository,
    ProductMediaMappingRepository,
    ReviewMediaMappingRepository,
  ],
})
export class MediaSharedModule {}
