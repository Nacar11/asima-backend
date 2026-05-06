import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewRepository } from '@/reviews/persistence/repositories/review.repository';
import { ReviewMediaMappingRepository } from '@/media/persistence/repositories/review-media-mapping.repository';
import { FindAllReview } from '@/reviews/domain/find-all-review';
import { Review } from '@/reviews/domain/review';
import { ReviewMediaMapping } from '@/media/domain/review-media-mapping';
import { CreateReviewDto } from '@/reviews/dto/create-review.dto';
import { CreateBookingReviewDto } from '@/reviews/dto/create-booking-review.dto';
import { UpdateReviewDto } from '@/reviews/dto/update-review.dto';
import { QueryReviewDto } from '@/reviews/dto/query-review.dto';
import { User } from '@/users/domain/user';
import { BaseSalesOrderRepository } from '@/sales-orders/persistence/base-sales-order.repository';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { MediaSellersService } from '@/media/sellers/services/media-sellers.service';
import { BookingsService } from '@/bookings/bookings.service';
import { ReviewableTypeEnum } from '@/reviews/enums/reviewable-type.enum';
import { ReviewSourceTypeEnum } from '@/reviews/enums/review-source-type.enum';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ProductCacheService } from '@/products/product-cache.service';
import { FeaturedProductsCacheService } from '@/featured-products/featured-products-cache.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly repository: ReviewRepository,
    private readonly reviewMediaMappingRepository: ReviewMediaMappingRepository,
    private readonly salesOrderRepository: BaseSalesOrderRepository,
    private readonly mediaService: MediaSellersService,
    private readonly bookingsService: BookingsService,
    private readonly notificationsService: NotificationsService,
    private readonly productCacheService: ProductCacheService,
    private readonly featuredProductsCacheService: FeaturedProductsCacheService,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
  ) {}

  async create(
    createDto: CreateReviewDto,
    currentUser: User,
    files?: Express.Multer.File[],
  ): Promise<Review> {
    const salesOrder = await this.salesOrderRepository.findSalesOrderItemByUser(
      currentUser.id,
      createDto.sales_order_item_id,
    );
    if (!salesOrder) {
      throw new NotFoundException(
        'Sales order not found or you do not own this purchase.',
      );
    }

    const existingReview = await this.repository.findByUserAndSalesOrderItem(
      currentUser.id,
      createDto.sales_order_item_id,
    );
    if (existingReview) {
      throw new ConflictException('You have already reviewed this item.');
    }

    if (salesOrder.status !== OrderStatusEnum.COMPLETED) {
      throw new BadRequestException(
        'You can only review orders that have been completed. Please complete your order first to leave a review.',
      );
    }

    const salesOrderItem = salesOrder.items?.find(
      (item) => item.id === createDto.sales_order_item_id,
    );
    if (!salesOrderItem) {
      throw new NotFoundException('Sales order item not found.');
    }

    // Determine if this is a product or service review
    const productId: number | undefined = salesOrderItem.variant?.product?.id;
    const serviceId: number | undefined =
      salesOrderItem.service_id ?? undefined;
    const itemType = salesOrderItem.item_type;

    let reviewableType: ReviewableTypeEnum;
    if (itemType === 'service' && serviceId) {
      reviewableType = ReviewableTypeEnum.SERVICE;
    } else if (itemType === 'product' && productId) {
      reviewableType = ReviewableTypeEnum.PRODUCT;
    } else {
      throw new BadRequestException(
        'Sales order item must be either a product or service item to review.',
      );
    }

    // Get seller_id from order, or fallback to service seller
    let sellerId: number | null | undefined = salesOrder.seller_id;

    // Fallback: Get seller from service if order doesn't have seller_id
    // Note: Product seller_id is not available in the sales order item domain model
    if (
      !sellerId &&
      itemType === 'service' &&
      salesOrderItem.service?.seller?.id
    ) {
      sellerId = salesOrderItem.service.seller.id;
    }

    if (sellerId === null || sellerId === undefined) {
      throw new BadRequestException(
        'Sales order has no seller. Unable to determine seller for this review.',
      );
    }

    const review = new Review();
    review.user_id = currentUser.id;
    review.seller_id = sellerId;
    review.product_id = productId;
    review.service_id = serviceId;
    review.reviewable_type = reviewableType;
    review.source_type = ReviewSourceTypeEnum.SALES_ORDER;
    review.source_id = salesOrder.id;
    review.sales_order_item_id = createDto.sales_order_item_id;
    review.rating = createDto.rating;
    review.comment = createDto.comment;
    review.is_anonymous = createDto.is_anonymous ?? false;
    review.is_verified_purchase =
      salesOrder.status === OrderStatusEnum.COMPLETED;
    review.status = 'Active';
    review.aspect_ratings = createDto.aspect_ratings;
    review.created_by = currentUser;
    review.updated_by = currentUser;

    const createdReview = await this.repository.create(review);

    // Handle file uploads outside transaction (external storage)
    if (files && files.length > 0) {
      const mediaIds: number[] = [];

      // Upload each file and get media ID
      for (const file of files) {
        const media = await this.mediaService.createMediaFromFile(
          file,
          currentUser.id,
          sellerId,
        );
        mediaIds.push(media.id);
      }

      // Create media mappings
      const mediaMappings: ReviewMediaMapping[] = mediaIds.map(
        (mediaId, index) => {
          const mapping = new ReviewMediaMapping();
          mapping.review_id = createdReview.id;
          mapping.media_id = mediaId;
          mapping.display_order = index;
          mapping.created_at = new Date();
          return mapping;
        },
      );

      await this.reviewMediaMappingRepository.createBatch(mediaMappings);
    }

    // Invalidate cache after successful transaction
    await this.invalidateProductCache(createdReview.product_id);

    // Send notification to seller (REVIEW_RECEIVED)
    try {
      if (sellerId) {
        // Get seller user ID from seller repository
        const seller = await this.sellerRepository.findOne({
          where: { id: sellerId },
          select: ['user_id', 'store_name'],
        });

        if (seller && seller.user_id) {
          const ratingStars = '⭐'.repeat(Math.round(createDto.rating));
          const itemName =
            salesOrderItem.variant?.product?.product_name ||
            salesOrderItem.service?.title ||
            'Item';
          const reviewType =
            reviewableType === ReviewableTypeEnum.SERVICE
              ? 'Service'
              : 'Product';

          await this.notificationsService.notify(
            seller.user_id,
            NotificationTypeEnum.REVIEW_RECEIVED,
            `New ${reviewType} Review!`,
            `You received a ${createDto.rating}-star review ${ratingStars} for ${itemName}`,
            'order', // Use order type for deep linking
            salesOrder.id, // Link to order details
            `/orders/${salesOrder.id}`,
          );
        }
      }
    } catch (error) {
      console.error('Failed to send product review notification:', error);
    }

    // Note: Product reviews don't update service ratings
    // Only service reviews (from bookings) update service ratings

    return createdReview;
  }

  async findAll(queryDto: QueryReviewDto): Promise<FindAllReview> {
    return this.repository.findAll(queryDto);
  }

  async findOne(id: number): Promise<Review> {
    const review = await this.repository.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  async update(
    id: number,
    updateDto: UpdateReviewDto,
    currentUser: User,
  ): Promise<Review> {
    const existingReview = await this.repository.findById(id);
    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    // Users can only update their own reviews
    if (existingReview.user_id !== currentUser.id) {
      throw new BadRequestException('You can only update your own reviews');
    }

    const review = new Review();
    review.id = id;

    // Only allow users to update these specific fields
    review.rating = updateDto.rating ?? existingReview.rating;
    review.comment = updateDto.comment ?? existingReview.comment;
    review.is_anonymous = updateDto.is_anonymous ?? existingReview.is_anonymous;

    // Preserve fields that users cannot modify
    review.user_id = existingReview.user_id;
    review.seller_id = existingReview.seller_id;
    review.product_id = existingReview.product_id;
    review.service_id = existingReview.service_id;
    review.booking_id = existingReview.booking_id;
    review.reviewable_type = existingReview.reviewable_type;
    review.source_type = existingReview.source_type;
    review.source_id = existingReview.source_id;
    review.sales_order_item_id = existingReview.sales_order_item_id;
    review.is_verified_purchase = existingReview.is_verified_purchase;
    review.status = existingReview.status;
    review.aspect_ratings =
      updateDto.aspect_ratings ?? existingReview.aspect_ratings;
    review.reply_text = existingReview.reply_text;
    review.reply_at = existingReview.reply_at;
    review.created_by = existingReview.created_by;
    review.updated_by = currentUser;
    review.deleted_by = existingReview.deleted_by;

    const updatedReview = await this.repository.update(id, review);
    await this.invalidateProductCache(existingReview.product_id);

    // Update service ratings if this is a service review and rating changed
    const ratingChanged =
      updateDto.rating !== undefined &&
      updateDto.rating !== existingReview.rating;
    if (
      existingReview.service_id &&
      existingReview.reviewable_type === ReviewableTypeEnum.SERVICE &&
      ratingChanged
    ) {
      await this.updateServiceRating(existingReview.service_id);
    }

    return updatedReview;
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const existingReview = await this.repository.findById(id);
    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    // Users can only delete their own reviews
    if (existingReview.user_id !== currentUser.id) {
      throw new BadRequestException('You can only delete your own reviews');
    }

    // Store service_id before deletion for rating update
    const serviceId = existingReview.service_id;
    const isServiceReview =
      existingReview.reviewable_type === ReviewableTypeEnum.SERVICE;

    // Hard delete by the review owner
    await this.repository.hardDelete(id);

    await this.clearSalesOrderReviewTracking(existingReview, currentUser);
    await this.invalidateProductCache(existingReview.product_id);

    // Update service ratings if this was a service review
    if (serviceId && isServiceReview) {
      await this.updateServiceRating(serviceId);
    }
  }

  async updateReviewStatus(
    id: number,
    status: 'Active' | 'Removed',
    currentUser: User,
  ): Promise<Review> {
    const existingReview = await this.repository.findById(id);
    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    // Only system admins can update review status
    if (!currentUser.system_admin) {
      throw new BadRequestException(
        'Only system administrators can update review status',
      );
    }

    const review = new Review();
    review.id = id;
    review.status = status;
    review.updated_by = currentUser;

    const updatedReview = await this.repository.update(id, review);

    if (status === 'Removed') {
      await this.clearSalesOrderReviewTracking(existingReview, currentUser);
    }
    await this.invalidateProductCache(existingReview.product_id);

    // Update service ratings if status change affects a service review
    if (
      existingReview.service_id &&
      existingReview.reviewable_type === ReviewableTypeEnum.SERVICE
    ) {
      await this.updateServiceRating(existingReview.service_id);
    }

    return updatedReview;
  }

  async replyToReview(
    id: number,
    replyText: string,
    currentUser: User,
  ): Promise<Review> {
    const existingReview = await this.repository.findById(id);
    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    // Only the seller's owner (user) can reply to reviews directed at their store
    const seller = await this.sellerRepository.findOne({
      where: { id: existingReview.seller_id },
      select: ['id', 'user_id', 'store_name'],
    });
    if (!seller || seller.user_id !== currentUser.id) {
      throw new BadRequestException(
        'You can only reply to reviews directed at your store',
      );
    }

    const review = new Review();
    review.id = id;
    review.reply_text = replyText;
    review.reply_at = new Date().toISOString();
    review.updated_by = currentUser;

    // Preserve all other fields
    review.user_id = existingReview.user_id;
    review.seller_id = existingReview.seller_id;
    review.product_id = existingReview.product_id;
    review.service_id = existingReview.service_id;
    review.booking_id = existingReview.booking_id;
    review.reviewable_type = existingReview.reviewable_type;
    review.source_type = existingReview.source_type;
    review.source_id = existingReview.source_id;
    review.sales_order_item_id = existingReview.sales_order_item_id;
    review.rating = existingReview.rating;
    review.comment = existingReview.comment;
    review.is_anonymous = existingReview.is_anonymous;
    review.is_verified_purchase = existingReview.is_verified_purchase;
    review.status = existingReview.status;
    review.aspect_ratings = existingReview.aspect_ratings;
    review.created_by = existingReview.created_by;
    review.deleted_by = existingReview.deleted_by;

    const updatedReview = await this.repository.update(id, review);

    // Send notification to buyer (REVIEW_RESPONSE_RECEIVED)
    try {
      if (existingReview.user_id) {
        const sellerName = seller.store_name || 'Store Owner';
        const isBookingReview =
          existingReview.source_type === ReviewSourceTypeEnum.BOOKING;
        const linkType = isBookingReview ? 'booking' : 'order';
        const linkPath = isBookingReview
          ? `/bookings/${existingReview.source_id}`
          : `/orders/${existingReview.source_id}`;

        await this.notificationsService.notify(
          existingReview.user_id,
          NotificationTypeEnum.REVIEW_RESPONSE_RECEIVED,
          'Response to your review',
          `${sellerName} responded to your review`,
          linkType,
          existingReview.source_id,
          linkPath,
        );
      }
    } catch (error) {
      console.error('Failed to send review response notification:', error);
    }

    return updatedReview;
  }

  /**
   * Create a review from a booking.
   *
   * @param bookingId - Booking ID
   * @param createDto - Review data
   * @param currentUser - Current user
   * @param files - Optional image files
   * @returns Created review
   */
  async createBookingReview(
    bookingId: number,
    createDto: CreateBookingReviewDto,
    currentUser: User,
    files?: Express.Multer.File[],
  ): Promise<Review> {
    // Check if user already reviewed this booking
    const existingReview = await this.repository.findByUserAndBooking(
      currentUser.id,
      bookingId,
    );

    if (existingReview) {
      throw new ConflictException('You have already reviewed this booking.');
    }

    // Get booking and validate ownership
    const booking = await this.bookingsService.findById(bookingId, currentUser);

    // Validate booking status - only completed bookings can be reviewed
    if (booking.status !== BookingStatusEnum.COMPLETED) {
      throw new BadRequestException(
        'You can only review bookings that have been completed.',
      );
    }

    // Validate booking belongs to user
    if (booking.customer_id !== currentUser.id) {
      throw new BadRequestException('You can only review your own bookings.');
    }

    const review = new Review();
    review.user_id = currentUser.id;
    review.seller_id = booking.seller_id;
    review.service_id = booking.service_id;
    review.booking_id = bookingId;
    review.reviewable_type = ReviewableTypeEnum.SERVICE;
    review.source_type = ReviewSourceTypeEnum.BOOKING;
    review.source_id = bookingId;
    review.rating = createDto.rating;
    review.comment = createDto.comment;
    review.is_anonymous = createDto.is_anonymous ?? false;
    review.is_verified_purchase = true; // Booking reviews are always verified
    review.status = 'Active';
    review.aspect_ratings = createDto.aspect_ratings;
    review.created_by = currentUser;
    review.updated_by = currentUser;

    // Create the review first
    const createdReview = await this.repository.create(review);

    // Handle file uploads if provided
    if (files && files.length > 0) {
      const mediaIds: number[] = [];

      // Upload each file and get media ID
      for (const file of files) {
        const media = await this.mediaService.createMediaFromFile(
          file,
          currentUser.id,
          booking.seller_id,
        );
        mediaIds.push(media.id);
      }

      // Create media mappings
      const mediaMappings: ReviewMediaMapping[] = mediaIds.map(
        (mediaId, index) => {
          const mapping = new ReviewMediaMapping();
          mapping.review_id = createdReview.id;
          mapping.media_id = mediaId;
          mapping.display_order = index;
          mapping.created_at = new Date();
          return mapping;
        },
      );

      await this.reviewMediaMappingRepository.createBatch(mediaMappings);
    }

    // Send notification to seller (REVIEW_RECEIVED)
    try {
      if (booking.seller?.user_id) {
        const ratingStars = '⭐'.repeat(Math.round(createDto.rating));
        await this.notificationsService.notify(
          booking.seller.user_id,
          NotificationTypeEnum.REVIEW_RECEIVED,
          'New Review Received!',
          `You received a ${createDto.rating}-star review ${ratingStars} for booking #${booking.booking_number}`,
          'review',
          createdReview.id,
          `/reviews/${createdReview.id}`,
        );
      }
    } catch (error) {
      console.error('Failed to send review notification:', error);
    }

    // Update service ratings after creating a service review
    if (createdReview.service_id) {
      await this.updateServiceRating(createdReview.service_id);
    }

    return createdReview;
  }

  /**
   * Get reviews for a service.
   *
   * @param serviceId - Service ID
   * @returns List of reviews
   */
  async findByService(serviceId: number): Promise<Review[]> {
    return this.repository.findByService(serviceId);
  }

  /**
   * Get reviews for a seller.
   *
   * @param sellerId - Seller ID
   * @returns List of reviews
   */
  async findBySeller(sellerId: number): Promise<Review[]> {
    return this.repository.findBySeller(sellerId);
  }

  /**
   * Calculate service rating statistics.
   *
   * @param serviceId - Service ID
   * @returns Rating statistics
   */
  async calculateServiceRating(serviceId: number): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    return this.repository.calculateServiceRating(serviceId);
  }

  /**
   * Update service's average_rating and total_reviews fields.
   * This is called automatically after review create/update/delete operations.
   *
   * @param serviceId - Service ID to update
   * @private
   */
  private async updateServiceRating(serviceId: number): Promise<void> {
    try {
      // Calculate current rating statistics
      const ratingStats =
        await this.repository.calculateServiceRating(serviceId);

      // Update the service entity directly with new ratings
      await this.serviceRepository.update(serviceId, {
        average_rating: Math.round(ratingStats.averageRating * 10) / 10, // Round to 1 decimal place
        total_reviews: ratingStats.totalReviews,
      });
    } catch (error) {
      // Log error but don't throw - rating update failure shouldn't break review operations
      console.error(
        `Failed to update service rating for service ${serviceId}:`,
        error,
      );
    }
  }

  private async clearSalesOrderReviewTracking(
    review: Review,
    currentUser: User,
  ): Promise<void> {
    if (
      review.source_type !== ReviewSourceTypeEnum.SALES_ORDER ||
      review.source_id === undefined ||
      review.source_id === null
    ) {
      return;
    }
    try {
      const salesOrder = await this.salesOrderRepository.findById(
        review.source_id,
      );
      if (!salesOrder || salesOrder.review_id !== review.id) {
        return;
      }
      await this.salesOrderRepository.update(review.source_id, {
        review_id: null,
        reviewed_at: null,
        updated_by: currentUser,
      });
    } catch (error) {
      // Log error but don't throw - tracking clear failure shouldn't break review operations
      console.error(
        `Failed to clear review tracking for sales order ${review.source_id}:`,
        error,
      );
    }
  }

  private async invalidateProductCache(
    productId?: number | null,
  ): Promise<void> {
    if (!productId) {
      return;
    }
    await this.productCacheService.invalidate(productId);
    await this.featuredProductsCacheService.invalidateIfFeatured(productId);
  }
}
