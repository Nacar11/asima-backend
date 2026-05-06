import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseProductRepository } from '@/products/persistence/base-product.repository';
import { Product } from '@/products/domain/product';
import { ProductSearchCriteria } from '@/products/domain/product-search-criteria';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { InventoryStockEntity } from '@/inventory-stocks/persistence/entities/inventory-stock.entity';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ProductCard } from '@/featured-products/domain/product-card';
import { FindAllRecommendedProduct } from '@/recommendations/domain/find-all-recommended-product';
import { QueryRecommendationsDto } from '@/recommendations/dto/query-recommendations.dto';
import { RedisHelper } from '@/utils/helpers/redis.helper';
import { ProductStatusEnum } from '@/utils/enums/product.enum';

@Injectable()
export class RecommendationsService {
  private static readonly MIN_RELEVANCE_SCORE: number = 20;

  constructor(
    private readonly productRepository: BaseProductRepository,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly inventoryStockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(SalesOrderItemEntity)
    private readonly salesOrderItemRepository: Repository<SalesOrderItemEntity>,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
    private readonly redisHelper: RedisHelper,
  ) {}

  private buildCacheKey(input: {
    sourceProductId: number;
    type: string;
    skip: number;
    take: number;
  }): string {
    const { sourceProductId, type, skip, take } = input;
    return `recommended_products:${sourceProductId}:${type}:skip=${skip}:take=${take}`;
  }

  async getRecommendations(
    sourceProductId: number,
    query: QueryRecommendationsDto,
  ): Promise<FindAllRecommendedProduct> {
    const type = query.type ?? 'similar';
    if (!['similar', 'same_category', 'same_seller'].includes(type)) {
      throw new BadRequestException(
        `Invalid recommendation type. Valid types: similar, same_category, same_seller`,
      );
    }

    const skip = query.skip ?? 0;
    const take = query.take ?? 10;

    // const cacheKey = this.buildCacheKey({
    //   sourceProductId,
    //   type,
    //   skip,
    //   take,
    // });

    // const cached = await this.redisHelper.get(cacheKey);
    // if (cached) {
    //   return JSON.parse(cached) as FindAllRecommendedProduct;
    // }

    const sourceProduct =
      await this.productRepository.findById(sourceProductId);
    if (!sourceProduct || sourceProduct.status !== 'Published') {
      throw new NotFoundException('Source product not found');
    }

    if (type === 'similar') {
      const result = await this.findSimilarProducts({
        sourceProduct,
        skip,
        take,
        type,
      });
      // await this.redisHelper.set(cacheKey, JSON.stringify(result), 600);
      return result;
    }

    if (type === 'same_category') {
      const result = await this.findSameCategoryProducts({
        sourceProduct,
        skip,
        take,
        type,
      });
      // await this.redisHelper.set(cacheKey, JSON.stringify(result), 600);
      return result;
    }

    const result = await this.findSameSellerProducts({
      sourceProduct,
      skip,
      take,
      type,
    });
    // await this.redisHelper.set(cacheKey, JSON.stringify(result), 600);
    return result;
  }

  private async findSimilarProducts(input: {
    sourceProduct: Product;
    skip: number;
    take: number;
    type: 'similar';
  }): Promise<FindAllRecommendedProduct> {
    const { sourceProduct, skip, take, type } = input;

    const primaryCategoryId = this.getPrimaryCategoryId(sourceProduct);

    const criteria: ProductSearchCriteria = {
      skip: 0,
      take: 100,
      status: ProductStatusEnum.PUBLISHED,
      categoryIds: primaryCategoryId ? [primaryCategoryId] : undefined,
    };

    const allProductsResult = await this.productRepository.findAll(criteria);
    const rawCandidates = allProductsResult.data.filter(
      (product) => product.id !== sourceProduct.id,
    );
    if (rawCandidates.length === 0) {
      console.log('here');
      console.log(allProductsResult);
      return {
        data: [],
        totalCount: 0,
        skip,
        take,
        recommendation_type: type,
        source_product_id: sourceProduct.id,
      };
    }

    const sellerMap = await this.buildSellerMap(rawCandidates);
    const inStockIds = await this.findInStockProductIds(rawCandidates);
    const stockFiltered = rawCandidates.filter(
      (product) =>
        inStockIds.has(product.id) && sellerMap.has(product.seller_id ?? -1),
    );

    if (stockFiltered.length === 0) {
      return {
        data: [],
        totalCount: 0,
        skip,
        take,
        recommendation_type: type,
        source_product_id: sourceProduct.id,
      };
    }

    const ratingMap = await this.buildRatingMap(stockFiltered);

    const sourcePrimaryCategoryId = this.getPrimaryCategoryId(sourceProduct);
    const sourceTagIds = this.getTagIds(sourceProduct);
    const sourcePriceRange = this.getPriceRange(sourceProduct);

    const scored = stockFiltered.map((candidate) => {
      const candidatePrimaryCategoryId = this.getPrimaryCategoryId(candidate);
      const candidateTagIds = this.getTagIds(candidate);
      const candidatePriceRange = this.getPriceRange(candidate);

      const relevanceScore = this.computeSimilarityScore({
        sourcePrimaryCategoryId,
        candidatePrimaryCategoryId,
        sourceTagIds,
        candidateTagIds,
        sourcePriceRange,
        candidatePriceRange,
        sameSeller: candidate.seller_id === sourceProduct.seller_id,
      });

      const ratingInfo = ratingMap.get(candidate.id) ?? {
        averageRating: null,
        totalReviews: 0,
      };

      const seller = sellerMap.get(candidate.seller_id) ?? null;

      const recommended = new ProductCard();
      recommended.id = candidate.id;
      recommended.product_name = candidate.product_name;
      recommended.description = candidate.description ?? null;
      recommended.primary_image = candidate.primary_image ?? null;
      recommended.min_price = candidatePriceRange.minPrice;
      recommended.max_price = candidatePriceRange.maxPrice;
      recommended.average_rating = ratingInfo.averageRating;
      recommended.total_reviews = ratingInfo.totalReviews;
      recommended.seller = seller
        ? {
            id: seller.id,
            store_name: seller.store_name,
            store_logo_url: seller.store_logo_url,
          }
        : null;
      recommended.relevance_score = relevanceScore;

      return recommended;
    });

    const filteredByScore = scored.filter((item) => {
      const score = item.relevance_score ?? 0;
      return score >= RecommendationsService.MIN_RELEVANCE_SCORE;
    });

    if (filteredByScore.length > 0) {
      filteredByScore.sort((a, b) => {
        const aScore = a.relevance_score ?? 0;
        const bScore = b.relevance_score ?? 0;
        if (bScore !== aScore) {
          return bScore - aScore;
        }
        const aRating = a.average_rating ?? 0;
        const bRating = b.average_rating ?? 0;
        if (bRating !== aRating) {
          return bRating - aRating;
        }
        const aReviews = a.total_reviews ?? 0;
        const bReviews = b.total_reviews ?? 0;
        return bReviews - aReviews;
      });

      const totalCount = filteredByScore.length;
      const paged = filteredByScore.slice(skip, skip + take);

      return {
        data: paged,
        totalCount,
        skip,
        take,
        recommendation_type: type,
        source_product_id: sourceProduct.id,
      };
    }

    if (!primaryCategoryId) {
      return {
        data: [],
        totalCount: 0,
        skip,
        take,
        recommendation_type: type,
        source_product_id: sourceProduct.id,
      };
    }

    const fallbackCategoryCandidates = stockFiltered.filter((candidate) => {
      const candidatePrimaryCategoryId = this.getPrimaryCategoryId(candidate);
      return candidatePrimaryCategoryId === primaryCategoryId;
    });

    if (!fallbackCategoryCandidates.length) {
      return {
        data: [],
        totalCount: 0,
        skip,
        take,
        recommendation_type: type,
        source_product_id: sourceProduct.id,
      };
    }

    const fallbackProducts = fallbackCategoryCandidates.map((candidate) => {
      const ratingInfo = ratingMap.get(candidate.id) ?? {
        averageRating: null,
        totalReviews: 0,
      };
      const candidatePriceRange = this.getPriceRange(candidate);
      const seller = sellerMap.get(candidate.seller_id) ?? null;

      const recommended = new ProductCard();
      recommended.id = candidate.id;
      recommended.product_name = candidate.product_name;
      recommended.description = candidate.description ?? null;
      recommended.primary_image = candidate.primary_image ?? null;
      recommended.min_price = candidatePriceRange.minPrice;
      recommended.max_price = candidatePriceRange.maxPrice;
      recommended.average_rating = ratingInfo.averageRating;
      recommended.total_reviews = ratingInfo.totalReviews;
      recommended.seller = seller
        ? {
            id: seller.id,
            store_name: seller.store_name,
            store_logo_url: seller.store_logo_url,
          }
        : null;
      recommended.relevance_score = RecommendationsService.MIN_RELEVANCE_SCORE;

      return recommended;
    });

    fallbackProducts.sort((a, b) => {
      const aRating = a.average_rating ?? 0;
      const bRating = b.average_rating ?? 0;
      if (bRating !== aRating) {
        return bRating - aRating;
      }
      const aReviews = a.total_reviews ?? 0;
      const bReviews = b.total_reviews ?? 0;
      return bReviews - aReviews;
    });

    const totalCount = fallbackProducts.length;
    const paged = fallbackProducts.slice(skip, skip + take);

    return {
      data: paged,
      totalCount,
      skip,
      take,
      recommendation_type: type,
      source_product_id: sourceProduct.id,
    };
  }

  private async findSameCategoryProducts(input: {
    sourceProduct: Product;
    skip: number;
    take: number;
    type: 'same_category';
  }): Promise<FindAllRecommendedProduct> {
    const { sourceProduct, skip, take, type } = input;
    const primaryCategoryId = this.getPrimaryCategoryId(sourceProduct);

    if (!primaryCategoryId) {
      return {
        data: [],
        totalCount: 0,
        skip,
        take,
        recommendation_type: type,
        source_product_id: sourceProduct.id,
      };
    }

    const category = await this.categoryRepository.findOne({
      where: { id: primaryCategoryId },
    });

    const criteria: ProductSearchCriteria = {
      skip: 0,
      take: 100,
      status: ProductStatusEnum.PUBLISHED,
      categoryIds: [primaryCategoryId],
    };

    const primaryResult = await this.productRepository.findAll(criteria);
    let rawCandidates = primaryResult.data.filter(
      (product) => product.id !== sourceProduct.id,
    );

    if (rawCandidates.length < 5 && category?.parent_category_id) {
      const parentCriteria: ProductSearchCriteria = {
        skip: 0,
        take: 100,
        status: ProductStatusEnum.PUBLISHED,
        categoryIds: [category.parent_category_id],
      };
      const parentResult = await this.productRepository.findAll(parentCriteria);
      const parentCandidates = parentResult.data.filter(
        (product) => product.id !== sourceProduct.id,
      );
      const existingIds = new Set(rawCandidates.map((product) => product.id));
      rawCandidates = rawCandidates.concat(
        parentCandidates.filter((product) => !existingIds.has(product.id)),
      );
    }

    if (rawCandidates.length === 0) {
      return {
        data: [],
        totalCount: 0,
        skip,
        take,
        recommendation_type: type,
        source_product_id: sourceProduct.id,
      };
    }

    const sellerMap = await this.buildSellerMap(rawCandidates);
    const inStockIds = await this.findInStockProductIds(rawCandidates);
    const stockFiltered = rawCandidates.filter((product) =>
      inStockIds.has(product.id),
    );

    if (stockFiltered.length === 0) {
      return {
        data: [],
        totalCount: 0,
        skip,
        take,
        recommendation_type: type,
        source_product_id: sourceProduct.id,
      };
    }

    const ratingMap = await this.buildRatingMap(stockFiltered);
    const salesMap = await this.buildSalesCountMap(stockFiltered);

    const createdAtValues = stockFiltered
      .map((product) => product.created_at?.getTime() ?? 0)
      .filter((value) => value > 0);
    const newestCreatedAt = createdAtValues.length
      ? Math.max(...createdAtValues)
      : 0;

    const scored = stockFiltered.map((candidate) => {
      const ratingInfo = ratingMap.get(candidate.id) ?? {
        averageRating: null,
        totalReviews: 0,
      };
      const salesCount = salesMap.get(candidate.id) ?? 0;
      const candidateCreatedAt = candidate.created_at?.getTime() ?? 0;
      const recommended = new ProductCard();

      const bestsellerScore = this.normalizeScore(salesCount, salesMap);
      const ratingScore = this.normalizeRatingScore(ratingInfo.averageRating);
      const newestScore = this.normalizeNewestScore(
        candidateCreatedAt,
        newestCreatedAt,
      );

      const relevanceScore =
        bestsellerScore * 40 + ratingScore * 30 + newestScore * 30;

      const priceRange = this.getPriceRange(candidate);
      const seller = sellerMap.get(candidate.seller_id) ?? null;

      recommended.id = candidate.id;
      recommended.product_name = candidate.product_name;
      recommended.description = candidate.description ?? null;
      recommended.primary_image = candidate.primary_image ?? null;
      recommended.min_price = priceRange.minPrice;
      recommended.max_price = priceRange.maxPrice;
      recommended.average_rating = ratingInfo.averageRating;
      recommended.total_reviews = ratingInfo.totalReviews;
      recommended.seller = seller
        ? {
            id: seller.id,
            store_name: seller.store_name,
            store_logo_url: seller.store_logo_url,
          }
        : null;
      recommended.relevance_score = relevanceScore;

      return recommended;
    });

    scored.sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));

    const totalCount = scored.length;
    const paged = scored.slice(skip, skip + Math.min(take, 20));

    return {
      data: paged,
      totalCount,
      skip,
      take,
      recommendation_type: type,
      source_product_id: sourceProduct.id,
    };
  }

  private async findSameSellerProducts(input: {
    sourceProduct: Product;
    skip: number;
    take: number;
    type: 'same_seller';
  }): Promise<FindAllRecommendedProduct> {
    const { sourceProduct, skip, take, type } = input;

    if (!sourceProduct.seller_id) {
      return {
        data: [],
        totalCount: 0,
        skip,
        take,
        recommendation_type: type,
        source_product_id: sourceProduct.id,
      };
    }

    const criteria: ProductSearchCriteria = {
      skip: 0,
      take: 100,
      status: ProductStatusEnum.PUBLISHED,
      sellerId: sourceProduct.seller_id,
    };

    const allProductsResult = await this.productRepository.findAll(criteria);
    const rawCandidates = allProductsResult.data.filter(
      (product) => product.id !== sourceProduct.id,
    );

    if (rawCandidates.length === 0) {
      return {
        data: [],
        totalCount: 0,
        skip,
        take,
        recommendation_type: type,
        source_product_id: sourceProduct.id,
      };
    }

    const sellerMap = await this.buildSellerMap(rawCandidates);
    const inStockIds = await this.findInStockProductIds(rawCandidates);
    const stockFiltered = rawCandidates.filter((product) =>
      inStockIds.has(product.id),
    );

    if (stockFiltered.length === 0) {
      return {
        data: [],
        totalCount: 0,
        skip,
        take,
        recommendation_type: type,
        source_product_id: sourceProduct.id,
      };
    }

    const ratingMap = await this.buildRatingMap(stockFiltered);
    const salesMap = await this.buildSalesCountMap(stockFiltered);

    const createdAtValues = stockFiltered
      .map((product) => product.created_at?.getTime() ?? 0)
      .filter((value) => value > 0);
    const newestCreatedAt = createdAtValues.length
      ? Math.max(...createdAtValues)
      : 0;

    const scored = stockFiltered.map((candidate) => {
      const ratingInfo = ratingMap.get(candidate.id) ?? {
        averageRating: null,
        totalReviews: 0,
      };
      const salesCount = salesMap.get(candidate.id) ?? 0;
      const candidateCreatedAt = candidate.created_at?.getTime() ?? 0;
      const recommended = new ProductCard();

      const bestsellerScore = this.normalizeScore(salesCount, salesMap);
      const ratingScore = this.normalizeRatingScore(ratingInfo.averageRating);
      const newestScore = this.normalizeNewestScore(
        candidateCreatedAt,
        newestCreatedAt,
      );

      const relevanceScore =
        bestsellerScore * 50 + ratingScore * 30 + newestScore * 20;

      const priceRange = this.getPriceRange(candidate);
      const seller = sellerMap.get(candidate.seller_id) ?? null;

      recommended.id = candidate.id;
      recommended.product_name = candidate.product_name;
      recommended.description = candidate.description ?? null;
      recommended.primary_image = candidate.primary_image ?? null;
      recommended.min_price = priceRange.minPrice;
      recommended.max_price = priceRange.maxPrice;
      recommended.average_rating = ratingInfo.averageRating;
      recommended.total_reviews = ratingInfo.totalReviews;
      recommended.seller = seller
        ? {
            id: seller.id,
            store_name: seller.store_name,
            store_logo_url: seller.store_logo_url,
          }
        : null;
      recommended.relevance_score = relevanceScore;

      return recommended;
    });

    scored.sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));

    const totalCount = scored.length;
    const paged = scored.slice(skip, skip + take);

    return {
      data: paged,
      totalCount,
      skip,
      take,
      recommendation_type: type,
      source_product_id: sourceProduct.id,
    };
  }

  private getPrimaryCategoryId(product: Product): number | null {
    const categories = product.categories || [];
    const primary = categories.find((category) => category.is_primary);
    if (primary) {
      return primary.id;
    }
    return categories.length ? categories[0].id : null;
  }

  private getTagIds(product: Product): number[] {
    return (product.tags || []).map((tag) => tag.id);
  }

  private getPriceRange(product: Product): {
    minPrice: number;
    maxPrice: number;
  } {
    const variants = product.product_variants || [];
    if (!variants.length) {
      return {
        minPrice: 0,
        maxPrice: 0,
      };
    }

    const prices = variants
      .map((variant) => Number(variant.selling_price))
      .filter((price) => price > 0 && !isNaN(price));

    if (!prices.length) {
      return {
        minPrice: 0,
        maxPrice: 0,
      };
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return {
      minPrice,
      maxPrice,
    };
  }

  private computeSimilarityScore(input: {
    sourcePrimaryCategoryId: number | null;
    candidatePrimaryCategoryId: number | null;
    sourceTagIds: number[];
    candidateTagIds: number[];
    sourcePriceRange: { minPrice: number; maxPrice: number };
    candidatePriceRange: { minPrice: number; maxPrice: number };
    sameSeller: boolean;
  }): number {
    const {
      sourcePrimaryCategoryId,
      candidatePrimaryCategoryId,
      sourceTagIds,
      candidateTagIds,
      sourcePriceRange,
      candidatePriceRange,
      sameSeller,
    } = input;

    let score = 0;

    if (
      sourcePrimaryCategoryId &&
      candidatePrimaryCategoryId &&
      sourcePrimaryCategoryId === candidatePrimaryCategoryId
    ) {
      score += 30;
    }

    if (sourceTagIds.length && candidateTagIds.length) {
      const shared = candidateTagIds.filter((tagId) =>
        sourceTagIds.includes(tagId),
      );
      const sharedCount = shared.length;
      const normalizedShared = Math.min(sharedCount, 3) / 3;
      score += normalizedShared * 25;
    }

    const sourceMidPrice =
      (sourcePriceRange.minPrice + sourcePriceRange.maxPrice) / 2;
    const candidateMidPrice =
      (candidatePriceRange.minPrice + candidatePriceRange.maxPrice) / 2;

    if (sourceMidPrice > 0 && candidateMidPrice > 0) {
      const diff = Math.abs(candidateMidPrice - sourceMidPrice);
      const diffPercentage = diff / sourceMidPrice;

      if (diffPercentage <= 0.3) {
        score += 20;
      } else if (diffPercentage <= 0.5) {
        score += 10;
      }
    }

    if (sameSeller) {
      score += 10;
    }

    return score;
  }

  private async buildSellerMap(
    products: Product[],
  ): Promise<Map<number, SellerEntity>> {
    const sellerIds = Array.from(
      new Set(
        products
          .map((product) => product.seller_id)
          .filter((id): id is number => id !== undefined && id !== null),
      ),
    );

    if (!sellerIds.length) {
      return new Map();
    }

    const sellers = await this.sellerRepository.findBy({
      id: In(sellerIds),
    });

    const sellerMap = new Map<number, SellerEntity>();
    sellers
      .filter((seller) => seller.is_active)
      .forEach((seller) => {
        sellerMap.set(seller.id, seller);
      });

    return sellerMap;
  }

  private async findInStockProductIds(
    products: Product[],
  ): Promise<Set<number>> {
    const productIds = products.map((product) => product.id);

    if (!productIds.length) {
      return new Set<number>();
    }

    const rows = await this.inventoryStockRepository
      .createQueryBuilder('stock')
      .leftJoin(
        ProductVariantEntity,
        'variant',
        'variant.id = stock.variant_id',
      )
      .where('variant.product_id IN (:...productIds)', { productIds })
      .andWhere('stock.available_quantity > 0')
      .select('DISTINCT variant.product_id', 'product_id')
      .getRawMany();

    const inStockIds = new Set<number>();
    rows.forEach((row) => {
      inStockIds.add(Number(row.product_id));
    });

    return inStockIds;
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

  private async buildSalesCountMap(
    products: Product[],
  ): Promise<Map<number, number>> {
    const productIds = products.map((product) => product.id);

    if (!productIds.length) {
      return new Map();
    }

    const rows = await this.salesOrderItemRepository
      .createQueryBuilder('item')
      .leftJoin('item.variant', 'variant')
      .where('variant.product_id IN (:...productIds)', { productIds })
      .select('variant.product_id', 'product_id')
      .addSelect('SUM(item.quantity)', 'total_quantity')
      .groupBy('variant.product_id')
      .getRawMany();

    const salesMap = new Map<number, number>();
    rows.forEach((row) => {
      salesMap.set(Number(row.product_id), Number(row.total_quantity));
    });

    return salesMap;
  }

  private normalizeScore(value: number, valueMap: Map<number, number>): number {
    if (value <= 0) {
      return 0;
    }

    const allValues = Array.from(valueMap.values());
    if (!allValues.length) {
      return 0;
    }

    const maxValue = Math.max(...allValues);
    if (maxValue <= 0) {
      return 0;
    }

    return value / maxValue;
  }

  private normalizeRatingScore(averageRating: number | null): number {
    if (!averageRating || averageRating <= 0) {
      return 0;
    }
    const normalized = averageRating / 5;
    if (normalized < 0) {
      return 0;
    }
    if (normalized > 1) {
      return 1;
    }
    return normalized;
  }

  private normalizeNewestScore(
    createdAt: number,
    newestCreatedAt: number,
  ): number {
    if (
      !createdAt ||
      !newestCreatedAt ||
      createdAt <= 0 ||
      newestCreatedAt <= 0
    ) {
      return 0;
    }

    const diff = newestCreatedAt - createdAt;
    if (diff <= 0) {
      return 1;
    }

    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const ratio = 1 - Math.min(diff / thirtyDaysInMs, 1);

    if (ratio < 0) {
      return 0;
    }
    if (ratio > 1) {
      return 1;
    }
    return ratio;
  }
}
