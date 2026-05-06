import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { BaseCategoryRepository } from '@/categories/persistence/base-category.repository';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { CategoryMapper } from '@/categories/persistence/mappers/category.mapper';
import { Category } from '@/categories/domain/category';
import { FindAllCategory } from '@/categories/domain/find-all-category';
import { CategorySearchCriteria } from '@/categories/domain/category-search-criteria';
import {
  CATEGORY_PRODUCT_COUNT_ALIAS,
  CATEGORY_RELATIONS,
  CATEGORY_RELATIONS_WITH_MEDIA,
  CATEGORY_DEFAULT_STATUS,
} from '@/categories/categories.constants';
import { PAGINATION_DEFAULTS } from '@/utils/constants/pagination.constants';

/**
 * Concrete repository for category persistence operations
 */
@Injectable()
export class CategoryRepository extends BaseCategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,
  ) {
    super();
  }

  async create(data: Category): Promise<Category> {
    const persistenceModel = CategoryMapper.toPersistence(data);

    const newEntity = await this.categoriesRepository.save(
      this.categoriesRepository.create(persistenceModel),
    );
    const entityWithRelations = await this.categoriesRepository.findOne({
      where: { id: newEntity.id },
      relations: CATEGORY_RELATIONS_WITH_MEDIA,
    });
    if (!entityWithRelations) {
      throw new Error('Failed to retrieve created category');
    }
    return CategoryMapper.toDomain(entityWithRelations);
  }

  async findAll(criteria: CategorySearchCriteria): Promise<FindAllCategory> {
    const skip = criteria.skip ?? PAGINATION_DEFAULTS.skip;
    const take = criteria.take ?? PAGINATION_DEFAULTS.take;
    const sortOrder = criteria.sortOrder ?? PAGINATION_DEFAULTS.sortOrder;
    const queryBuilder =
      this.categoriesRepository.createQueryBuilder('category');

    if (criteria.categoryName) {
      queryBuilder.andWhere('category.category_name ILIKE :category_name', {
        category_name: `%${criteria.categoryName}%`,
      });
    }

    const isGlobalOnly = criteria.isGlobal === true;
    const excludeGlobal = criteria.isGlobal === false;
    const includeGlobalWithSeller = criteria.includeGlobal === true;

    if (criteria.sellerId !== undefined) {
      if (includeGlobalWithSeller) {
        // Seller + global: show seller's categories AND global categories
        queryBuilder.andWhere(
          '(category.seller_id = :seller_id OR category.seller_id IS NULL)',
          {
            seller_id: criteria.sellerId,
          },
        );
      } else {
        // Seller only: show only seller's categories (exclude global)
        queryBuilder.andWhere('category.seller_id = :seller_id', {
          seller_id: criteria.sellerId,
        });
      }
    } else if (isGlobalOnly) {
      // Global only: show only categories where seller_id IS NULL
      queryBuilder.andWhere('category.seller_id IS NULL');
    } else if (excludeGlobal) {
      // Exclude global: show only personalized categories
      queryBuilder.andWhere('category.seller_id IS NOT NULL');
    }

    if (criteria.status) {
      queryBuilder.andWhere('category.status = :status', {
        status: criteria.status,
      });
    }

    if (criteria.activeSellerOnly === true) {
      queryBuilder.andWhere(
        '(category.seller_id IS NULL OR seller.status = :sellerStatus)',
        { sellerStatus: 'Active' },
      );
    }

    // Add product_count and sub_category_count via grouped JOINs (avoids correlated subqueries)
    queryBuilder
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('pc.category_id', 'category_id')
            .addSelect('COUNT(*)', 'count')
            .from('product_categories', 'pc')
            .innerJoin(
              'products',
              'p',
              'p.id = pc.product_id AND p.deleted_at IS NULL',
            )
            .where('pc.deleted_at IS NULL')
            .groupBy('pc.category_id'),
        'pc_agg',
        'pc_agg.category_id = category.id',
      )
      .addSelect('COALESCE(pc_agg.count, 0)', CATEGORY_PRODUCT_COUNT_ALIAS)
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('child.parent_category_id', 'parent_category_id')
            .addSelect('COUNT(*)', 'count')
            .from(CategoryEntity, 'child')
            .where('child.deleted_at IS NULL')
            .groupBy('child.parent_category_id'),
        'sc_agg',
        'sc_agg.parent_category_id = category.id',
      )
      .addSelect('COALESCE(sc_agg.count, 0)', 'sub_category_count')
      .addSelect('COUNT(*) OVER()', 'total_count')
      .leftJoinAndSelect('category.seller', 'seller')
      .leftJoinAndSelect('category.created_by', 'created_by')
      .leftJoinAndSelect('category.updated_by', 'updated_by')
      .leftJoinAndSelect('category.deleted_by', 'deleted_by')
      .leftJoinAndSelect('category.parent_category', 'parent_category')
      .orderBy('category.created_at', sortOrder)
      .skip(skip)
      .take(take);

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const totalCount = raw.length > 0 ? Number(raw[0]['total_count']) : 0;

    return {
      data: entities.map((entity, index) => {
        const domain = CategoryMapper.toDomain(entity);
        const rawRow = raw[index] ?? {};
        const rawProductCount = rawRow[CATEGORY_PRODUCT_COUNT_ALIAS];
        domain.product_count = Number(rawProductCount ?? 0);
        domain.sub_category_count = Number(rawRow['sub_category_count'] ?? 0);
        // Add parent category name from the joined relation
        if (entity.parent_category) {
          domain.parent_category_name = entity.parent_category.category_name;
        }
        return domain;
      }),
      totalCount,
      skip,
      take,
    };
  }

  async findById(id: number): Promise<Category | null> {
    const entity = await this.categoriesRepository.findOne({
      where: { id },
      relations: CATEGORY_RELATIONS_WITH_MEDIA,
    });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async update(id: number, payload: Partial<Category>): Promise<Category> {
    const entity = await this.categoriesRepository.findOne({
      where: { id },
      relations: CATEGORY_RELATIONS,
    });
    if (!entity) {
      throw new Error('Category not found');
    }

    const updatedEntity = await this.categoriesRepository.save(
      this.categoriesRepository.create(
        CategoryMapper.toPersistence({
          ...CategoryMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    const entityWithRelations = await this.categoriesRepository.findOne({
      where: { id: updatedEntity.id },
      relations: CATEGORY_RELATIONS_WITH_MEDIA,
    });
    if (!entityWithRelations) {
      throw new Error('Failed to retrieve updated category');
    }
    return CategoryMapper.toDomain(entityWithRelations);
  }

  async remove(id: number): Promise<void> {
    await this.categoriesRepository.softDelete(id);
  }

  async findGlobalCategories(): Promise<Category[]> {
    const entities = await this.categoriesRepository.find({
      where: {
        seller_id: IsNull(),
        status: CATEGORY_DEFAULT_STATUS,
      },
      relations: CATEGORY_RELATIONS_WITH_MEDIA,
      order: {
        display_order: 'ASC',
        created_at: 'ASC',
      },
    });
    return entities.map((entity) => CategoryMapper.toDomain(entity));
  }

  /**
   * Hard delete a category (permanent removal)
   */
  async hardDelete(id: number): Promise<void> {
    await this.categoriesRepository.delete(id);
  }

  /**
   * Count dependencies for a category (products and sub-categories)
   * Note: Only counts non-deleted products (matches the listing query logic)
   */
  async countDependencies(categoryId: number): Promise<{
    productCount: number;
    subCategoryCount: number;
  }> {
    // Match the listing query: only count products that are not soft-deleted
    const productCountResult = await this.categoriesRepository.manager.query(
      `SELECT COUNT(*) as count FROM product_categories pc
       INNER JOIN products p ON p.id = pc.product_id AND p.deleted_at IS NULL
       WHERE pc.category_id = $1 AND pc.deleted_at IS NULL`,
      [categoryId],
    );
    const subCategoryCountResult = await this.categoriesRepository.find({
      where: {
        parent_category_id: categoryId,
      },
    });
    return {
      productCount: parseInt(productCountResult[0]?.count ?? '0', 10),
      subCategoryCount: subCategoryCountResult.length,
    };
  }

  /**
   * Bulk hard delete categories (permanent removal)
   */
  async bulkHardDelete(ids: number[]): Promise<number> {
    const result = await this.categoriesRepository.delete(ids);
    return result.affected ?? 0;
  }

  /**
   * Batch update display_order for multiple categories
   */
  async bulkUpdateDisplayOrder(
    items: { id: number; display_order: number }[],
  ): Promise<void> {
    if (items.length === 0) return;
    await this.categoriesRepository.manager.transaction(async (manager) => {
      for (const item of items) {
        await manager.update(CategoryEntity, item.id, {
          display_order: item.display_order,
        });
      }
    });
  }

  /**
   * Find a category by slug within the same scope (global or seller-specific)
   * Used for duplicate slug validation
   */
  async findBySlug(
    slug: string,
    sellerId: number | null,
    excludeId?: number,
  ): Promise<Category | null> {
    const queryBuilder =
      this.categoriesRepository.createQueryBuilder('category');

    queryBuilder.where('category.slug = :slug', { slug });

    if (sellerId === null) {
      queryBuilder.andWhere('category.seller_id IS NULL');
    } else {
      queryBuilder.andWhere('category.seller_id = :sellerId', { sellerId });
    }

    if (excludeId) {
      queryBuilder.andWhere('category.id != :excludeId', { excludeId });
    }

    const entity = await queryBuilder.getOne();
    return entity ? CategoryMapper.toDomain(entity) : null;
  }
}
