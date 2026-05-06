import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarouselBannerEntity } from '@/carousel-banners/persistence/entities/carousel-banner.entity';
import { MediaEntity } from '@/media/persistence/entities/media.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CarouselBannersSeedService } from './carousel-banners-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CarouselBannerEntity, MediaEntity, UserEntity]),
  ],
  providers: [CarouselBannersSeedService],
  exports: [CarouselBannersSeedService],
})
export class CarouselBannersSeedModule {}
