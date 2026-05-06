import { PartialType } from '@nestjs/swagger';
import { CreateCarouselBannerDto } from '@/carousel-banners/dto/create-carousel-banner.dto';

export class UpdateCarouselBannerDto extends PartialType(
  CreateCarouselBannerDto,
) {}
