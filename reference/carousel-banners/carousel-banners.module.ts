import { Module } from '@nestjs/common';
import { CarouselBannersService } from '@/carousel-banners/carousel-banners.service';
import { CarouselBannersPersistenceModule } from '@/carousel-banners/persistence/persistence.module';
import { CarouselBannersPublicController } from '@/carousel-banners/carousel-banners-public.controller';
import { CarouselBannersAdminController } from '@/carousel-banners/carousel-banners-admin.controller';

@Module({
  imports: [CarouselBannersPersistenceModule],
  controllers: [
    CarouselBannersPublicController,
    CarouselBannersAdminController,
  ],
  providers: [CarouselBannersService],
  exports: [CarouselBannersService],
})
export class CarouselBannersModule {}
