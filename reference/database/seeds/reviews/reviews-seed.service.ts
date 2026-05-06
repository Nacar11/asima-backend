import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { ReviewMediaMappingEntity } from '@/media/persistence/entities/review-media-mapping.entity';
import { MediaEntity } from '@/media/persistence/entities/media.entity';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { ISeedService } from '../seed.interface';
import { ReviewableTypeEnum } from '@/reviews/enums/reviewable-type.enum';
import { ReviewSourceTypeEnum } from '@/reviews/enums/review-source-type.enum';

@Injectable()
export class ReviewsSeedService implements ISeedService {
  constructor(
    @InjectRepository(ReviewEntity)
    private reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    @InjectRepository(SalesOrderItemEntity)
    private salesOrderItemRepository: Repository<SalesOrderItemEntity>,
    @InjectRepository(ProductVariantEntity)
    private productVariantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(ServiceEntity)
    private serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    @InjectRepository(ReviewMediaMappingEntity)
    private reviewMediaMappingRepository: Repository<ReviewMediaMappingEntity>,
    @InjectRepository(MediaEntity)
    private mediaRepository: Repository<MediaEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.reviewRepository.count();
    if (!count) {
      // Get buyers (non-admin users), sellers and actual sales order items
      const buyers = await this.userRepository.find({
        where: { system_admin: false },
        order: { id: 'ASC' },
      });
      const sellers = await this.sellerRepository.find({
        order: { id: 'ASC' },
      });
      const salesOrderItems = await this.salesOrderItemRepository.find({
        relations: ['variant', 'variant.product'],
        where: { item_type: CartItemTypeEnum.PRODUCT }, // Only process product items for reviews
      });

      if (buyers.length === 0) {
        console.warn('⚠️  No buyers found. Skipping reviews seed.');
        return;
      }

      if (sellers.length === 0) {
        console.warn('⚠️  No sellers found. Skipping reviews seed.');
        return;
      }

      if (salesOrderItems.length === 0) {
        console.warn(
          '⚠️  No sales order items found. Ensure sales orders are seeded before reviews.',
        );
        return;
      }

      // Create reviews based on actual sales order items
      const reviews: Partial<ReviewEntity>[] = [];

      // Sample review comments for different ratings
      const reviewComments = {
        5: [
          'Excellent product! Highly recommended.',
          'Amazing quality! Will definitely buy again.',
          'Perfect! Exactly what I was looking for.',
          'Outstanding product and fast delivery!',
          'Five stars! Great quality and service.',
        ],
        4: [
          'Good quality, but delivery was slow.',
          'Nice product, minor issues with packaging.',
          'Happy with purchase, could be better.',
          'Good value for money.',
          'Solid product, meets expectations.',
        ],
        3: [
          'Average product, meets basic expectations.',
          'Okay quality, nothing special.',
          'Decent product for the price.',
          'It works, but could be improved.',
          'Fair product, has some flaws.',
        ],
        2: [
          'Disappointing quality, not worth the price.',
          'Product arrived damaged.',
          'Poor quality, had issues with functionality.',
          'Not satisfied with the purchase.',
          'Below average, would not recommend.',
        ],
        1: [
          'Terrible product! Do not buy!',
          'Complete waste of money.',
          'Product stopped working after one day.',
          'Worst purchase ever made.',
          'Defective item, poor customer service.',
        ],
      };

      // Create at least 10 reviews from different buyers
      let reviewCount = 0;
      const maxReviews = Math.max(10, Math.floor(salesOrderItems.length * 0.7)); // Review 70% of items

      // Create unique (user_id, sales_order_item_id) combinations
      const reviewCombinations: { userId: number; salesOrderItemId: number }[] =
        [];

      // Generate unique combinations by cycling through buyers for each order item
      for (
        let i = 0;
        i < salesOrderItems.length && reviewCombinations.length < maxReviews;
        i++
      ) {
        const orderItem = salesOrderItems[i];
        const buyerIndex = i % buyers.length; // Cycle through buyers evenly
        const buyer = buyers[buyerIndex];

        reviewCombinations.push({
          userId: buyer.id,
          salesOrderItemId: orderItem.id,
        });
      }

      // Shuffle the combinations to make distribution more random
      const shuffledCombinations = reviewCombinations.sort(
        () => 0.5 - Math.random(),
      );

      for (const combination of shuffledCombinations) {
        if (reviewCount >= maxReviews) break;

        // Find the order item for this combination
        const orderItem = salesOrderItems.find(
          (item) => item.id === combination.salesOrderItemId,
        );
        if (!orderItem) continue;

        // Skip service items - only process product items with variants
        if (!orderItem.variant || !orderItem.variant.product) {
          continue;
        }

        // Find the user for this combination
        const buyer = buyers.find((user) => user.id === combination.userId);
        if (!buyer) continue;

        // Random rating ( weighted towards positive reviews)
        let rating: number;
        const rand = Math.random();
        if (rand < 0.4)
          rating = 5; // 40% chance for 5 stars
        else if (rand < 0.7)
          rating = 4; // 30% chance for 4 stars
        else if (rand < 0.85)
          rating = 3; // 15% chance for 3 stars
        else if (rand < 0.95)
          rating = 2; // 10% chance for 2 stars
        else rating = 1; // 5% chance for 1 star

        // Get random comment for this rating
        const commentsForRating =
          reviewComments[rating as keyof typeof reviewComments];
        const comment =
          commentsForRating[
            Math.floor(Math.random() * commentsForRating.length)
          ];

        // Randomly decide if review is anonymous ( 30% chance)
        const isAnonymous = Math.random() < 0.3;

        reviews.push({
          user_id: buyer.id,
          seller_id: sellers[0].id, // Use first seller ( can be made dynamic
          product_id: orderItem.variant.product.id,
          sales_order_item_id: orderItem.id,
          rating,
          comment,
          is_anonymous: isAnonymous,
          is_verified_purchase: true, // All reviews from actual purchases
          status: 'Active' as const,
          created_by: buyer,
          updated_by: buyer,
        });

        reviewCount++;
      }

      // Save all reviews
      for (const reviewData of reviews) {
        const review = this.reviewRepository.create(reviewData);
        await this.reviewRepository.save(review);
      }

      console.log(`✅ ${reviews.length} reviews seeded successfully`);

      // === Add reviews for seller id 5 ===
      await this.seedSeller5Reviews(buyers);

      // === Update all service ratings based on seeded reviews ===
      await this.updateAllServiceRatings();
    } else {
      console.log('⚠️  Reviews already exist, skipping seed');
      // Still try to seed seller 5 reviews if they don't exist
      const buyers = await this.userRepository.find({
        where: { system_admin: false },
        order: { id: 'ASC' },
      });
      await this.seedSeller5Reviews(buyers);

      // Update all service ratings even if reviews already exist
      await this.updateAllServiceRatings();
    }
  }

  /**
   * Public method to seed reviews for seller id 5.
   * Can be called independently after seller 5 and its services/bookings are created.
   */
  async seedSeller5ReviewsIfNeeded(): Promise<void> {
    const buyers = await this.userRepository.find({
      where: { system_admin: false },
      order: { id: 'ASC' },
    });
    await this.seedSeller5Reviews(buyers);

    // Update service ratings after seeding seller 5 reviews
    await this.updateAllServiceRatings();
  }

  private async seedSeller5Reviews(buyers: UserEntity[]): Promise<void> {
    // Check if seller id 5 exists
    const seller5 = await this.sellerRepository.findOne({
      where: { id: 5 },
    });

    if (!seller5) {
      console.log(
        '⚠️  Seller with ID 5 not found. Skipping seller 5 reviews seed.',
      );
      return;
    }

    // Check if reviews for seller 5 already exist
    const existingSeller5Reviews = await this.reviewRepository.count({
      where: { seller_id: 5 },
    });

    if (existingSeller5Reviews > 0) {
      console.log(
        `⚠️  Seller 5 already has ${existingSeller5Reviews} reviews. Skipping seller 5 reviews seed.`,
      );
      return;
    }

    // Get services for seller 5
    const seller5Services = await this.serviceRepository.find({
      where: { seller_id: 5 },
      take: 10,
    });

    // Get bookings for seller 5
    const seller5Bookings = await this.bookingRepository.find({
      where: { seller_id: 5 },
      relations: ['service'],
      take: 10,
    });

    if (seller5Services.length === 0 && seller5Bookings.length === 0) {
      console.log(
        '⚠️  No services or bookings found for seller 5. Skipping seller 5 reviews seed.',
      );
      return;
    }

    if (buyers.length === 0) {
      console.log('⚠️  No buyers found. Skipping seller 5 reviews seed.');
      return;
    }

    // Sample review comments for services
    const serviceReviewComments = {
      5: [
        'Excellent service! The technician was professional and completed the work quickly.',
        'Outstanding quality of work. Highly recommend this service provider!',
        'Perfect service! Everything was done exactly as promised.',
        'Amazing work! The team was punctual and very skilled.',
        'Five stars! Great communication and excellent results.',
      ],
      4: [
        'Good service overall. Minor delays but quality work.',
        'Satisfied with the service. Professional team.',
        'Good value for money. Would use again.',
        'Solid service, met expectations.',
        'Happy with the work, minor room for improvement.',
      ],
      3: [
        'Average service. Work was completed but took longer than expected.',
        'Decent service, nothing exceptional.',
        'Service was okay, met basic requirements.',
        'Fair service, could be improved.',
        'Average quality, acceptable for the price.',
      ],
      2: [
        'Service was below expectations. Some issues with quality.',
        'Not satisfied with the work quality.',
        'Had some problems with the service.',
        'Service could be much better.',
        'Disappointed with the results.',
      ],
      1: [
        'Poor service quality. Would not recommend.',
        'Terrible experience. Work was not done properly.',
        'Very disappointed with the service.',
        'Service was unacceptable.',
        'Worst service experience.',
      ],
    };

    // Sample review comments for seller
    const sellerReviewComments = {
      5: [
        'Excellent seller! Very professional and reliable.',
        'Outstanding service provider. Highly recommended!',
        'Great seller with excellent customer service.',
        'Top-notch seller. Always delivers quality work.',
        'Best seller I have worked with!',
      ],
      4: [
        'Good seller, professional and responsive.',
        'Satisfied with this seller. Good communication.',
        'Reliable seller, would work with again.',
        'Good overall experience with this seller.',
        'Solid seller, meets expectations.',
      ],
      3: [
        'Average seller. Service was acceptable.',
        'Decent seller, nothing special.',
        'Seller was okay, met basic requirements.',
        'Fair seller, could improve communication.',
        'Average experience with this seller.',
      ],
      2: [
        'Seller could be better. Some communication issues.',
        'Not fully satisfied with this seller.',
        'Seller needs improvement in service quality.',
        'Below average experience.',
        'Had some issues with this seller.',
      ],
      1: [
        'Poor seller. Would not recommend.',
        'Terrible experience with this seller.',
        'Very disappointed with the service.',
        'Unacceptable seller service.',
        'Worst seller experience.',
      ],
    };

    const seller5Reviews: Partial<ReviewEntity>[] = [];
    const reviewMediaMappings: Partial<ReviewMediaMappingEntity>[] = [];

    // Get some media files to attach to reviews (if available)
    const availableMedia = await this.mediaRepository.find({
      take: 5,
    });

    // Create service reviews
    for (let i = 0; i < Math.min(seller5Services.length, 8); i++) {
      const service = seller5Services[i];
      const buyer = buyers[i % buyers.length];

      // Find a booking for this service if available
      const relatedBooking = seller5Bookings.find(
        (b) => b.service_id === service.id,
      );

      // Random rating (weighted towards positive)
      let rating: number;
      const rand = Math.random();
      if (rand < 0.5)
        rating = 5; // 50% chance for 5 stars
      else if (rand < 0.75)
        rating = 4; // 25% chance for 4 stars
      else if (rand < 0.9)
        rating = 3; // 15% chance for 3 stars
      else if (rand < 0.95)
        rating = 2; // 5% chance for 2 stars
      else rating = 1; // 5% chance for 1 star

      const commentsForRating =
        serviceReviewComments[rating as keyof typeof serviceReviewComments];
      const comment =
        commentsForRating[Math.floor(Math.random() * commentsForRating.length)];

      // Randomly decide if review is anonymous (20% chance)
      const isAnonymous = Math.random() < 0.2;

      // Aspect ratings for service reviews
      const aspectRatings = {
        punctuality: Math.max(
          1,
          Math.min(5, rating + Math.floor(Math.random() * 2) - 1),
        ),
        quality: Math.max(
          1,
          Math.min(5, rating + Math.floor(Math.random() * 2) - 1),
        ),
        communication: Math.max(
          1,
          Math.min(5, rating + Math.floor(Math.random() * 2) - 1),
        ),
        professionalism: Math.max(
          1,
          Math.min(5, rating + Math.floor(Math.random() * 2) - 1),
        ),
      };

      const review = this.reviewRepository.create({
        user_id: buyer.id,
        seller_id: 5,
        service_id: service.id,
        booking_id: relatedBooking?.id,
        reviewable_type: ReviewableTypeEnum.SERVICE,
        source_type: relatedBooking ? ReviewSourceTypeEnum.BOOKING : undefined,
        source_id: relatedBooking?.id,
        rating,
        comment,
        aspect_ratings: aspectRatings,
        is_anonymous: isAnonymous,
        is_verified_purchase: !!relatedBooking, // Verified if from booking
        status: 'Active' as const,
        created_by: buyer,
        updated_by: buyer,
      });

      const savedReview = await this.reviewRepository.save(review);
      seller5Reviews.push(savedReview);

      // Add media mapping if media is available (30% chance)
      if (availableMedia.length > 0 && Math.random() < 0.3) {
        const media =
          availableMedia[Math.floor(Math.random() * availableMedia.length)];
        const mapping = this.reviewMediaMappingRepository.create({
          review_id: savedReview.id,
          media_id: media.id,
          display_order: 0,
          created_by: buyer.id,
        });
        reviewMediaMappings.push(mapping);
      }
    }

    // Create seller reviews (2-3 reviews for the seller overall)
    for (let i = 0; i < 3; i++) {
      const buyer = buyers[(i + seller5Services.length) % buyers.length];

      // Random rating (weighted towards positive)
      let rating: number;
      const rand = Math.random();
      if (rand < 0.5)
        rating = 5; // 50% chance for 5 stars
      else if (rand < 0.75)
        rating = 4; // 25% chance for 4 stars
      else if (rand < 0.9)
        rating = 3; // 15% chance for 3 stars
      else if (rand < 0.95)
        rating = 2; // 5% chance for 2 stars
      else rating = 1; // 5% chance for 1 star

      const commentsForRating =
        sellerReviewComments[rating as keyof typeof sellerReviewComments];
      const comment =
        commentsForRating[Math.floor(Math.random() * commentsForRating.length)];

      // Randomly decide if review is anonymous (20% chance)
      const isAnonymous = Math.random() < 0.2;

      const review = this.reviewRepository.create({
        user_id: buyer.id,
        seller_id: 5,
        reviewable_type: ReviewableTypeEnum.SELLER,
        rating,
        comment,
        is_anonymous: isAnonymous,
        is_verified_purchase: true,
        status: 'Active' as const,
        created_by: buyer,
        updated_by: buyer,
      });

      const savedReview = await this.reviewRepository.save(review);
      seller5Reviews.push(savedReview);

      // Add media mapping if media is available (20% chance)
      if (availableMedia.length > 0 && Math.random() < 0.2) {
        const media =
          availableMedia[Math.floor(Math.random() * availableMedia.length)];
        const mapping = this.reviewMediaMappingRepository.create({
          review_id: savedReview.id,
          media_id: media.id,
          display_order: 0,
          created_by: buyer.id,
        });
        reviewMediaMappings.push(mapping);
      }
    }

    // Save all review media mappings
    if (reviewMediaMappings.length > 0) {
      for (const mappingData of reviewMediaMappings) {
        const mapping = this.reviewMediaMappingRepository.create(mappingData);
        await this.reviewMediaMappingRepository.save(mapping);
      }
    }

    console.log(
      `✅ ${seller5Reviews.length} reviews seeded for seller ID 5 (${reviewMediaMappings.length} with media)`,
    );
  }

  /**
   * Update all service ratings and total reviews based on actual reviews in the database.
   * This ensures service ratings are accurate after seeding.
   */
  private async updateAllServiceRatings(): Promise<void> {
    try {
      // Get all services that have reviews
      const servicesWithReviews = await this.serviceRepository
        .createQueryBuilder('service')
        .innerJoin('reviews', 'review', 'review.service_id = service.id')
        .where('review.deleted_at IS NULL')
        .andWhere('review.status = :status', { status: 'Active' })
        .select('DISTINCT service.id', 'service_id')
        .getRawMany();

      if (servicesWithReviews.length === 0) {
        console.log(
          '⚠️  No services with reviews found. Skipping service rating updates.',
        );
        return;
      }

      const serviceIds = servicesWithReviews.map((s) => s.service_id);
      let updatedCount = 0;

      // Update each service's ratings
      for (const serviceId of serviceIds) {
        try {
          // Calculate rating statistics for this service
          const ratingStats = await this.reviewRepository
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'averageRating')
            .addSelect('COUNT(review.id)', 'totalReviews')
            .where('review.service_id = :serviceId', { serviceId })
            .andWhere('review.deleted_at IS NULL')
            .andWhere('review.status = :status', { status: 'Active' })
            .getRawOne();

          const averageRating = ratingStats?.averageRating
            ? Math.round(parseFloat(ratingStats.averageRating) * 10) / 10
            : 0;
          const totalReviews = ratingStats?.totalReviews
            ? parseInt(ratingStats.totalReviews)
            : 0;

          // Update the service
          await this.serviceRepository.update(serviceId, {
            average_rating: averageRating,
            total_reviews: totalReviews,
          });

          updatedCount++;
        } catch (error) {
          console.error(
            `Failed to update ratings for service ${serviceId}:`,
            error,
          );
        }
      }

      // Also update services that have no reviews (set to 0)
      const allServices = await this.serviceRepository.find({
        select: ['id'],
      });
      const servicesWithoutReviews = allServices.filter(
        (s) => !serviceIds.includes(s.id),
      );

      if (servicesWithoutReviews.length > 0) {
        const serviceIdsToReset = servicesWithoutReviews.map((s) => s.id);
        await this.serviceRepository.update(serviceIdsToReset, {
          average_rating: 0,
          total_reviews: 0,
        });
        console.log(
          `✅ Reset ratings for ${servicesWithoutReviews.length} services with no reviews`,
        );
      }

      console.log(
        `✅ Updated ratings for ${updatedCount} services based on seeded reviews`,
      );
    } catch (error) {
      console.error('Failed to update service ratings:', error);
    }
  }
}
