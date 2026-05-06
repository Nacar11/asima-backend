import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { BaseRatingRepository } from '@/ratings/persistence/base-rating.repository';
import { BaseRatingItemRepository } from '@/ratings/persistence/base-rating-item.repository';
import { BaseRatingTemplateRepository } from '@/rating-templates/persistence/base-rating-template.repository';
import { Rating } from '@/ratings/domain/rating';
import { RatingItem } from '@/ratings/domain/rating-item';
import { CreateRatingDto } from '@/ratings/dto/create-rating.dto';
import {
  UpdateRatingDto,
  SellerResponseDto,
} from '@/ratings/dto/update-rating.dto';
import { QueryRatingDto } from '@/ratings/dto/query-rating.dto';
import { User } from '@/users/domain/user';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { BookingsService } from '@/bookings/bookings.service';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';

/**
 * Service for managing customer ratings and reviews.
 */
@Injectable()
export class RatingsService {
  constructor(
    private readonly ratingRepository: BaseRatingRepository,
    private readonly ratingItemRepository: BaseRatingItemRepository,
    private readonly ratingTemplateRepository: BaseRatingTemplateRepository,
    private readonly bookingsService: BookingsService,
  ) {}

  /**
   * Submit a new rating for a completed booking.
   */
  async create(input: CreateRatingDto, user: User): Promise<Rating> {
    // Verify booking exists and get its details
    const booking = await this.bookingsService.findById(input.booking_id, user);
    if (!booking) {
      throw new NotFoundException(
        `Booking with ID ${input.booking_id} not found`,
      );
    }

    // Verify booking is completed
    if (booking.status !== BookingStatusEnum.COMPLETED) {
      throw new BadRequestException('Can only rate completed bookings');
    }

    // Verify user is the customer who made the booking
    if (booking.customer_id !== user.id) {
      throw new ForbiddenException(
        'Only the customer who made the booking can submit a rating',
      );
    }

    // Check if rating already exists for this booking
    const existingRating = await this.ratingRepository.findByBookingId(
      input.booking_id,
    );
    if (existingRating) {
      throw new BadRequestException('A rating already exists for this booking');
    }

    // Validate rating items against active templates
    const activeTemplates = await this.ratingTemplateRepository.findAllActive();
    const requiredTemplates = activeTemplates.filter((t) => t.is_required);

    // Check all required templates are provided
    const providedTemplateIds = input.items.map((i) => i.rating_template_id);
    for (const required of requiredTemplates) {
      if (!providedTemplateIds.includes(required.id)) {
        throw new BadRequestException(
          `Rating for required criteria "${required.name}" is missing`,
        );
      }
    }

    // Validate each item value is within range
    for (const item of input.items) {
      const template = activeTemplates.find(
        (t) => t.id === item.rating_template_id,
      );
      if (!template) {
        throw new BadRequestException(
          `Rating template with ID ${item.rating_template_id} not found or inactive`,
        );
      }
      if (item.value < template.min_value || item.value > template.max_value) {
        throw new BadRequestException(
          `Rating value for "${template.name}" must be between ${template.min_value} and ${template.max_value}`,
        );
      }
    }

    // Calculate overall rating (average of all items, normalized to 0-5 scale)
    let overallRating = 0;
    if (input.items.length > 0) {
      const normalizedValues = input.items.map((item) => {
        const template = activeTemplates.find(
          (t) => t.id === item.rating_template_id,
        )!;
        // Normalize to 0-5 scale
        const range = template.max_value - template.min_value;
        if (range === 0) return 5; // Default to max if range is 0
        return ((item.value - template.min_value) / range) * 5;
      });
      overallRating =
        normalizedValues.reduce((sum, v) => sum + v, 0) /
        normalizedValues.length;
    }

    // Ensure booking has a sales order
    if (!booking.sales_order_id) {
      throw new BadRequestException(
        'Cannot rate a booking without a sales order',
      );
    }

    // Create the rating
    const rating = await this.ratingRepository.create({
      booking_id: input.booking_id,
      sales_order_id: booking.sales_order_id,
      customer_id: user.id,
      seller_id: booking.seller_id,
      service_id: booking.service_id ?? null,
      overall_rating: Math.round(overallRating * 100) / 100, // Round to 2 decimal places
      review_comment: input.review_comment ?? null,
      is_public: input.is_public ?? true,
      has_seller_response: false,
      seller_response: null,
      seller_response_at: null,
      status: 'Active',
      created_by: user.id,
      updated_by: user.id,
      deleted_by: null,
    });

    // Create rating items
    const itemsData = input.items.map((item) => {
      const template = activeTemplates.find(
        (t) => t.id === item.rating_template_id,
      )!;
      return {
        rating_id: rating.id,
        rating_template_id: item.rating_template_id,
        template_code: template.code,
        template_name: template.name,
        value: item.value,
        created_by: user.id,
        updated_by: user.id,
        deleted_by: null,
      };
    });

    await this.ratingItemRepository.createMany(itemsData);

    return rating;
  }

  /**
   * Get a rating by ID with its items.
   */
  async findById(id: number): Promise<Rating & { items: RatingItem[] }> {
    const rating = await this.ratingRepository.findById(id);
    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    const items = await this.ratingItemRepository.findByRatingId(id);

    return {
      ...rating,
      items,
    };
  }

  /**
   * Get rating for a specific booking.
   */
  async findByBookingId(
    bookingId: number,
  ): Promise<(Rating & { items: RatingItem[] }) | null> {
    const rating = await this.ratingRepository.findByBookingId(bookingId);
    if (!rating) {
      return null;
    }

    const items = await this.ratingItemRepository.findByRatingId(rating.id);

    return {
      ...rating,
      items,
    };
  }

  /**
   * List ratings based on query parameters.
   */
  async findAll(query: QueryRatingDto): Promise<IPaginatedResult<Rating>> {
    const options = {
      page: query.page,
      limit: query.limit,
    };

    if (query.seller_id) {
      return this.ratingRepository.findBySellerId(query.seller_id, options);
    }

    if (query.service_id) {
      return this.ratingRepository.findByServiceId(query.service_id, options);
    }

    // Default: return empty if no filter specified
    return {
      data: [],
      totalResults: 0,
    };
  }

  /**
   * Get ratings submitted by a customer.
   */
  async findByCustomer(
    customerId: number,
    query: QueryRatingDto,
  ): Promise<IPaginatedResult<Rating>> {
    return this.ratingRepository.findByCustomerId(customerId, {
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * Update a rating (customer can update comment/visibility).
   */
  async update(
    id: number,
    input: UpdateRatingDto,
    user: User,
  ): Promise<Rating> {
    const rating = await this.ratingRepository.findById(id);
    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    // Verify user is the customer who submitted the rating
    if (rating.customer_id !== user.id) {
      throw new ForbiddenException(
        'Only the customer who submitted the rating can update it',
      );
    }

    const updated = await this.ratingRepository.update(id, {
      review_comment: input.review_comment,
      is_public: input.is_public,
      updated_by: user.id,
    });

    if (!updated) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Seller responds to a rating.
   */
  async addSellerResponse(
    id: number,
    input: SellerResponseDto,
    user: User,
  ): Promise<Rating> {
    const rating = await this.ratingRepository.findById(id);
    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    // Note: In a real implementation, verify user is the seller being rated
    // This would require checking the user's seller_id against the rating's seller_id

    const updated = await this.ratingRepository.update(id, {
      seller_response: input.seller_response,
      seller_response_at: new Date(),
      has_seller_response: true,
      updated_by: user.id,
    });

    if (!updated) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Soft delete a rating.
   */
  async remove(id: number, user: User): Promise<void> {
    const rating = await this.ratingRepository.findById(id);
    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    // Verify user is the customer who submitted the rating
    if (rating.customer_id !== user.id) {
      throw new ForbiddenException(
        'Only the customer who submitted the rating can delete it',
      );
    }

    await this.ratingItemRepository.softDeleteByRatingId(id, user.id);
    await this.ratingRepository.softDelete(id, user.id);
  }

  /**
   * Get average rating for a seller.
   */
  async getSellerAverageRating(sellerId: number): Promise<number | null> {
    return this.ratingRepository.getSellerAverageRating(sellerId);
  }

  /**
   * Get average rating for a service.
   */
  async getServiceAverageRating(serviceId: number): Promise<number | null> {
    return this.ratingRepository.getServiceAverageRating(serviceId);
  }
}
