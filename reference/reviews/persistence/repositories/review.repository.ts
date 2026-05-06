import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { FindAllReview } from '@/reviews/domain/find-all-review';
import { Review } from '@/reviews/domain/review';
import { ReviewMapper } from '@/reviews/persistence/mappers/review.mapper';
import { BaseReviewRepository } from '@/reviews/persistence/base-review.repository';
import { ReviewableTypeEnum } from '@/reviews/enums/reviewable-type.enum';
import { ReviewSourceTypeEnum } from '@/reviews/enums/review-source-type.enum';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { UserAddressMapper } from '@/user-addresses/persistence/mappers/user-address.mapper';

@Injectable()
export class ReviewRepository extends BaseReviewRepository {
  constructor(
    @InjectRepository(ReviewEntity)
    protected repository: Repository<ReviewEntity>,
    @InjectRepository(UserAddressEntity)
    private readonly userAddressRepository: Repository<UserAddressEntity>,
  ) {
    super(repository);
  }

  async findAll(options: {
    skip?: number;
    take?: number;
    search?: string;
    user_id?: number;
    seller_id?: number;
    product_id?: number;
    service_id?: number;
    booking_id?: number;
    reviewable_type?: ReviewableTypeEnum;
    source_type?: ReviewSourceTypeEnum;
    rating?: number;
    is_anonymous?: boolean;
    is_verified_purchase?: boolean;
    status?: 'Active' | 'Removed';
  }): Promise<FindAllReview> {
    const {
      skip = 0,
      take = 20,
      search,
      user_id,
      seller_id,
      product_id,
      service_id,
      booking_id,
      reviewable_type,
      source_type,
      rating,
      is_anonymous,
      is_verified_purchase,
      status,
    } = options;

    const queryBuilder = this.repository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('user.default_address', 'user_default_address')
      .leftJoinAndSelect('review.seller', 'seller')
      .leftJoinAndSelect('review.product', 'product')
      .leftJoinAndSelect('review.sales_order_item', 'sales_order_item')
      .leftJoinAndSelect('sales_order_item.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'variant_product')
      .leftJoinAndSelect('review.service', 'service')
      .leftJoinAndSelect('review.booking', 'booking')
      .leftJoinAndSelect('review.created_by', 'created_by')
      .leftJoinAndSelect('review.updated_by', 'updated_by')
      .leftJoinAndSelect('review.deleted_by', 'deleted_by')
      .leftJoinAndSelect(
        'review.review_media_mappings',
        'review_media_mappings',
      )
      .leftJoinAndSelect('review_media_mappings.media', 'review_media');

    if (search) {
      queryBuilder.where('review.comment ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (user_id) {
      queryBuilder.andWhere('review.user_id = :user_id', { user_id });
    }

    if (seller_id) {
      queryBuilder.andWhere('review.seller_id = :seller_id', { seller_id });
    }

    if (product_id) {
      queryBuilder.andWhere('review.product_id = :product_id', { product_id });
    }

    if (service_id) {
      queryBuilder.andWhere('review.service_id = :service_id', { service_id });
    }

    if (booking_id) {
      queryBuilder.andWhere('review.booking_id = :booking_id', { booking_id });
    }

    if (reviewable_type) {
      queryBuilder.andWhere('review.reviewable_type = :reviewable_type', {
        reviewable_type,
      });
    }

    if (source_type) {
      queryBuilder.andWhere('review.source_type = :source_type', {
        source_type,
      });
    }

    if (rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    if (is_anonymous !== undefined && is_anonymous !== null) {
      queryBuilder.andWhere('review.is_anonymous = :is_anonymous', {
        is_anonymous,
      });
    }

    if (is_verified_purchase !== undefined && is_verified_purchase !== null) {
      queryBuilder.andWhere(
        'review.is_verified_purchase = :is_verified_purchase',
        {
          is_verified_purchase,
        },
      );
    }

    if (status) {
      queryBuilder.andWhere('review.status = :status', { status });
    }

    const [entities, totalCount] = await queryBuilder
      .orderBy('review.created_at', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    const data = entities.map((entity) => ReviewMapper.toDomain(entity));
    await this.populateUserAddresses(data);

    return {
      data,
      totalCount,
      skip,
      take,
    };
  }

  async findById(id: number): Promise<Review | null> {
    const entity = await this.repository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('user.default_address', 'user_default_address')
      .leftJoinAndSelect('review.seller', 'seller')
      .leftJoinAndSelect('review.product', 'product')
      .leftJoinAndSelect('review.sales_order_item', 'sales_order_item')
      .leftJoinAndSelect('sales_order_item.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'variant_product')
      .leftJoinAndSelect('review.service', 'service')
      .leftJoinAndSelect('review.booking', 'booking')
      .leftJoinAndSelect('review.created_by', 'created_by')
      .leftJoinAndSelect('review.updated_by', 'updated_by')
      .leftJoinAndSelect('review.deleted_by', 'deleted_by')
      .leftJoinAndSelect(
        'review.review_media_mappings',
        'review_media_mappings',
      )
      .leftJoinAndSelect('review_media_mappings.media', 'review_media')
      .where('review.id = :id', { id })
      .andWhere('review.deleted_at IS NULL')
      .getOne();

    if (!entity) {
      return null;
    }

    const review = ReviewMapper.toDomain(entity);
    await this.populateUserAddresses([review]);
    return review;
  }

  async create(domain: Review): Promise<Review> {
    const entity = ReviewMapper.toEntity(domain);
    const savedEntity = await this.repository.save(entity);
    return ReviewMapper.toDomain(savedEntity);
  }

  async update(id: number, domain: Review): Promise<Review> {
    const entity = ReviewMapper.toEntity(domain);
    entity.id = id;
    const savedEntity = await this.repository.save(entity);
    return ReviewMapper.toDomain(savedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }

  async hardDelete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findByUserAndSalesOrderItem(
    userId: number,
    salesOrderItemId: number,
  ): Promise<Review | null> {
    const entity = await this.repository
      .createQueryBuilder('review')
      .where('review.user_id = :userId', { userId })
      .andWhere('review.sales_order_item_id = :salesOrderItemId', {
        salesOrderItemId,
      })
      .andWhere('review.deleted_at IS NULL')
      .getOne();

    return entity ? ReviewMapper.toDomain(entity) : null;
  }

  async findByUserAndSalesOrder(
    userId: number,
    salesOrderId: number,
  ): Promise<Review | null> {
    const entity = await this.repository
      .createQueryBuilder('review')
      .where('review.user_id = :userId', { userId })
      .andWhere('review.source_type = :sourceType', {
        sourceType: ReviewSourceTypeEnum.SALES_ORDER,
      })
      .andWhere('review.source_id = :salesOrderId', { salesOrderId })
      .andWhere('review.deleted_at IS NULL')
      .getOne();

    return entity ? ReviewMapper.toDomain(entity) : null;
  }

  async findByUserAndBooking(
    userId: number,
    bookingId: number,
  ): Promise<Review | null> {
    const entity = await this.repository
      .createQueryBuilder('review')
      .where('review.user_id = :userId', { userId })
      .andWhere('review.booking_id = :bookingId', { bookingId })
      .andWhere('review.deleted_at IS NULL')
      .getOne();

    return entity ? ReviewMapper.toDomain(entity) : null;
  }

  async findByService(serviceId: number): Promise<Review[]> {
    const entities = await this.repository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('user.default_address', 'user_default_address')
      .leftJoinAndSelect('review.seller', 'seller')
      .leftJoinAndSelect('review.service', 'service')
      .leftJoinAndSelect(
        'review.review_media_mappings',
        'review_media_mappings',
      )
      .leftJoinAndSelect('review_media_mappings.media', 'review_media')
      .where('review.service_id = :serviceId', { serviceId })
      .andWhere('review.deleted_at IS NULL')
      .andWhere('review.status = :status', { status: 'Active' })
      .orderBy('review.created_at', 'DESC')
      .getMany();

    const reviews = entities.map((entity) => ReviewMapper.toDomain(entity));
    await this.populateUserAddresses(reviews);
    return reviews;
  }

  /**
   * Helper method to populate default_address for users that don't have one
   */
  private async populateUserAddresses(reviews: Review[]): Promise<void> {
    // Get unique user IDs that don't have default_address
    const userIdsWithoutDefault = new Set<number>();
    reviews.forEach((review) => {
      if (review.user && !review.user.default_address && review.user.id) {
        userIdsWithoutDefault.add(review.user.id);
      }
    });

    // Fetch first address for each user (prioritizing default, then by created_at)
    if (userIdsWithoutDefault.size > 0) {
      const userIdsArray = Array.from(userIdsWithoutDefault);
      const addresses = await this.userAddressRepository.find({
        where: {
          user_id: In(userIdsArray),
          deleted_at: IsNull(),
        },
        order: {
          is_default: 'DESC',
          created_at: 'ASC',
        },
      });

      // Group addresses by user_id (take first one per user)
      const addressesByUserId = new Map<number, UserAddressEntity>();
      addresses.forEach((address) => {
        if (!addressesByUserId.has(address.user_id)) {
          addressesByUserId.set(address.user_id, address);
        }
      });

      // Populate default_address for users that don't have one
      reviews.forEach((review) => {
        if (
          review.user &&
          !review.user.default_address &&
          review.user.id &&
          addressesByUserId.has(review.user.id)
        ) {
          const addressEntity = addressesByUserId.get(review.user.id)!;
          review.user.default_address =
            UserAddressMapper.toDomain(addressEntity);
          review.user.default_address_id = addressEntity.id;
        }
      });
    }
  }

  async findBySeller(sellerId: number): Promise<Review[]> {
    const entities = await this.repository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('user.default_address', 'user_default_address')
      .leftJoinAndSelect('review.seller', 'seller')
      .leftJoinAndSelect('review.product', 'product')
      .leftJoinAndSelect('review.service', 'service')
      .leftJoinAndSelect(
        'review.review_media_mappings',
        'review_media_mappings',
      )
      .leftJoinAndSelect('review_media_mappings.media', 'review_media')
      .where('review.seller_id = :sellerId', { sellerId })
      .andWhere('review.deleted_at IS NULL')
      .andWhere('review.status = :status', { status: 'Active' })
      .orderBy('review.created_at', 'DESC')
      .getMany();

    const reviews = entities.map((entity) => ReviewMapper.toDomain(entity));
    await this.populateUserAddresses(reviews);
    return reviews;
  }

  async calculateServiceRating(serviceId: number): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    const result = await this.repository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.service_id = :serviceId', { serviceId })
      .andWhere('review.deleted_at IS NULL')
      .andWhere('review.status = :status', { status: 'Active' })
      .getRawOne();

    return {
      averageRating: result?.averageRating
        ? parseFloat(result.averageRating)
        : 0,
      totalReviews: result?.totalReviews ? parseInt(result.totalReviews) : 0,
    };
  }
}
