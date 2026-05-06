import { CarouselBanner } from '@/carousel-banners/domain/carousel-banner';

export type FindAllCarouselBanners = {
  data: CarouselBanner[];
  totalCount: number;
  skip: number;
  take: number;
};
