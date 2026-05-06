import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseProductRepository } from '@/products/persistence/base-product.repository';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { ProductTagEntity } from '@/product-tags/persistence/entities/product-tag.entity';
import { ProductMapper } from '@/products/persistence/mappers/product.mapper';
import { Product } from '@/products/domain/product';
import { FindAllProduct } from '@/products/domain/find-all-product';
import { ProductSearchCriteria } from '@/products/domain/product-search-criteria';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { ProductSortConfig } from '@/products/persistence/repositories/product-sort.constants';
import { ListingTypeEnum } from '@/products/enums/listing-type.enum';

/**
 * Concrete repository for product persistence operations
 */
@Injectable()
export class ProductRepository extends BaseProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productsRepository: Repository<ProductEntity>,
    @InjectRepository(ProductCategoryEntity)
    private readonly productCategoriesRepository: Repository<ProductCategoryEntity>,
    @InjectRepository(ProductTagEntity)
    private readonly productTagsRepository: Repository<ProductTagEntity>,
  ) {
    super();
  }

  async create(data: Product): Promise<Product> {
    const persistenceModel = ProductMapper.toPersistence(data);
    const newEntity = await this.productsRepository.save(
      this.productsRepository.create(persistenceModel),
    );
    const entityWithRelations = await this.productsRepository.findOne({
      where: { id: newEntity.id },
      relations: [
        'seller',
        'product_categories',
        'product_categories.category',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    if (!entityWithRelations) {
      throw new Error('Failed to retrieve created product');
    }
    return ProductMapper.toDomain(entityWithRelations);
  }

  /**
   * Optimised findAll using a two-phase query strategy:
   *
   * Phase 1 – Lightweight ID query
   *   Applies all filters, sorting and pagination on the *products* table only
   *   (no heavy relation JOINs). Computes aggregates (lowest_price,
   *   average_rating, total_reviews) and total count in a single round-trip
   *   via window functions.
   *
   * Phase 2 – Detail query
   *   Loads full product entities (with relations) only for the paginated IDs
   *   returned by Phase 1, eliminating the cartesian-product explosion that
   *   previously caused 40 s response times.
   */
  async findAll(criteria: ProductSearchCriteria): Promise<FindAllProduct> {
    const skip = criteria.skip;
    const take = criteria.take;
    const sortField = criteria.sort?.field ?? null;
    const sortDirection = criteria.sort?.direction ?? null;
    const isPriceSorting = sortField === ProductSortConfig.FIELD.PRICE;
    const isPopularitySorting =
      sortField === ProductSortConfig.FIELD.POPULARITY;
    const isTopRatedSorting = sortField === ProductSortConfig.FIELD.TOP_RATED;

    // ── Pre-filter: resolve category / tag IDs ──────────────────────────
    let productIds: number[] | undefined;
    if (criteria.categoryIds?.length) {
      const rows = await this.productCategoriesRepository
        .createQueryBuilder('pc')
        .select('DISTINCT pc.product_id', 'product_id')
        .where('pc.category_id IN (:...categoryIds)', {
          categoryIds: criteria.categoryIds,
        })
        .getRawMany();
      productIds = rows.map((r) => Number(r.product_id));
      if (productIds.length === 0) {
        return { data: [], totalCount: 0, skip, take };
      }
    }
    if (criteria.tagIds?.length) {
      const rows = await this.productTagsRepository
        .createQueryBuilder('pt')
        .select('DISTINCT pt.product_id', 'product_id')
        .where('pt.tag_id IN (:...tagIds)', { tagIds: criteria.tagIds })
        .getRawMany();
      const tagProductIds = rows.map((r) => Number(r.product_id));
      if (tagProductIds.length === 0) {
        return { data: [], totalCount: 0, skip, take };
      }
      productIds = productIds
        ? productIds.filter((id) => tagProductIds.includes(id))
        : tagProductIds;
      if (productIds.length === 0) {
        return { data: [], totalCount: 0, skip, take };
      }
    }

    // ── Phase 1: lightweight ID + aggregates query ──────────────────────
    const idQb = this.productsRepository
      .createQueryBuilder('product')
      .select('product.id', 'id')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('pv.product_id', 'product_id')
            .addSelect('MIN(pv.selling_price)', 'lowest_price')
            .from('product_variants', 'pv')
            .where('pv.deleted_at IS NULL')
            .groupBy('pv.product_id'),
        'pv_agg',
        'pv_agg.product_id = product.id',
      )
      .addSelect('pv_agg.lowest_price', 'lowest_price')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('r.product_id', 'product_id')
            .addSelect('AVG(r.rating)', 'avg_rating')
            .addSelect('COUNT(*)', 'total_reviews')
            .from('reviews', 'r')
            .where("r.status = 'Active'")
            .andWhere('r.deleted_at IS NULL')
            .groupBy('r.product_id'),
        'rv_agg',
        'rv_agg.product_id = product.id',
      )
      .addSelect('rv_agg.avg_rating', 'avg_rating')
      .addSelect('rv_agg.total_reviews', 'total_reviews')
      .addSelect('COUNT(*) OVER()', 'total_count');

    // Tag / product_name search needs a tag join on the ID query
    if (criteria.productName) {
      idQb
        .leftJoin('product.product_tags', 'product_tags')
        .leftJoin('product_tags.tag', 'tag');
    }

    // Seller status filtering needs seller join on the ID query
    if (criteria.activeSellerOnly === true) {
      idQb.leftJoin('product.seller', 'seller');
    }

    this.applyFilters(idQb, criteria, productIds);

    // Sorting
    if (isPriceSorting) {
      const dir: 'ASC' | 'DESC' = (sortDirection as 'ASC' | 'DESC') || 'ASC';
      idQb
        .orderBy('lowest_price', dir, 'NULLS LAST')
        .addOrderBy('product.id', 'ASC');
    } else if (isPopularitySorting) {
      idQb.addSelect(
        `(SELECT COUNT(DISTINCT so.id) FROM sales_orders so ` +
          `INNER JOIN sales_order_items item ON item.order_id = so.id ` +
          `INNER JOIN product_variants variant ON variant.id = item.variant_id ` +
          `WHERE variant.product_id = product.id AND so.status = :completedStatus)`,
        'popularity_score',
      );
      idQb.setParameter('completedStatus', OrderStatusEnum.COMPLETED);
      idQb.orderBy(
        'popularity_score',
        (sortDirection as 'ASC' | 'DESC') || 'DESC',
      );
    } else if (isTopRatedSorting) {
      idQb.orderBy(
        'avg_rating',
        (sortDirection as 'ASC' | 'DESC') || 'DESC',
        'NULLS LAST',
      );
    } else {
      const createdAtOrder =
        sortField === ProductSortConfig.FIELD.CREATED_AT && sortDirection
          ? sortDirection
          : ProductSortConfig.DEFAULT_ORDER;
      idQb.orderBy('product.created_at', createdAtOrder);
    }

    idQb.offset(skip).limit(take);

    const idRows: Array<{
      id: number;
      lowest_price: string | null;
      avg_rating: string | null;
      total_reviews: string | null;
      total_count: string;
    }> = await idQb.getRawMany();

    if (idRows.length === 0) {
      return { data: [], totalCount: 0, skip, take };
    }

    const totalCount = parseInt(idRows[0].total_count, 10);
    const paginatedIds = idRows.map((r) => r.id);

    // Build lookup maps for computed aggregates
    const aggregateMap = new Map<
      number,
      {
        lowestPrice: number | null;
        avgRating: number | null;
        totalReviews: number;
      }
    >();
    for (const row of idRows) {
      aggregateMap.set(row.id, {
        lowestPrice: row.lowest_price ? parseFloat(row.lowest_price) : null,
        avgRating: row.avg_rating ? parseFloat(row.avg_rating) : null,
        totalReviews: row.total_reviews ? Number(row.total_reviews) : 0,
      });
    }

    // ── Phase 2: load full entities for paginated IDs only ──────────────
    const detailQb = this.productsRepository
      .createQueryBuilder('product')
      .whereInIds(paginatedIds)
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('product.product_categories', 'product_categories')
      .leftJoinAndSelect('product_categories.category', 'category')
      .leftJoinAndSelect(
        'product.product_media_mappings',
        'product_media_mappings',
      )
      .leftJoinAndSelect('product_media_mappings.media', 'media')
      .leftJoinAndSelect('product.product_tags', 'product_tags')
      .leftJoinAndSelect('product_tags.tag', 'tag')
      .leftJoinAndSelect('product.product_variants', 'product_variants')
      .leftJoinAndSelect('product_variants.media', 'variant_media')
      .leftJoinAndSelect('product.featured_sections', 'featured_sections');

    if (criteria.includeInventoryStock === true) {
      detailQb.leftJoinAndSelect(
        'product_variants.inventory_stock',
        'inventory_stock',
      );
    }

    if (criteria.sellerId !== undefined) {
      detailQb
        .leftJoinAndSelect('product.created_by', 'created_by')
        .leftJoinAndSelect('product.updated_by', 'updated_by')
        .leftJoinAndSelect('product.deleted_by', 'deleted_by');
    }

    const entities = await detailQb.getMany();

    // Preserve the sort order from Phase 1
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const orderedEntities = paginatedIds
      .map((id) => entityMap.get(id))
      .filter((e): e is ProductEntity => e !== undefined);

    const domainProducts = orderedEntities.map((entity) => {
      const product = ProductMapper.toDomain(entity);
      const agg = aggregateMap.get(entity.id);
      if (agg) {
        product.lowest_price = agg.lowestPrice;
        product.average_rating = agg.avgRating;
        product.total_reviews = agg.totalReviews;
      }
      return product;
    });

    return {
      data: domainProducts,
      totalCount,
      skip,
      take,
    };
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<ProductEntity>,
    criteria: ProductSearchCriteria,
    productIds?: number[],
  ): void {
    if (criteria.productName) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('product.product_name ILIKE :product_name', {
            product_name: `%${criteria.productName}%`,
          }).orWhere('tag.name ILIKE :product_name');
          qb.orWhere('tag.slug ILIKE :product_name');
        }),
      );
    }

    if (criteria.status) {
      queryBuilder.andWhere('product.status = :status', {
        status: criteria.status,
      });
    }

    if (criteria.sellerId !== undefined) {
      queryBuilder.andWhere('product.seller_id = :seller_id', {
        seller_id: criteria.sellerId,
      });
    }

    // Always filter by listing_type: default to 'product' if not specified
    // This ensures materials (listing_type='material') only show when explicitly requested
    const listingType = criteria.listingType ?? ListingTypeEnum.PRODUCT;
    queryBuilder.andWhere('product.listing_type = :listing_type', {
      listing_type: listingType,
    });

    if (productIds) {
      queryBuilder.andWhere('product.id IN (:...productIds)', {
        productIds,
      });
    }

    if (criteria.featuredSection) {
      queryBuilder.andWhere(
        `EXISTS (SELECT 1 FROM product_featured_sections pfs WHERE pfs.product_id = product.id AND pfs.section = :featuredSection)`,
      );
      queryBuilder.setParameter('featuredSection', criteria.featuredSection);
    }

    if (criteria.activeSellerOnly === true) {
      queryBuilder.andWhere('seller.status = :sellerStatus', {
        sellerStatus: 'Active',
      });
    }

    this.applyPriceRangeFilter(queryBuilder, criteria);
    this.applyRatingFilter(queryBuilder, criteria);
  }

  private applyPriceRangeFilter(
    queryBuilder: SelectQueryBuilder<ProductEntity>,
    criteria: ProductSearchCriteria,
  ): void {
    const { priceRangeStart, priceRangeEnd } = criteria;
    if (priceRangeStart === undefined && priceRangeEnd === undefined) {
      return;
    }
    const priceSubQuery = queryBuilder
      .subQuery()
      .select('pv_price.product_id')
      .from('product_variants', 'pv_price')
      .groupBy('pv_price.product_id');
    const minPriceExpression = 'MIN(pv_price.selling_price)';
    if (priceRangeStart !== undefined && priceRangeEnd !== undefined) {
      priceSubQuery.having(
        `${minPriceExpression} >= :priceRangeStart AND ${minPriceExpression} <= :priceRangeEnd`,
      );
    } else if (priceRangeStart !== undefined) {
      priceSubQuery.having(`${minPriceExpression} >= :priceRangeStart`);
    } else if (priceRangeEnd !== undefined) {
      priceSubQuery.having(`${minPriceExpression} <= :priceRangeEnd`);
    }
    queryBuilder.andWhere(`product.id IN ${priceSubQuery.getQuery()}`);
    if (priceRangeStart !== undefined) {
      queryBuilder.setParameter('priceRangeStart', priceRangeStart);
    }
    if (priceRangeEnd !== undefined) {
      queryBuilder.setParameter('priceRangeEnd', priceRangeEnd);
    }
  }

  private applyRatingFilter(
    queryBuilder: SelectQueryBuilder<ProductEntity>,
    criteria: ProductSearchCriteria,
  ): void {
    const { minRating } = criteria;
    if (minRating === undefined) {
      return;
    }
    const ratingSubQuery = queryBuilder
      .subQuery()
      .select('rating_filter.product_id')
      .from('reviews', 'rating_filter')
      .where('rating_filter.status = :activeReviewFilterStatus')
      .andWhere('rating_filter.deleted_at IS NULL')
      .groupBy('rating_filter.product_id')
      .having('AVG(rating_filter.rating) >= :minRating');
    queryBuilder.andWhere(`product.id IN ${ratingSubQuery.getQuery()}`);
    queryBuilder.setParameter('activeReviewFilterStatus', 'Active');
    queryBuilder.setParameter('minRating', minRating);
  }

  /**
   * Find product by ID with optimized query builder.
   *
   * Optimizations applied:
   * 1. QueryBuilder for fine-grained control over joins
   * 2. Conditional variant loading at DB level (not post-fetch filtering)
   * 3. Selective column loading for audit users (id, first_name, last_name only)
   * 4. Explicit join conditions for better query planning
   */
  async findById(
    id: number,
    options?: {
      readonly excludeVariants?: boolean;
    },
  ): Promise<Product | null> {
    const excludeVariants = options?.excludeVariants ?? false;

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .where('product.id = :id', { id });

    // Base relations - always loaded
    qb.leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('product.product_categories', 'product_categories')
      .leftJoinAndSelect('product_categories.category', 'category')
      .leftJoinAndSelect('product.product_attributes', 'product_attributes')
      .leftJoinAndSelect('product_attributes.attribute', 'attribute')
      .leftJoinAndSelect('attribute.attribute_values', 'attribute_values')
      .leftJoinAndSelect(
        'product.product_specifications',
        'product_specifications',
      )
      .leftJoinAndSelect('product.product_tags', 'product_tags')
      .leftJoinAndSelect('product_tags.tag', 'tag')
      .leftJoinAndSelect(
        'product.product_media_mappings',
        'product_media_mappings',
      )
      .leftJoinAndSelect('product_media_mappings.media', 'media');

    // Audit user relations - select only essential columns to reduce payload
    qb.leftJoin('product.created_by', 'created_by')
      .addSelect([
        'created_by.id',
        'created_by.first_name',
        'created_by.last_name',
      ])
      .leftJoin('product.updated_by', 'updated_by')
      .addSelect([
        'updated_by.id',
        'updated_by.first_name',
        'updated_by.last_name',
      ])
      .leftJoin('product.deleted_by', 'deleted_by')
      .addSelect([
        'deleted_by.id',
        'deleted_by.first_name',
        'deleted_by.last_name',
      ]);

    // Conditional variant loading - skip entirely at DB level when excluded
    if (!excludeVariants) {
      qb.leftJoinAndSelect('product.product_variants', 'product_variants')
        .leftJoinAndSelect(
          'product_variants.product_attribute_values',
          'variant_attribute_values',
        )
        .leftJoinAndSelect(
          'variant_attribute_values.attribute_value',
          'variant_attr_value',
        )
        .leftJoinAndSelect(
          'variant_attribute_values.product_attribute',
          'variant_product_attribute',
        )
        .leftJoinAndSelect('product_variants.media', 'variant_media')
        .leftJoinAndSelect(
          'product_variants.inventory_stock',
          'variant_inventory_stock',
        );
    }

    const entity = await qb.getOne();
    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async update(id: number, payload: Partial<Product>): Promise<Product> {
    const entity = await this.productsRepository.findOne({
      where: { id },
    });
    if (!entity) {
      throw new Error('Product not found');
    }

    // Only update scalar fields to avoid cascade issues with relations
    const updateData: Partial<ProductEntity> = {};
    if (payload.product_name !== undefined) {
      updateData.product_name = payload.product_name;
    }
    if (payload.description !== undefined) {
      updateData.description = payload.description;
    }
    if (payload.status !== undefined) {
      updateData.status = payload.status;
    }
    if (payload.listing_type !== undefined) {
      updateData.listing_type = payload.listing_type;
    }
    if (payload.updated_by !== undefined) {
      updateData.updated_by = { id: payload.updated_by } as any;
    }
    if (payload.deleted_by !== undefined) {
      updateData.deleted_by = { id: payload.deleted_by } as any;
    }

    await this.productsRepository.update(id, updateData);

    const entityWithRelations = await this.productsRepository.findOne({
      where: { id },
      relations: [
        'seller',
        'product_categories',
        'product_categories.category',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    if (!entityWithRelations) {
      throw new Error('Failed to retrieve updated product');
    }
    return ProductMapper.toDomain(entityWithRelations);
  }

  async remove(productId: number): Promise<void> {
    await this.productsRepository.softDelete(productId);
  }

  async syncCategories(
    productId: number,
    categoryIds: number[],
  ): Promise<Product> {
    await this.productCategoriesRepository.delete({ product_id: productId });

    if (categoryIds.length > 0) {
      const newAssociations = categoryIds.map((categoryId, index) =>
        this.productCategoriesRepository.create({
          product_id: productId,
          category_id: categoryId,
          display_order: index,
        }),
      );
      await this.productCategoriesRepository.save(newAssociations);
    }

    const product = await this.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }
}
