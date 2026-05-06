import { BookingMilestone } from '@/booking-milestones/domain/booking-milestone';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Abstract repository interface for BookingMilestone operations.
 *
 * Defines the contract for booking milestone data access operations.
 * Concrete implementations handle the actual database interactions.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseBookingMilestoneRepository {
  /**
   * Create a new booking milestone.
   *
   * @param milestone - Booking milestone domain model to create
   * @returns Promise<BookingMilestone> - Created booking milestone
   */
  abstract create(milestone: BookingMilestone): Promise<BookingMilestone>;

  /**
   * Find booking milestones with DevExtreme support.
   *
   * Supports filtering, sorting, and pagination using DevExtreme
   * load options. Used for admin/reporting interfaces.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<BookingMilestone>>
   */
  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<BookingMilestone>>;

  /**
   * Find all booking milestones with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<BookingMilestone>>
   */
  abstract findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<BookingMilestone>>;

  /**
   * Find a booking milestone by ID.
   *
   * @param id - The booking milestone ID
   * @returns Promise<BookingMilestone | null> - Milestone if found, null otherwise
   */
  abstract findById(id: number): Promise<BookingMilestone | null>;

  /**
   * Find booking milestones by booking ID.
   *
   * @param bookingId - The booking ID
   * @returns Promise<BookingMilestone[]> - Array of milestones for the booking
   */
  abstract findByBookingId(bookingId: number): Promise<BookingMilestone[]>;

  /**
   * Update a booking milestone.
   *
   * @param id - The booking milestone ID
   * @param payload - Partial milestone data to update
   * @returns Promise<BookingMilestone> - Updated booking milestone
   */
  abstract update(
    id: number,
    payload: Partial<BookingMilestone>,
  ): Promise<BookingMilestone>;

  /**
   * Soft delete a booking milestone.
   *
   * @param id - The booking milestone ID
   * @returns Promise<void>
   */
  abstract remove(id: number): Promise<void>;
}
