import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCarouselBannerRepository } from '@/carousel-banners/persistence/base-carousel-banner.repository';
import { CarouselBannerEntity } from '@/carousel-banners/persistence/entities/carousel-banner.entity';
import { CarouselBanner } from '@/carousel-banners/domain/carousel-banner';
import { CarouselBannerMapper } from '@/carousel-banners/persistence/mappers/carousel-banner.mapper';
import { CarouselBannerSearchCriteria } from '@/carousel-banners/domain/carousel-banner-search-criteria';
import { FindAllCarouselBanners } from '@/carousel-banners/domain/find-all-carousel-banners';
import { PAGINATION_DEFAULTS } from '@/utils/constants/pagination.constants';
import { CAROUSEL_BANNERS_DEFAULTS } from '@/carousel-banners/carousel-banners.constants';

type DevExtremeFilterCondition = {
  readonly field: string;
  readonly operator: string;
  readonly value: unknown;
};

type DevExtremeSortResult = {
  readonly field?: 'display_order' | 'created_at';
  readonly direction?: 'ASC' | 'DESC';
};

@Injectable()
export class CarouselBannerRepository extends BaseCarouselBannerRepository {
  constructor(
    @InjectRepository(CarouselBannerEntity)
    private readonly repository: Repository<CarouselBannerEntity>,
  ) {
    super();
  }

  async findAllIds(): Promise<number[]> {
    const rows: Array<{ id: number }> = await this.repository
      .createQueryBuilder('carouselBanner')
      .select('carouselBanner.id', 'id')
      .getRawMany();
    return rows.map((row: { id: number }) => Number(row.id));
  }

  async findAllDisplayOrders(): Promise<
    Array<{ id: number; display_order: number }>
  > {
    const rows: Array<{ id: number; display_order: number }> =
      await this.repository
        .createQueryBuilder('carouselBanner')
        .select('carouselBanner.id', 'id')
        .addSelect('carouselBanner.display_order', 'display_order')
        .getRawMany();
    return rows.map((row: { id: number; display_order: number }) => ({
      id: Number(row.id),
      display_order: Number(row.display_order),
    }));
  }

  async create(carouselBanner: CarouselBanner): Promise<CarouselBanner> {
    const persistenceModel: CarouselBannerEntity =
      CarouselBannerMapper.toPersistence(carouselBanner);
    const newEntity: CarouselBannerEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    const entityWithRelations: CarouselBannerEntity | null =
      await this.repository.findOne({
        where: { id: newEntity.id },
        relations: ['media', 'created_by', 'updated_by', 'deleted_by'],
      });
    if (!entityWithRelations) {
      throw new Error('Failed to retrieve created carousel banner');
    }
    return CarouselBannerMapper.toDomain(entityWithRelations);
  }

  async findAll(
    criteria: CarouselBannerSearchCriteria,
  ): Promise<FindAllCarouselBanners> {
    const skip: number = criteria.skip ?? PAGINATION_DEFAULTS.skip;
    const take: number = criteria.take ?? PAGINATION_DEFAULTS.take;
    const now: Date = new Date();

    const queryBuilder = this.repository
      .createQueryBuilder('carouselBanner')
      .leftJoinAndSelect('carouselBanner.media', 'media')
      .leftJoinAndSelect('carouselBanner.created_by', 'created_by')
      .leftJoinAndSelect('carouselBanner.updated_by', 'updated_by')
      .leftJoinAndSelect('carouselBanner.deleted_by', 'deleted_by');

    if (criteria.headline) {
      queryBuilder.andWhere('carouselBanner.headline ILIKE :headline', {
        headline: `%${criteria.headline}%`,
      });
    }

    const isActive: boolean | undefined =
      criteria.isActive ??
      this.extractIsActiveFromDevExtremeFilter(criteria.devExtremeFilter);
    if (isActive !== undefined) {
      queryBuilder.andWhere('carouselBanner.is_active = :is_active', {
        is_active: isActive,
      });
    }

    if (criteria.mediaId !== undefined) {
      queryBuilder.andWhere('carouselBanner.media_id = :media_id', {
        media_id: criteria.mediaId,
      });
    }

    if (criteria.onlyCurrentlyActive) {
      queryBuilder.andWhere('carouselBanner.is_active = true');
      queryBuilder.andWhere(
        '(carouselBanner.start_at IS NULL OR carouselBanner.start_at <= :now)',
        { now },
      );
      queryBuilder.andWhere(
        '(carouselBanner.end_at IS NULL OR carouselBanner.end_at >= :now)',
        { now },
      );
    }

    const devExtremeSort: DevExtremeSortResult =
      this.extractSortFromDevExtremeSort(criteria.devExtremeSort);
    const sortField: 'display_order' | 'created_at' =
      criteria.sort?.field ?? devExtremeSort.field ?? 'display_order';
    const sortDirection: 'ASC' | 'DESC' =
      criteria.sort?.direction ??
      devExtremeSort.direction ??
      criteria.sortOrder ??
      CAROUSEL_BANNERS_DEFAULTS.sortOrder;

    queryBuilder.orderBy(`carouselBanner.${sortField}`, sortDirection);
    if (sortField !== 'display_order') {
      queryBuilder.addOrderBy('carouselBanner.display_order', 'ASC');
    }
    queryBuilder
      .addOrderBy('carouselBanner.created_at', 'ASC')
      .skip(skip)
      .take(take);

    const [entities, totalCount] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map((entity: CarouselBannerEntity) =>
        CarouselBannerMapper.toDomain(entity),
      ),
      totalCount,
      skip,
      take,
    };
  }

  private extractIsActiveFromDevExtremeFilter(
    filterRaw: unknown,
  ): boolean | undefined {
    const condition: DevExtremeFilterCondition | undefined =
      this.extractDevExtremeFilterCondition(filterRaw, 'is_active');
    if (!condition) {
      return undefined;
    }
    if (condition.operator !== '=') {
      return undefined;
    }
    return this.normalizeBoolean(condition.value);
  }

  private extractDevExtremeFilterCondition(
    node: unknown,
    targetField: string,
  ): DevExtremeFilterCondition | undefined {
    if (!Array.isArray(node)) {
      return undefined;
    }
    if (
      node.length === 3 &&
      typeof node[0] === 'string' &&
      typeof node[1] === 'string'
    ) {
      if (node[0] !== targetField) {
        return undefined;
      }
      return {
        field: node[0],
        operator: node[1],
        value: node[2],
      };
    }
    for (const child of node) {
      const found = this.extractDevExtremeFilterCondition(child, targetField);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  private extractSortFromDevExtremeSort(
    sortRaw: unknown,
  ): DevExtremeSortResult {
    if (!sortRaw || typeof sortRaw !== 'object') {
      return {};
    }
    const entries: Array<[string, unknown]> = Object.entries(
      sortRaw as Record<string, unknown>,
    );
    if (entries.length === 0) {
      return {};
    }
    const [fieldRaw, directionRaw] = entries[0];
    if (!this.isAllowedSortField(fieldRaw)) {
      return {};
    }
    const direction: 'ASC' | 'DESC' | undefined =
      this.normalizeSortDirection(directionRaw);
    if (!direction) {
      return {};
    }
    return {
      field: fieldRaw,
      direction,
    };
  }

  private isAllowedSortField(
    field: string,
  ): field is 'display_order' | 'created_at' {
    return field === 'display_order' || field === 'created_at';
  }

  private normalizeSortDirection(
    directionRaw: unknown,
  ): 'ASC' | 'DESC' | undefined {
    if (directionRaw === undefined || directionRaw === null) {
      return undefined;
    }
    const upper: string = String(directionRaw).toUpperCase();
    if (upper === 'ASC' || upper === 'DESC') {
      return upper;
    }
    return undefined;
  }

  private normalizeBoolean(value: unknown): boolean | undefined {
    if (value === true || value === 'true' || value === 1 || value === '1') {
      return true;
    }
    if (value === false || value === 'false' || value === 0 || value === '0') {
      return false;
    }
    return undefined;
  }

  async findById(id: number): Promise<CarouselBanner | null> {
    const entity: CarouselBannerEntity | null = await this.repository.findOne({
      where: { id },
      relations: ['media', 'created_by', 'updated_by', 'deleted_by'],
    });
    return entity ? CarouselBannerMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    carouselBanner: Partial<CarouselBanner>,
  ): Promise<CarouselBanner> {
    const existingEntity: CarouselBannerEntity | null =
      await this.repository.findOne({
        where: { id },
        relations: ['media', 'created_by', 'updated_by', 'deleted_by'],
      });
    if (!existingEntity) {
      throw new Error('Carousel banner not found');
    }

    const mergedDomain: CarouselBanner = Object.assign(
      new CarouselBanner(),
      CarouselBannerMapper.toDomain(existingEntity),
      carouselBanner,
    );

    const updatedEntity: CarouselBannerEntity = await this.repository.save(
      this.repository.create(CarouselBannerMapper.toPersistence(mergedDomain)),
    );

    const entityWithRelations: CarouselBannerEntity | null =
      await this.repository.findOne({
        where: { id: updatedEntity.id },
        relations: ['media', 'created_by', 'updated_by', 'deleted_by'],
      });
    if (!entityWithRelations) {
      throw new Error('Failed to retrieve updated carousel banner');
    }

    return CarouselBannerMapper.toDomain(entityWithRelations);
  }

  async deleteAll(): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .from(CarouselBannerEntity)
      .execute();
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
