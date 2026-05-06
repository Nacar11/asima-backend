import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { BaseCarouselBannerRepository } from '@/carousel-banners/persistence/base-carousel-banner.repository';
import { CarouselBanner } from '@/carousel-banners/domain/carousel-banner';
import { FindAllCarouselBanners } from '@/carousel-banners/domain/find-all-carousel-banners';
import { CAROUSEL_BANNERS_DEFAULTS } from '@/carousel-banners/carousel-banners.constants';
import { CreateCarouselBannerDto } from '@/carousel-banners/dto/create-carousel-banner.dto';
import { QueryCarouselBannersAdminDto } from '@/carousel-banners/dto/query-carousel-banners-admin.dto';
import { QueryCarouselBannersDto } from '@/carousel-banners/dto/query-carousel-banners.dto';
import { SyncCarouselBannersDto } from '@/carousel-banners/dto/sync-carousel-banners.dto';
import { UpdateCarouselBannerDto } from '@/carousel-banners/dto/update-carousel-banner.dto';
import { CarouselBannerSearchCriteria } from '@/carousel-banners/domain/carousel-banner-search-criteria';
import { PAGINATION_DEFAULTS } from '@/utils/constants/pagination.constants';
import { User } from '@/users/domain/user';

type SyncCarouselBannerInput = SyncCarouselBannersDto['banners'][number];
type TypeOrmDriverError = {
  readonly code?: string;
  readonly constraint?: string;
};

@Injectable()
export class CarouselBannersService {
  constructor(private readonly repository: BaseCarouselBannerRepository) {}

  private buildSearchCriteriaFromPublicQuery(
    query: QueryCarouselBannersDto,
    onlyCurrentlyActive: boolean,
  ): CarouselBannerSearchCriteria {
    const criteria: CarouselBannerSearchCriteria = {
      onlyCurrentlyActive,
      sortOrder: query.sortOrder ?? CAROUSEL_BANNERS_DEFAULTS.sortOrder,
      skip: query.skip ?? PAGINATION_DEFAULTS.skip,
      take: query.take ?? PAGINATION_DEFAULTS.take,
    };
    return criteria;
  }

  private buildSearchCriteriaFromAdminQuery(
    query: QueryCarouselBannersAdminDto,
  ): CarouselBannerSearchCriteria {
    const skip: number = query.skip ?? PAGINATION_DEFAULTS.skip;
    const take: number = query.take ?? PAGINATION_DEFAULTS.take;
    const criteria: CarouselBannerSearchCriteria = {
      devExtremeFilter: query.filter,
      devExtremeSort: query.sort,
      headline: query.headline,
      mediaId: query.media_id,
      skip,
      take,
    };
    return criteria;
  }

  async create(
    input: CreateCarouselBannerDto,
    causer: User,
  ): Promise<CarouselBanner> {
    const carouselBanner: CarouselBanner = Object.assign(
      new CarouselBanner(),
      input,
      {
        display_order:
          input.display_order ?? CAROUSEL_BANNERS_DEFAULTS.displayOrder,
        is_active: input.is_active ?? true,
        created_by: causer,
        updated_by: causer,
      },
    );
    try {
      return await this.repository.create(carouselBanner);
    } catch (err: unknown) {
      this.throwIfDisplayOrderNotUnique(err);
      throw err;
    }
  }

  async findAll(
    query: QueryCarouselBannersAdminDto,
  ): Promise<FindAllCarouselBanners> {
    const criteria: CarouselBannerSearchCriteria =
      this.buildSearchCriteriaFromAdminQuery(query);
    return this.repository.findAll(criteria);
  }

  async findAllPublic(
    query: QueryCarouselBannersDto,
  ): Promise<FindAllCarouselBanners> {
    const criteria: CarouselBannerSearchCriteria =
      this.buildSearchCriteriaFromPublicQuery(query, true);
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<CarouselBanner> {
    const carouselBanner: CarouselBanner | null =
      await this.repository.findById(id);
    if (!carouselBanner) {
      throw new NotFoundException(`Carousel banner with id ${id} not found`);
    }
    return carouselBanner;
  }

  async update(
    id: number,
    input: UpdateCarouselBannerDto,
    causer: User,
  ): Promise<CarouselBanner> {
    await this.findById(id);
    const partialBanner: Partial<CarouselBanner> = new CarouselBanner();
    Object.assign(partialBanner, input, {
      updated_by: causer.id,
    });
    try {
      return await this.repository.update(id, partialBanner);
    } catch (err: unknown) {
      this.throwIfDisplayOrderNotUnique(err);
      throw err;
    }
  }

  async delete(id: number, causer: User): Promise<void> {
    void causer;
    await this.findById(id);
    await this.repository.remove(id);
  }

  async syncCarouselBanners(
    input: SyncCarouselBannersDto,
    causer: User,
  ): Promise<CarouselBanner[]> {
    const banners: SyncCarouselBannerInput[] = input.banners;
    const displayOrders: number[] = banners.map(
      (banner: SyncCarouselBannerInput) => banner.display_order,
    );
    const uniqueDisplayOrders: Set<number> = new Set(displayOrders);
    if (uniqueDisplayOrders.size !== displayOrders.length) {
      throw new BadRequestException('Display order must be unique');
    }
    const existingPairs: Array<{ id: number; display_order: number }> =
      await this.repository.findAllDisplayOrders();
    const existingByDisplayOrder: Map<number, number> = new Map(
      existingPairs.map((pair: { id: number; display_order: number }) => [
        pair.display_order,
        pair.id,
      ]),
    );
    const keepDisplayOrderSet: Set<number> = new Set(displayOrders);
    await Promise.all(
      existingPairs
        .filter(
          (pair: { id: number; display_order: number }) =>
            !keepDisplayOrderSet.has(pair.display_order),
        )
        .map(async (pair: { id: number; display_order: number }) => {
          await this.repository.remove(pair.id);
        }),
    );
    const results: CarouselBanner[] = [];
    for (const banner of banners) {
      const existingId: number | undefined = existingByDisplayOrder.get(
        banner.display_order,
      );
      if (existingId) {
        const partialBanner: Partial<CarouselBanner> = new CarouselBanner();
        Object.assign(partialBanner, banner, {
          updated_by: causer.id,
        });
        let updated: CarouselBanner;
        try {
          updated = await this.repository.update(existingId, partialBanner);
        } catch (err: unknown) {
          this.throwIfDisplayOrderNotUnique(err);
          throw err;
        }
        results.push(updated);
      } else {
        let created: CarouselBanner;
        try {
          created = await this.repository.create(
            Object.assign(new CarouselBanner(), banner, {
              created_by: causer,
              updated_by: causer,
            }),
          );
        } catch (err: unknown) {
          this.throwIfDisplayOrderNotUnique(err);
          throw err;
        }
        results.push(created);
      }
    }
    return results.sort(
      (a: CarouselBanner, b: CarouselBanner) =>
        a.display_order - b.display_order,
    );
  }

  private throwIfDisplayOrderNotUnique(err: unknown): void {
    const queryFailedError: QueryFailedError | undefined =
      err instanceof QueryFailedError ? err : undefined;
    if (!queryFailedError) {
      return;
    }
    const typedError: {
      readonly driverError?: TypeOrmDriverError;
    } = queryFailedError as unknown as {
      readonly driverError?: TypeOrmDriverError;
    };
    const driverError: TypeOrmDriverError | undefined = typedError.driverError;
    const code: string | undefined = driverError?.code;
    const constraint: string | undefined = driverError?.constraint;
    if (code !== '23505') {
      return;
    }
    if (constraint !== 'UQ_carousel_banners_display_order') {
      return;
    }
    throw new BadRequestException('display_order must be unique');
  }
}
