import { Rating } from '@/ratings/domain/rating';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Base repository interface for Ratings.
 */
export abstract class BaseRatingRepository {
  abstract create(
    data: Omit<Rating, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<Rating>;

  abstract findById(id: number): Promise<Rating | null>;

  abstract findByBookingId(bookingId: number): Promise<Rating | null>;

  abstract findBySellerId(
    sellerId: number,
    options: { page?: number; limit?: number },
  ): Promise<IPaginatedResult<Rating>>;

  abstract findByCustomerId(
    customerId: number,
    options: { page?: number; limit?: number },
  ): Promise<IPaginatedResult<Rating>>;

  abstract findByServiceId(
    serviceId: number,
    options: { page?: number; limit?: number },
  ): Promise<IPaginatedResult<Rating>>;

  abstract update(id: number, data: Partial<Rating>): Promise<Rating | null>;

  abstract softDelete(id: number, deletedBy?: number): Promise<void>;

  abstract getSellerAverageRating(sellerId: number): Promise<number | null>;

  abstract getServiceAverageRating(serviceId: number): Promise<number | null>;
}
