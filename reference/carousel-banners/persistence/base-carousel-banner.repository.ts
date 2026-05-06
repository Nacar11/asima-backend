import { CarouselBanner } from '@/carousel-banners/domain/carousel-banner';
import { FindAllCarouselBanners } from '@/carousel-banners/domain/find-all-carousel-banners';
import { CarouselBannerSearchCriteria } from '@/carousel-banners/domain/carousel-banner-search-criteria';

export abstract class BaseCarouselBannerRepository {
  abstract create(carouselBanner: CarouselBanner): Promise<CarouselBanner>;

  abstract findAll(
    criteria: CarouselBannerSearchCriteria,
  ): Promise<FindAllCarouselBanners>;

  abstract findAllIds(): Promise<number[]>;

  abstract findAllDisplayOrders(): Promise<
    Array<{ id: number; display_order: number }>
  >;

  abstract findById(id: number): Promise<CarouselBanner | null>;

  abstract update(
    id: number,
    carouselBanner: Partial<CarouselBanner>,
  ): Promise<CarouselBanner>;

  abstract deleteAll(): Promise<void>;

  abstract remove(id: number): Promise<void>;
}
