import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { ProductFeaturedSectionEntity } from './persistence/entities/product-featured-section.entity';
import { ProductMapper } from '@/products/persistence/mappers/product.mapper';
import { Product } from '@/products/domain/product';
import { User } from '@/users/domain/user';
import { FindAllFeaturedProducts } from './domain/find-all-featured-products';
import { FindAllFeaturedProductCards } from './domain/find-all-featured-product-cards';
import { ProductCard } from '@/featured-products/domain/product-card';
import {
  QueryFeaturedProductsDto,
  QueryAdminFeaturedDto,
  SetFeaturedProductDto,
  BatchSetFeaturedDto,
  ReorderFeaturedDto,
  RemoveFeaturedDto,
} from './dto';
import { FeaturedSectionEnum } from '@/products/products.enum';
import { RedisHelper } from '@/utils/helpers/redis.helper';

/**
 * Maximum number of featured products per section
 */
const MAX_FEATURED_PER_SECTION = 20;

/**
 * Cache TTL in seconds (5 minutes)
 */
const CACHE_TTL = 300;

/**
 * Cache key prefix for featured products
 */
const CACHE_PREFIX = 'featured_products';

/**
 * Service for featured products business logic
 * Uses junction table for many-to-many relationship (products can be in multiple sections)
 * Implements Redis caching for public endpoints
 */
@Injectable()
export class FeaturedProductsService {
  private readonly logger = new Logger(FeaturedProductsService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductFeaturedSectionEntity)
    private readonly featuredSectionRepository: Repository<ProductFeaturedSectionEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly productVariantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    private readonly dataSource: DataSource,
    private readonly redisHelper: RedisHelper,
  ) {}

  /**
   * Generate cache key for featured products query
   */
  private getCacheKey(
    section?: FeaturedSectionEnum,
    skip?: number,
    take?: number,
  ): string {
    const sectionKey = section ?? 'all';
    return `${CACHE_PREFIX}:${sectionKey}:${skip ?? 0}:${take ?? 20}`;
  }

  /**
   * Invalidate all featured products cache using pattern matching
   * This ensures ALL cached queries are invalidated regardless of pagination params
   */
  private async invalidateCache(): Promise<void> {
    try {
      const deleted = await this.redisHelper.delByPattern(`${CACHE_PREFIX}:*`);
      this.logger.log(`Cache invalidated: ${deleted} keys deleted`);
    } catch (error) {
      this.logger.error('Failed to invalidate cache', error);
    }
  }

  /**
   * Get featured products for public display
   * Filters only published products with available stock
   * Results are cached in Redis
   */
  async findAllPublic(
    query: QueryFeaturedProductsDto,
  ): Promise<FindAllFeaturedProductCards> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;
    const section = query.section;

    // Try to get from cache first
    const cacheKey = this.getCacheKey(section, skip, take);
    try {
      const cached = await this.redisHelper.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn(`Cache read failed for key: ${cacheKey}`, error);
    }

    // Cache miss - query database
    this.logger.debug(`Cache miss for key: ${cacheKey}`);

    // Query the junction table to get featured products
    const queryBuilder = this.featuredSectionRepository
      .createQueryBuilder('pfs')
      .innerJoinAndSelect('pfs.product', 'product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect(
        'product.product_media_mappings',
        'product_media_mappings',
      )
      .leftJoinAndSelect('product_media_mappings.media', 'media')
      .where('product.status = :status', { status: 'Published' })
      .andWhere('product.deleted_at IS NULL');

    // Filter by section only if provided
    if (section) {
      queryBuilder.andWhere('pfs.section = :section', { section });
    }

    // Filter only products with available stock
    queryBuilder.andWhere((qb) => {
      const subQuery = qb
        .subQuery()
        .select('1')
        .from('product_variants', 'pv')
        .innerJoin('inventory_stocks', 'is', 'is.variant_id = pv.id')
        .where('pv.product_id = product.id')
        .andWhere('is.available_quantity > 0')
        .getQuery();
      return `EXISTS ${subQuery}`;
    });

    // Order by section (if showing all), then display_order, featured_at, product_id
    if (!section) {
      queryBuilder.orderBy('pfs.section', 'ASC');
      queryBuilder.addOrderBy('pfs.display_order', 'ASC');
    } else {
      queryBuilder.orderBy('pfs.display_order', 'ASC');
    }
    queryBuilder
      .addOrderBy('pfs.featured_at', 'DESC')
      .addOrderBy('pfs.product_id', 'ASC');

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(take);

    const featuredSections = await queryBuilder.getMany();
    const domainProducts = await Promise.all(
      featuredSections.map((fs) => ProductMapper.toDomain(fs.product)),
    );
    const priceRangeMap = await this.buildPriceRangeMap(domainProducts);
    const ratingMap = await this.buildRatingMap(domainProducts);
    const cards: ProductCard[] = featuredSections.map((fs, index) => {
      const product = domainProducts[index];
      const priceRange = priceRangeMap.get(product.id) ?? {
        minPrice: 0,
        maxPrice: 0,
      };
      const ratingInfo = ratingMap.get(product.id) ?? {
        averageRating: null,
        totalReviews: 0,
      };
      const sellerEntity = fs.product.seller;
      const seller = sellerEntity
        ? {
            id: sellerEntity.id,
            store_name: sellerEntity.store_name,
            store_logo_url: sellerEntity.store_logo_url ?? null,
          }
        : null;
      const card = new ProductCard();
      card.id = product.id;
      card.product_name = product.product_name;
      card.description = product.description ?? null;
      card.primary_image = product.primary_image ?? null;
      card.min_price = priceRange.minPrice;
      card.max_price = priceRange.maxPrice;
      card.average_rating = ratingInfo.averageRating;
      card.total_reviews = ratingInfo.totalReviews;
      card.seller = seller;
      return card;
    });

    const result: FindAllFeaturedProductCards = {
      data: cards,
      totalCount,
      skip,
      take,
    };

    // Only include section in response if it was filtered
    if (section) {
      result.section = section;
    }

    // Cache the result
    try {
      await this.redisHelper.set(cacheKey, JSON.stringify(result), CACHE_TTL);
      this.logger.debug(
        `Cached result for key: ${cacheKey} (TTL: ${CACHE_TTL}s)`,
      );
    } catch (error) {
      this.logger.warn(`Cache write failed for key: ${cacheKey}`, error);
    }

    return result;
  }

  private async buildPriceRangeMap(
    products: Product[],
  ): Promise<Map<number, { minPrice: number; maxPrice: number }>> {
    const productIds = products.map((product) => product.id);
    if (!productIds.length) {
      return new Map();
    }
    const rows = await this.productVariantRepository
      .createQueryBuilder('variant')
      .select('variant.product_id', 'product_id')
      .addSelect('MIN(variant.selling_price)', 'min_price')
      .addSelect('MAX(variant.selling_price)', 'max_price')
      .where('variant.product_id IN (:...productIds)', { productIds })
      .groupBy('variant.product_id')
      .getRawMany();
    const priceRangeMap = new Map<
      number,
      {
        minPrice: number;
        maxPrice: number;
      }
    >();
    rows.forEach((row) => {
      const productId = Number(row.product_id);
      const minPrice =
        row.min_price !== null && row.min_price !== undefined
          ? Number(row.min_price)
          : 0;
      const maxPrice =
        row.max_price !== null && row.max_price !== undefined
          ? Number(row.max_price)
          : 0;
      priceRangeMap.set(productId, {
        minPrice,
        maxPrice,
      });
    });
    return priceRangeMap;
  }

  private async buildRatingMap(products: Product[]): Promise<
    Map<
      number,
      {
        averageRating: number | null;
        totalReviews: number;
      }
    >
  > {
    const productIds = products.map((product) => product.id);
    if (!productIds.length) {
      return new Map();
    }
    const rows = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.product_id', 'product_id')
      .addSelect('AVG(review.rating)', 'avg_rating')
      .addSelect('COUNT(*)', 'total_reviews')
      .where('review.product_id IN (:...productIds)', { productIds })
      .andWhere('review.status = :status', { status: 'Active' })
      .andWhere('review.deleted_at IS NULL')
      .groupBy('review.product_id')
      .getRawMany();
    const ratingMap = new Map<
      number,
      {
        averageRating: number | null;
        totalReviews: number;
      }
    >();
    rows.forEach((row) => {
      const productId = Number(row.product_id);
      const averageRating = row.avg_rating ? parseFloat(row.avg_rating) : null;
      const totalReviews = row.total_reviews ? Number(row.total_reviews) : 0;
      ratingMap.set(productId, {
        averageRating,
        totalReviews,
      });
    });
    return ratingMap;
  }

  /**
   * Get featured products for admin management
   * Returns all featured products regardless of stock/status
   * Shows all sections a product belongs to
   * NOT cached (admin always sees fresh data)
   */
  async findAllAdmin(
    query: QueryAdminFeaturedDto,
  ): Promise<FindAllFeaturedProducts> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;
    const sortBy = query.sortBy ?? 'featured_order';
    const sortOrder = query.sortOrder ?? 'ASC';

    // Build query based on whether section filter is applied
    const queryBuilder = this.featuredSectionRepository
      .createQueryBuilder('pfs')
      .innerJoinAndSelect('pfs.product', 'product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('product.product_variants', 'product_variants')
      .leftJoinAndSelect('product_variants.inventory_stock', 'inventory_stock')
      .leftJoinAndSelect(
        'product.product_media_mappings',
        'product_media_mappings',
      )
      .leftJoinAndSelect('product_media_mappings.media', 'media')
      .leftJoinAndSelect('pfs.featured_by', 'featured_by')
      .leftJoinAndSelect('product.featured_sections', 'all_sections')
      .leftJoinAndSelect('all_sections.featured_by', 'all_sections_featured_by')
      .where('product.deleted_at IS NULL');

    // Filter by section if provided
    if (query.section) {
      queryBuilder.andWhere('pfs.section = :section', {
        section: query.section,
      });
    }

    // Apply sorting
    let sortColumn: string;
    if (sortBy === 'product_name') {
      sortColumn = 'product.product_name';
    } else if (sortBy === 'featured_order') {
      sortColumn = 'pfs.display_order';
    } else if (sortBy === 'featured_at') {
      sortColumn = 'pfs.featured_at';
    } else {
      sortColumn = 'pfs.display_order';
    }
    queryBuilder.orderBy(sortColumn, sortOrder);

    // Add secondary sort for consistency
    if (sortBy !== 'featured_order') {
      queryBuilder.addOrderBy('pfs.display_order', 'ASC');
    }
    queryBuilder.addOrderBy('pfs.product_id', 'ASC');

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(take);

    const featuredSections = await queryBuilder.getMany();

    // Map to products with all featured sections and total stock
    const products = featuredSections.map((fs) => {
      const product = ProductMapper.toDomain(fs.product);

      // Calculate total stock
      const totalStock =
        product.product_variants?.reduce((sum, variant) => {
          return sum + (variant.inventory_stock?.available_quantity ?? 0);
        }, 0) ?? 0;

      return {
        ...product,
        featured_section: fs.section,
        display_order: fs.display_order,
        featured_at: fs.featured_at,
        total_stock: totalStock,
      };
    });

    return {
      data: products,
      totalCount,
      skip,
      take,
    };
  }

  /**
   * Add a product to a featured section
   * A product can be in multiple sections simultaneously
   * Invalidates cache after mutation
   */
  async setFeatured(
    productId: number,
    dto: SetFeaturedProductDto,
    admin: User,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['featured_sections'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    // Validate product is published
    if (product.status !== 'Published') {
      throw new BadRequestException('Only published products can be featured');
    }

    const section = dto.featured_section ?? FeaturedSectionEnum.FEATURED;

    // Check if product is already in this section
    const existingInSection = await this.featuredSectionRepository.findOne({
      where: { product_id: productId, section },
    });

    if (existingInSection) {
      throw new ConflictException(
        `Product ${productId} is already in section "${section}"`,
      );
    }

    // Check max limit for section
    const currentCount = await this.featuredSectionRepository.count({
      where: { section },
    });

    if (currentCount >= MAX_FEATURED_PER_SECTION) {
      throw new BadRequestException(
        `Maximum featured products limit (${MAX_FEATURED_PER_SECTION}) reached for section "${section}"`,
      );
    }

    // Use transaction for atomic update with auto-ordering
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let targetOrder: number;

      if (dto.featured_order !== undefined) {
        // Insert at specific position - shift others down
        targetOrder = dto.featured_order;

        // Shift all products at or after this position down by 1
        await queryRunner.manager
          .createQueryBuilder()
          .update(ProductFeaturedSectionEntity)
          .set({ display_order: () => 'display_order + 1' })
          .where('section = :section', { section })
          .andWhere('display_order >= :targetOrder', { targetOrder })
          .execute();
      } else {
        // No order specified - put at the end
        const maxOrderResult = await queryRunner.manager
          .createQueryBuilder(ProductFeaturedSectionEntity, 'pfs')
          .select('MAX(pfs.display_order)', 'maxOrder')
          .where('pfs.section = :section', { section })
          .getRawOne();

        targetOrder = (maxOrderResult?.maxOrder ?? 0) + 1;
      }

      // Create the featured section entry
      const featuredSection = queryRunner.manager.create(
        ProductFeaturedSectionEntity,
        {
          product_id: productId,
          section,
          display_order: targetOrder,
          featured_at: new Date(),
          featured_by: { id: admin.id } as any,
        },
      );

      await queryRunner.manager.save(featuredSection);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Invalidate cache after successful mutation
    await this.invalidateCache();

    // Reload with all relations
    const updatedProduct = await this.productRepository.findOne({
      where: { id: productId },
      relations: [
        'seller',
        'product_variants',
        'product_variants.inventory_stock',
        'product_media_mappings',
        'product_media_mappings.media',
        'featured_sections',
        'featured_sections.featured_by',
      ],
    });

    return ProductMapper.toDomain(updatedProduct!);
  }

  /**
   * Remove a product from a specific featured section
   * Invalidates cache after mutation
   */
  async removeFeatured(
    productId: number,
    dto: RemoveFeaturedDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    // Find the featured section entry
    const featuredSection = await this.featuredSectionRepository.findOne({
      where: { product_id: productId, section: dto.section },
    });

    if (!featuredSection) {
      throw new BadRequestException(
        `Product ${productId} is not in section "${dto.section}"`,
      );
    }

    const currentOrder = featuredSection.display_order;

    // Use transaction for atomic update
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Remove the featured section entry
      await queryRunner.manager.delete(ProductFeaturedSectionEntity, {
        id: featuredSection.id,
      });

      // Shift products after this one up by 1 to fill the gap
      await queryRunner.manager
        .createQueryBuilder()
        .update(ProductFeaturedSectionEntity)
        .set({ display_order: () => 'display_order - 1' })
        .where('section = :section', { section: dto.section })
        .andWhere('display_order > :currentOrder', { currentOrder })
        .execute();

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Invalidate cache after successful mutation
    await this.invalidateCache();

    // Reload with all relations
    const updatedProduct = await this.productRepository.findOne({
      where: { id: productId },
      relations: [
        'seller',
        'product_variants',
        'product_variants.inventory_stock',
        'product_media_mappings',
        'product_media_mappings.media',
        'featured_sections',
        'featured_sections.featured_by',
      ],
    });

    return ProductMapper.toDomain(updatedProduct!);
  }

  /**
   * Batch add products to a section
   * Invalidates cache after mutation
   */
  async batchSetFeatured(
    dto: BatchSetFeaturedDto,
    admin: User,
  ): Promise<Product[]> {
    const productIds = dto.products.map((p) => p.product_id);

    // Fetch all products with their featured sections
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: ['seller', 'featured_sections'],
    });

    // Validate all products exist
    const foundIds = new Set(products.map((p) => p.id));
    const missingIds = productIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw new NotFoundException(
        `Products not found: ${missingIds.join(', ')}`,
      );
    }

    // Validate all products being featured are published
    for (const item of dto.products) {
      if (item.is_featured) {
        const product = products.find((p) => p.id === item.product_id);
        if (product && product.status !== 'Published') {
          throw new BadRequestException(
            `Product ${item.product_id} is not published and cannot be featured`,
          );
        }
      }
    }

    // Group products being added by section to check limits
    const addingBySection = new Map<FeaturedSectionEnum, number>();
    for (const item of dto.products) {
      if (item.is_featured) {
        const section = item.featured_section ?? FeaturedSectionEnum.FEATURED;
        const product = products.find((p) => p.id === item.product_id);

        // Only count if product isn't already in this section
        const alreadyInSection = product?.featured_sections?.some(
          (fs) => fs.section === section,
        );
        if (!alreadyInSection) {
          addingBySection.set(section, (addingBySection.get(section) ?? 0) + 1);
        }
      }
    }

    // Check limits for each section
    for (const [section, newCount] of addingBySection) {
      const currentCount = await this.featuredSectionRepository.count({
        where: { section },
      });

      if (currentCount + newCount > MAX_FEATURED_PER_SECTION) {
        throw new BadRequestException(
          `Maximum featured products limit (${MAX_FEATURED_PER_SECTION}) would be exceeded for section "${section}"`,
        );
      }
    }

    // Track which sections are affected for cache invalidation
    const affectedSections = new Set<FeaturedSectionEnum>();

    // Use transaction for atomic update
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();

      for (const item of dto.products) {
        const product = products.find((p) => p.id === item.product_id);
        if (!product) continue;

        const section = item.featured_section ?? FeaturedSectionEnum.FEATURED;
        affectedSections.add(section);

        if (item.is_featured) {
          // Check if already in section
          const alreadyInSection = product.featured_sections?.some(
            (fs) => fs.section === section,
          );
          if (alreadyInSection) continue; // Skip if already in section

          // Get max order in section
          const maxOrderResult = await queryRunner.manager
            .createQueryBuilder(ProductFeaturedSectionEntity, 'pfs')
            .select('MAX(pfs.display_order)', 'maxOrder')
            .where('pfs.section = :section', { section })
            .getRawOne();

          const displayOrder =
            item.featured_order ?? (maxOrderResult?.maxOrder ?? 0) + 1;

          // Create featured section entry
          const featuredSection = queryRunner.manager.create(
            ProductFeaturedSectionEntity,
            {
              product_id: item.product_id,
              section,
              display_order: displayOrder,
              featured_at: now,
              featured_by: { id: admin.id } as any,
            },
          );

          await queryRunner.manager.save(featuredSection);
        } else {
          // Remove from section
          await queryRunner.manager.delete(ProductFeaturedSectionEntity, {
            product_id: item.product_id,
            section,
          });
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Invalidate cache for all affected sections
    await this.invalidateCache();

    // Fetch updated products
    const updatedProducts = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: [
        'seller',
        'product_variants',
        'product_variants.inventory_stock',
        'product_media_mappings',
        'product_media_mappings.media',
        'featured_sections',
        'featured_sections.featured_by',
      ],
    });

    return Promise.all(
      updatedProducts.map((entity) => ProductMapper.toDomain(entity)),
    );
  }

  /**
   * Reorder featured products within a section
   * Invalidates cache after mutation
   */
  async reorder(dto: ReorderFeaturedDto): Promise<Product[]> {
    const { product_ids, section } = dto;

    // Check for duplicate IDs
    const uniqueIds = new Set(product_ids);
    if (uniqueIds.size !== product_ids.length) {
      throw new BadRequestException('Duplicate product IDs in reorder request');
    }

    // Fetch all featured section entries for these products in this section
    const featuredSections = await this.featuredSectionRepository.find({
      where: { product_id: In(product_ids), section },
    });

    // Validate all products are in the section
    const foundIds = new Set(featuredSections.map((fs) => fs.product_id));
    const missingIds = product_ids.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Products are not in section "${section}": ${missingIds.join(', ')}`,
      );
    }

    // Use transaction for atomic update
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update display_order for each product in the section
      for (let i = 0; i < product_ids.length; i++) {
        await queryRunner.manager.update(
          ProductFeaturedSectionEntity,
          { product_id: product_ids[i], section },
          { display_order: i + 1 },
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Invalidate cache after successful mutation
    await this.invalidateCache();

    // Fetch updated products
    const updatedProducts = await this.productRepository.find({
      where: { id: In(product_ids) },
      relations: [
        'seller',
        'product_variants',
        'product_variants.inventory_stock',
        'product_media_mappings',
        'product_media_mappings.media',
        'featured_sections',
        'featured_sections.featured_by',
      ],
    });

    // Sort by the new order
    const productMap = new Map(updatedProducts.map((p) => [p.id, p]));
    const sortedProducts = product_ids
      .map((id) => productMap.get(id)!)
      .filter(Boolean);

    return Promise.all(
      sortedProducts.map((entity) => ProductMapper.toDomain(entity)),
    );
  }
}
