import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BaseProductRepository } from '@/products/persistence/base-product.repository';
import { Product } from '@/products/domain/product';
import { FindAllProduct } from '@/products/domain/find-all-product';
import { CreateProductDto } from '@/products/dto/create-product.dto';
import { UpdateProductDto } from '@/products/dto/update-product.dto';
import { QueryProductDto } from '@/products/dto/query-product.dto';
import { User } from '@/users/domain/user';
import { UserSearchHistoriesService } from '@/user-search-histories/user-search-histories.service';
import {
  ProductSearchCriteria,
  ProductSearchSort,
} from '@/products/domain/product-search-criteria';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { ProductPublishValidationException } from '@/products/exceptions/product-publish-validation.exception';
import { ListingTypeEnum } from '@/products/enums/listing-type.enum';
import { FeaturedProductsCacheService } from '@/featured-products/featured-products-cache.service';
import { ProductCacheService } from '@/products/product-cache.service';

/**
 * Service for product business logic
 */
@Injectable()
export class ProductsService {
  constructor(
    private readonly repository: BaseProductRepository,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    private readonly userSearchHistoriesService: UserSearchHistoriesService,
    private readonly dataSource: DataSource,
    private readonly featuredProductsCacheService: FeaturedProductsCacheService,
    private readonly productCacheService: ProductCacheService,
  ) {}

  private async findProductByIdOrThrow(id: number): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  private async findSellerOrThrow(causer: User): Promise<SellerEntity> {
    const seller = await this.sellerRepository.findOne({
      where: { user_id: causer.id },
    });
    if (!seller) {
      throw new ForbiddenException(
        'You must be a registered seller to manage products',
      );
    }
    return seller;
  }

  private async findProductIdsWithPendingOrders(
    productIds: number[],
  ): Promise<Set<number>> {
    if (productIds.length === 0) {
      return new Set<number>();
    }
    const rows: Array<{ product_id: string }> = await this.dataSource
      .getRepository(SalesOrderItemEntity)
      .createQueryBuilder('sales_order_item')
      .select('variant.product_id', 'product_id')
      .innerJoin('sales_order_item.order', 'sales_order')
      .innerJoin('sales_order_item.variant', 'variant')
      .where('sales_order_item.item_type = :itemType', {
        itemType: CartItemTypeEnum.PRODUCT,
      })
      .andWhere('sales_order.status = :status', {
        status: OrderStatusEnum.PENDING,
      })
      .andWhere('sales_order_item.deleted_at IS NULL')
      .andWhere('sales_order.deleted_at IS NULL')
      .andWhere('variant.product_id IN (:...productIds)', { productIds })
      .groupBy('variant.product_id')
      .getRawMany();
    return new Set<number>(rows.map((row) => Number(row.product_id)));
  }

  private async getDeleteBlockedMessage(
    productId: number,
  ): Promise<string | null> {
    const productIdsWithPendingOrders =
      await this.findProductIdsWithPendingOrders([productId]);
    if (!productIdsWithPendingOrders.has(productId)) {
      return null;
    }
    return 'You cannot delete this product because it has pending orders';
  }

  private assertProductBelongsToSellerOrThrow(
    product: Product,
    seller: SellerEntity,
  ): void {
    if (product.seller_id !== seller.id) {
      throw new ForbiddenException(
        'You can only delete products that belong to you',
      );
    }
  }

  async deleteOne(
    id: number,
    causer: User,
  ): Promise<{
    readonly is_deleted: boolean;
    readonly message?: string;
  }> {
    const product = await this.findProductByIdOrThrow(id);
    const seller = await this.findSellerOrThrow(causer);
    this.assertProductBelongsToSellerOrThrow(product, seller);
    const blockedMessage = await this.getDeleteBlockedMessage(product.id);
    if (blockedMessage) {
      return {
        is_deleted: false,
        message: blockedMessage,
      };
    }
    const partialProduct: Partial<Product> = new Product();
    Object.assign(partialProduct, {
      deleted_by: causer.id,
    });
    await this.repository.update(id, partialProduct);
    await this.repository.remove(id);

    // Invalidate caches
    await this.productCacheService.invalidate(product.id);
    await this.featuredProductsCacheService.invalidateIfFeatured(product.id);

    return { is_deleted: true };
  }

  async deleteBulk(
    ids: number[],
    causer: User,
  ): Promise<{
    readonly deleted_ids: number[];
    readonly blocked_products: Array<{
      readonly id: number;
      readonly product_name: string;
      readonly reason: string;
    }>;
  }> {
    if (ids.length === 0) {
      return { deleted_ids: [], blocked_products: [] };
    }
    const seller = await this.findSellerOrThrow(causer);
    const uniqueIds = Array.from(new Set(ids));
    const products: Product[] = [];
    for (const id of uniqueIds) {
      const product = await this.repository.findById(id);
      if (product) {
        products.push(product);
      }
    }
    const productsById = new Map<number, Product>(
      products.map((product) => [product.id, product]),
    );
    const blockedProducts: Array<{
      readonly id: number;
      readonly product_name: string;
      readonly reason: string;
    }> = [];
    const productIdsWithPendingOrders =
      await this.findProductIdsWithPendingOrders(
        Array.from(productsById.keys()),
      );
    const deletableIds: number[] = [];
    for (const id of uniqueIds) {
      const product = productsById.get(id);
      if (!product) {
        blockedProducts.push({
          id,
          product_name: `#${id}`,
          reason: 'Product not found',
        });
        continue;
      }
      if (product.seller_id !== seller.id) {
        blockedProducts.push({
          id: product.id,
          product_name: product.product_name,
          reason: 'You can only delete products that belong to you',
        });
        continue;
      }
      if (productIdsWithPendingOrders.has(product.id)) {
        blockedProducts.push({
          id: product.id,
          product_name: product.product_name,
          reason: 'Product has pending orders',
        });
        continue;
      }
      deletableIds.push(product.id);
    }
    for (const id of deletableIds) {
      const partialProduct: Partial<Product> = new Product();
      Object.assign(partialProduct, { deleted_by: causer.id });
      await this.repository.update(id, partialProduct);
      await this.repository.remove(id);
    }

    // Invalidate caches for deleted products
    if (deletableIds.length > 0) {
      await this.productCacheService.invalidateMany(deletableIds);
      await this.featuredProductsCacheService.invalidateIfAnyFeatured(
        deletableIds,
      );
    }

    return {
      deleted_ids: deletableIds,
      blocked_products: blockedProducts,
    };
  }

  /**
   * Get list of missing core fields required to allow Published status.
   */
  private getMissingCorePublishFields(product: Partial<Product>): string[] {
    const missingFields: string[] = [];
    if (!product.product_name || product.product_name.trim().length === 0) {
      missingFields.push('product_name');
    }
    if (!product.primary_image) {
      missingFields.push('primary_image');
    }
    if (
      product.listing_type !== ListingTypeEnum.MATERIAL &&
      (!product.categories || product.categories.length === 0)
    ) {
      missingFields.push('categories');
    }
    if (!product.product_variants || product.product_variants.length === 0) {
      missingFields.push('product_variants');
    }
    if (product.product_variants && product.product_variants.length > 0) {
      const hasActiveVariant: boolean = product.product_variants.some(
        (variant) => variant.status === 'Active',
      );
      if (!hasActiveVariant) {
        missingFields.push('active_product_variant');
      }
    }
    return missingFields;
  }

  /**
   * Determine the correct product status based on core requirements.
   *
   * If core fields are missing, status must be Draft (never Published).
   */
  private getNormalizedProductStatus(
    product: Partial<Product>,
  ): Product['status'] {
    const status: Product['status'] = product.status ?? 'Draft';
    const missingFields = this.getMissingCorePublishFields(product);
    if (missingFields.length > 0) {
      return 'Draft';
    }
    return status;
  }

  /**
   * Create a new product
   */
  async create(input: CreateProductDto, causer: User): Promise<Product> {
    // Check if the user exists as a seller
    const seller = await this.sellerRepository.findOne({
      where: { user_id: causer.id },
    });

    if (!seller) {
      throw new ForbiddenException(
        'You must be a registered seller to create products',
      );
    }

    const product = Object.assign(new Product(), input, {
      status: input.status ?? 'Draft',
      listing_type: input.listing_type ?? ListingTypeEnum.PRODUCT,
      created_by: causer,
      updated_by: causer,
      seller_id: seller.id,
    });

    const requestedStatus: Product['status'] = input.status ?? 'Draft';
    const missingFields = this.getMissingCorePublishFields(product);
    product.status = this.getNormalizedProductStatus(product);
    const createdProduct = await this.repository.create(product);
    if (requestedStatus === 'Published' && missingFields.length > 0) {
      throw new ProductPublishValidationException(missingFields);
    }
    return createdProduct;
  }

  /**
   * Get all products with pagination and filters.
   * Also records a user_search_history entry when a keyword search is used.
   */
  async findAll(
    query: QueryProductDto,
    currentUser: User,
  ): Promise<FindAllProduct> {
    const criteria = this.buildSearchCriteriaFromQuery(query, {
      includeInventoryStock:
        currentUser.system_admin === true || Boolean(currentUser.seller_id),
    });
    const result = await this.repository.findAll(criteria);

    // Ratings, lowest_price and total_reviews are already computed at DB level
    // in the repository. Only strip product_media_mappings from the response.
    const sanitizedProducts = result.data.map((product) => {
      product.product_media_mappings = undefined;
      return product;
    });

    const sanitizedResult: FindAllProduct = {
      data: sanitizedProducts,
      totalCount: result.totalCount,
      skip: result.skip,
      take: result.take,
    };

    const keyword = query.product_name?.trim();
    if (keyword) {
      // Fire-and-forget to optimize performance
      this.userSearchHistoriesService
        .createFromSearch({
          user: currentUser,
          keyword,
        })
        .catch(() => {
          // Silently ignore errors during search history recording to not affect search results
        });
    }

    return sanitizedResult;
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
   * Get a product by ID.
   *
   * When excludeVariants=true, variants are excluded at the database level
   * (no JOIN performed), reducing query complexity and payload size.
   *
   * Results are cached in Redis for 5 minutes to reduce database load.
   */
  async findById(
    id: number,
    options?: {
      readonly excludeVariants?: boolean;
    },
  ): Promise<Product> {
    const excludeVariants = options?.excludeVariants ?? false;

    // Try to get from cache first
    const cached = await this.productCacheService.get(id, excludeVariants);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const product = await this.repository.findById(id, options);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    const ratingMap = await this.buildRatingMap([product]);
    const ratingStats = ratingMap.get(product.id);
    product.average_rating = ratingStats?.averageRating ?? null;
    product.total_reviews = ratingStats?.totalReviews ?? 0;

    // Cache the result
    await this.productCacheService.set(id, product, excludeVariants);

    return product;
  }

  /**
   * Update a product
   */
  async update(
    id: number,
    input: UpdateProductDto,
    causer: User,
  ): Promise<Product> {
    const product = await this.findById(id);

    // Check if the causer is the seller of this product
    const seller = await this.sellerRepository.findOne({
      where: { id: product.seller_id, user_id: causer.id },
    });

    if (!seller) {
      throw new ForbiddenException(
        'You can only update products that belong to you',
      );
    }

    const updatedProduct: Partial<Product> = {
      ...product,
      ...input,
      status: input.status ?? product.status,
    };
    const requestedStatus: Product['status'] = input.status ?? product.status;
    const missingFields = this.getMissingCorePublishFields(updatedProduct);
    const normalizedStatus = this.getNormalizedProductStatus(updatedProduct);

    const partialProduct: Partial<Product> = new Product();
    Object.assign(partialProduct, input, {
      updated_by: causer.id,
      status: normalizedStatus,
    });
    const updated = await this.repository.update(id, partialProduct);
    if (requestedStatus === 'Published' && missingFields.length > 0) {
      throw new ProductPublishValidationException(missingFields);
    }

    // Invalidate caches
    await this.productCacheService.invalidate(id);
    await this.featuredProductsCacheService.invalidateIfFeatured(id);

    return updated;
  }

  /**
   * Delete a product
   */
  async delete(
    id: number,
    causer: User,
  ): Promise<{
    readonly is_deleted: boolean;
    readonly message?: string;
  }> {
    return this.deleteOne(id, causer);
  }

  private buildSearchCriteriaFromQuery(
    query: QueryProductDto,
    options?: {
      readonly includeInventoryStock?: boolean;
    },
  ): ProductSearchCriteria {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;
    const productName = query.product_name?.trim() || undefined;
    const status = query.status;
    const sellerId = query.seller_id;
    const categoryIds = query.category_ids;
    const tagIds = query.tag_ids;
    const sort = this.buildSortFromQuery(query);
    const priceRangeStart = query.price_range_start;
    const priceRangeEnd = query.price_range_end;
    const minRating = query.rating;
    const featuredSection = query.featured_section;
    const includeInventoryStock = options?.includeInventoryStock;
    const listingType = query.listing_type;
    const activeSellerOnly = query.active_seller_only;
    return {
      skip,
      take,
      productName,
      status,
      sellerId,
      includeInventoryStock,
      categoryIds,
      tagIds,
      sort,
      priceRangeStart,
      priceRangeEnd,
      minRating,
      featuredSection,
      listingType,
      activeSellerOnly,
    };
  }

  private buildSortFromQuery(
    query: QueryProductDto,
  ): ProductSearchSort | undefined {
    if (query.sortField) {
      const direction = query.sortBy || 'ASC';
      return {
        field: query.sortField,
        direction,
      };
    }
    if (query.sortBy) {
      return {
        field: 'created_at',
        direction: query.sortBy,
      };
    }
    return undefined;
  }
}
