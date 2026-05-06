import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarouselBannerEntity } from '@/carousel-banners/persistence/entities/carousel-banner.entity';
import { CarouselBannerMapper } from '@/carousel-banners/persistence/mappers/carousel-banner.mapper';
import { CarouselBannerRepository } from '@/carousel-banners/persistence/repositories/carousel-banner.repository';
import { BaseCarouselBannerRepository } from '@/carousel-banners/persistence/base-carousel-banner.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CarouselBannerEntity])],
  providers: [
    CarouselBannerMapper,
    {
      provide: BaseCarouselBannerRepository,
      useClass: CarouselBannerRepository,
    },
  ],
  exports: [BaseCarouselBannerRepository, CarouselBannerMapper],
})
export class CarouselBannersPersistenceModule {}
