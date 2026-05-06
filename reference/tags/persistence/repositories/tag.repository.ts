import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, OrderByCondition } from 'typeorm';
import { TagEntity } from '@/tags/persistence/entities/tag.entity';
import { Tag } from '@/tags/domain/tag';
import { TagMapper } from '@/tags/persistence/mappers/tag.mapper';
import { FilterTagDto, TagSortBy, SortOrder } from '@/tags/dto/filter-tag.dto';
import { User } from '@/users/domain/user';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { createFieldFilters } from '@/devextreme/helpers/filter-condition.helper';
import { processMultiSortMapping } from '@/devextreme/helpers/sort.helper';
import { SqlStrategy } from '@/devextreme/strategies/sql.strategy';
import { IFieldFilter } from '@/devextreme/devextreme.interface';
import {
  TAG_PRODUCT_COUNT_ALIAS,
  TAG_PRODUCT_COUNT_SUBQUERY,
  TAG_PRODUCT_COUNT_SUBQUERY_FOR_ALIAS,
} from '@/tags/tags.constants';

@Injectable()
export class TagRepository {
  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
  ) {}

  /**
   * Retrieves tags with DevExtreme-compatible filtering and pagination
   */
  async findByMany(loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    // Define field mappings for DevExtreme filtering
    const fieldMaps: IFieldFilter[] = [
      {
        field: 'id',
        relatedFields: ['tags.id::TEXT'],
      },
      {
        field: 'name',
        relatedFields: ['tags.name', 'LOWER(tags.name)'],
      },
      {
        field: 'slug',
        relatedFields: ['tags.slug', 'LOWER(tags.slug)'],
      },
      {
        field: 'description',
        relatedFields: ['tags.description', 'LOWER(tags.description)'],
      },
      {
        field: 'product_count',
        relatedFields: [TAG_PRODUCT_COUNT_SUBQUERY],
      },
      {
        field: 'seller_id',
        relatedFields: ['tags.seller_id::TEXT'],
      },
      {
        field: 'display_order',
        relatedFields: ['tags.display_order'],
      },
      {
        field: 'status',
        relatedFields: ['tags.status'],
      },
      {
        field: 'created_at',
        relatedFields: ['tags.created_at'],
      },
      {
        field: 'updated_at',
        relatedFields: ['tags.updated_at'],
      },
    ];

    // Process filters
    if (filter !== undefined) {
      let normalizedFilter: any = filter;
      if (typeof normalizedFilter === 'string') {
        try {
          normalizedFilter = JSON.parse(normalizedFilter);
        } catch {
          normalizedFilter = filter;
        }
      }

      if (Array.isArray(normalizedFilter)) {
        filter = await createFieldFilters(normalizedFilter, fieldMaps);
      } else {
        filter = normalizedFilter;
      }
    }

    // Process sorting - default to created_at DESC
    if (order) {
      order = processMultiSortMapping(
        order,
        fieldMaps,
      ) as GetQueryParams['sort'];
    } else {
      order = { 'tags.created_at': 'DESC' };
    }

    // Get skip, take, and where conditions using SqlStrategy
    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as GetQueryParams);

    // Build query with product_count subquery
    const query = this.tagRepository
      .createQueryBuilder('tags')
      .addSelect(TAG_PRODUCT_COUNT_SUBQUERY, TAG_PRODUCT_COUNT_ALIAS)
      .where(where)
      .andWhere('tags.deleted_at IS NULL') // Exclude soft-deleted tags
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition)
      .leftJoinAndSelect('tags.seller', 'seller')
      .leftJoinAndSelect('tags.creator', 'creator')
      .leftJoinAndSelect('tags.updater', 'updater');

    const { entities, raw } = await query.getRawAndEntities();
    const totalCount = await query.getCount();

    const data = entities.map((entity, index) => {
      const domain = TagMapper.toDomain(entity);
      const rawRow = raw[index];
      domain.product_count = parseInt(rawRow?.product_count || '0', 10);
      return domain;
    });
    return { data, totalCount };
  }

  /**
   * Retrieves tags for a specific seller with DevExtreme-compatible filtering and pagination
   */
  async findBySeller(sellerId: number, loadOptions: GetQueryParams) {
    let { filter, sort: order } = loadOptions;

    // Define field mappings for DevExtreme filtering
    const fieldMaps: IFieldFilter[] = [
      {
        field: 'id',
        relatedFields: ['tags.id::TEXT'],
      },
      {
        field: 'name',
        relatedFields: ['tags.name', 'LOWER(tags.name)'],
      },
      {
        field: 'slug',
        relatedFields: ['tags.slug', 'LOWER(tags.slug)'],
      },
      {
        field: 'description',
        relatedFields: ['tags.description', 'LOWER(tags.description)'],
      },
      {
        field: 'product_count',
        relatedFields: [TAG_PRODUCT_COUNT_SUBQUERY],
      },
      {
        field: 'display_order',
        relatedFields: ['tags.display_order'],
      },
      {
        field: 'status',
        relatedFields: ['tags.status'],
      },
      {
        field: 'created_at',
        relatedFields: ['tags.created_at'],
      },
      {
        field: 'updated_at',
        relatedFields: ['tags.updated_at'],
      },
    ];

    // Process filters
    if (filter !== undefined) {
      let normalizedFilter: any = filter;
      if (typeof normalizedFilter === 'string') {
        try {
          normalizedFilter = JSON.parse(normalizedFilter);
        } catch {
          normalizedFilter = filter;
        }
      }

      if (Array.isArray(normalizedFilter)) {
        filter = await createFieldFilters(normalizedFilter, fieldMaps);
      } else {
        filter = normalizedFilter;
      }
    }

    // Process sorting - default to created_at DESC
    if (order) {
      order = processMultiSortMapping(
        order,
        fieldMaps,
      ) as GetQueryParams['sort'];
    } else {
      order = { 'tags.created_at': 'DESC' };
    }

    // Get skip, take, and where conditions using SqlStrategy
    const { skip, take, where } = new SqlStrategy().get({
      ...loadOptions,
      filter,
    } as GetQueryParams);

    // Build query with seller_id filter and product_count subquery
    const query = this.tagRepository
      .createQueryBuilder('tags')
      .addSelect(TAG_PRODUCT_COUNT_SUBQUERY, TAG_PRODUCT_COUNT_ALIAS)
      .where(where)
      .andWhere('tags.deleted_at IS NULL') // Exclude soft-deleted tags
      .andWhere('tags.seller_id = :sellerId', { sellerId }) // Filter by seller
      .skip(skip)
      .take(take)
      .orderBy(order as OrderByCondition)
      .leftJoinAndSelect('tags.seller', 'seller')
      .leftJoinAndSelect('tags.creator', 'creator')
      .leftJoinAndSelect('tags.updater', 'updater');

    const { entities, raw } = await query.getRawAndEntities();
    const totalCount = await query.getCount();

    const data = entities.map((entity, index) => {
      const domain = TagMapper.toDomain(entity);
      const rawRow = raw[index];
      domain.product_count = parseInt(rawRow?.product_count || '0', 10);
      return domain;
    });
    return { data, totalCount };
  }

  async create(
    data: Partial<Tag>,
    currentUser: User,
    sellerId: number,
  ): Promise<Tag> {
    const entity = TagMapper.toPersistence({
      ...data,
      display_order: data.display_order ?? 0,
      seller_id: sellerId,
      created_by: currentUser,
      updated_by: currentUser,
    } as Tag);

    const newEntity = await this.tagRepository.save(entity);
    const domain = TagMapper.toDomain(newEntity);
    domain.product_count = 0; // New tags have no products
    return domain;
  }

  async findById(id: number, withDeleted = false): Promise<Tag | null> {
    const entity = await this.tagRepository.findOne({
      where: { id },
      relations: ['creator', 'updater'],
      withDeleted,
    });

    return entity ? TagMapper.toDomain(entity) : null;
  }

  async findBySlug(
    slug: string,
    sellerId?: number,
    withDeleted = false,
  ): Promise<Tag | null> {
    const entity = await this.tagRepository.findOne({
      where: { slug, seller_id: sellerId },
      relations: ['seller', 'creator', 'updater'],
      withDeleted,
    });

    return entity ? TagMapper.toDomain(entity) : null;
  }

  async findBySlugAndSeller(
    slug: string,
    sellerId: number,
    withDeleted = false,
  ): Promise<Tag | null> {
    const entity = await this.tagRepository.findOne({
      where: { slug, seller_id: sellerId },
      relations: ['seller', 'creator', 'updater'],
      withDeleted,
    });

    return entity ? TagMapper.toDomain(entity) : null;
  }

  async findByName(
    name: string,
    sellerId?: number,
    withDeleted = false,
  ): Promise<Tag | null> {
    const entity = await this.tagRepository.findOne({
      where: { name, seller_id: sellerId },
      withDeleted,
    });

    return entity ? TagMapper.toDomain(entity) : null;
  }

  async findAll(
    filters: FilterTagDto,
  ): Promise<{ data: Tag[]; totalCount: number }> {
    const {
      search,
      seller_id,
      min_count,
      max_count,
      sort_by = TagSortBy.NAME,
      sort_order = SortOrder.ASC,
      page = 1,
      limit = 50,
      include_archived = false,
    } = filters;

    const queryBuilder = this.tagRepository
      .createQueryBuilder('tag')
      .addSelect(
        TAG_PRODUCT_COUNT_SUBQUERY_FOR_ALIAS('tag'),
        TAG_PRODUCT_COUNT_ALIAS,
      )
      .leftJoinAndSelect('tag.seller', 'seller')
      .leftJoinAndSelect('tag.creator', 'creator')
      .leftJoinAndSelect('tag.updater', 'updater');

    // Apply filters
    if (!include_archived) {
      queryBuilder.andWhere('tag.deleted_at IS NULL');
    }

    // Filter by seller_id if provided (optional - get all tags by default)
    if (seller_id !== undefined) {
      queryBuilder.andWhere('tag.seller_id = :seller_id', { seller_id });
    }

    if (search) {
      queryBuilder.andWhere(
        '(tag.name ILIKE :search OR tag.slug ILIKE :search OR tag.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (min_count !== undefined) {
      queryBuilder.andWhere(
        `${TAG_PRODUCT_COUNT_SUBQUERY_FOR_ALIAS('tag')} >= :min_count`,
        { min_count },
      );
    }

    if (max_count !== undefined) {
      queryBuilder.andWhere(
        `${TAG_PRODUCT_COUNT_SUBQUERY_FOR_ALIAS('tag')} <= :max_count`,
        { max_count },
      );
    }

    // Apply sorting
    if (sort_by === 'product_count') {
      queryBuilder.orderBy(
        TAG_PRODUCT_COUNT_SUBQUERY_FOR_ALIAS('tag'),
        sort_order,
      );
    } else {
      queryBuilder.orderBy(`tag.${sort_by}`, sort_order);
    }

    // Apply pagination
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);
    queryBuilder.skip(skip).take(take);

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const total = await queryBuilder.getCount();
    const data = entities.map((entity, index) => {
      const domain = TagMapper.toDomain(entity);
      domain.product_count = parseInt(raw[index]?.product_count || '0', 10);
      return domain;
    });

    return { data, totalCount: total };
  }

  async search(query: string, limit = 10): Promise<Tag[]> {
    // Get all tags matching search query (no seller scoping)
    const queryBuilder = this.tagRepository
      .createQueryBuilder('tag')
      .addSelect(
        TAG_PRODUCT_COUNT_SUBQUERY_FOR_ALIAS('tag'),
        TAG_PRODUCT_COUNT_ALIAS,
      )
      .where('tag.deleted_at IS NULL')
      .andWhere('(tag.name ILIKE :query OR tag.slug ILIKE :query)', {
        query: `%${query}%`,
      })
      .orderBy(TAG_PRODUCT_COUNT_SUBQUERY_FOR_ALIAS('tag'), 'DESC')
      .take(Math.min(limit, 50));

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    return entities.map((entity, index) => {
      const domain = TagMapper.toDomain(entity);
      domain.product_count = parseInt(raw[index]?.product_count || '0', 10);
      return domain;
    });
  }

  async findPopular(limit = 45): Promise<Tag[]> {
    // Get all popular tags (no seller scoping)
    const queryBuilder = this.tagRepository
      .createQueryBuilder('tag')
      .addSelect(
        TAG_PRODUCT_COUNT_SUBQUERY_FOR_ALIAS('tag'),
        TAG_PRODUCT_COUNT_ALIAS,
      )
      .where('tag.deleted_at IS NULL')
      .andWhere(`${TAG_PRODUCT_COUNT_SUBQUERY_FOR_ALIAS('tag')} > 0`)
      .orderBy(TAG_PRODUCT_COUNT_SUBQUERY_FOR_ALIAS('tag'), 'DESC')
      .take(Math.min(limit, 100));

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    return entities.map((entity, index) => {
      const domain = TagMapper.toDomain(entity);
      domain.product_count = parseInt(raw[index]?.product_count || '0', 10);
      return domain;
    });
  }

  async update(
    id: number,
    payload: Partial<Tag>,
    currentUser: User,
  ): Promise<Tag> {
    const entity = await this.tagRepository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Tag not found');
    }

    const updatedEntity = await this.tagRepository.save({
      ...entity,
      ...TagMapper.toPersistence({
        ...TagMapper.toDomain(entity),
        ...payload,
        updated_by: currentUser,
      } as Tag),
    });

    return TagMapper.toDomain(updatedEntity);
  }

  async softDelete(id: number, currentUser: User): Promise<void> {
    const entity = await this.tagRepository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Tag not found');
    }

    await this.tagRepository.update(id, {
      deleted_at: new Date(),
      deleted_by: currentUser?.id,
      updated_by: currentUser?.id,
    });
  }

  async bulkDelete(ids: number[], currentUser: User): Promise<number> {
    const result = await this.tagRepository.update(
      { id: In(ids) },
      {
        deleted_at: new Date(),
        deleted_by: currentUser?.id,
        updated_by: currentUser?.id,
      },
    );

    return result.affected || 0;
  }

  async countProductsByTagId(tagId: number): Promise<number> {
    const result = await this.tagRepository.manager.query(
      'SELECT COUNT(*) as count FROM product_tags pt INNER JOIN products p ON p.id = pt.product_id AND p.deleted_at IS NULL WHERE pt.tag_id = $1',
      [tagId],
    );
    return parseInt(result[0]?.count || '0', 10);
  }
}
