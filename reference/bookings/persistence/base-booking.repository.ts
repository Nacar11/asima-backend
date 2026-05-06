import { Booking } from '@/bookings/domain/booking';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Abstract repository interface for Booking operations.
 *
 * Defines the contract for booking data access operations.
 * Concrete implementations handle the actual database interactions.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseBookingRepository {
  /**
   * Create a new booking.
   *
   * @param booking - Booking domain model to create
   * @returns Promise<Booking> - Created booking
   */
  abstract create(booking: Booking): Promise<Booking>;

  /**
   * Find bookings with DevExtreme support.
   *
   * Supports filtering, sorting, and pagination using DevExtreme
   * load options. Used for admin/reporting interfaces.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<Booking>>
   */
  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Booking>>;

  /**
   * Find all bookings with standard pagination.
   *
   * @param options - Filter, pagination, and sort options
   * @returns Promise<IPaginatedResult<Booking>>
   */
  abstract findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<IPaginatedResult<Booking>>;

  /**
   * Find a booking by ID.
   *
   * @param id - The booking ID
   * @returns Promise<Booking | null> - Booking if found, null otherwise
   */
  abstract findById(id: number): Promise<Booking | null>;

  /**
   * Find a booking by booking number.
   *
   * @param bookingNumber - The booking number (e.g., 'BK-20241211-1234')
   * @returns Promise<Booking | null> - Booking if found, null otherwise
   */
  abstract findByBookingNumber(bookingNumber: string): Promise<Booking | null>;

  /**
   * Find the first booking in a shared booking group.
   *
   * @param bookingGroupNumber - The shared group reference
   * @returns Promise<Booking | null> - First booking in the group if found
   */
  abstract findByBookingGroupNumber(
    bookingGroupNumber: string,
  ): Promise<Booking | null>;

  /**
   * Find all bookings in a shared booking group.
   *
   * @param bookingGroupNumber - The shared group reference
   * @returns Promise<Booking[]> - Grouped bookings
   */
  abstract findManyByBookingGroupNumber(
    bookingGroupNumber: string,
  ): Promise<Booking[]>;

  /**
   * Lightweight booking lookup for guest payment-page flows.
   *
   * Loads only the relations required to render the payment page and verify
   * guest email: seller, service, customer, booking_guests.
   * This intentionally omits heavy relations (gallery, addons, quotation, etc.)
   * to keep the query fast.
   *
   * Searches by booking_group_number first; falls back to booking_number when
   * the group lookup returns nothing.
   *
   * @param groupOrBookingNumber - booking_group_number or booking_number
   * @returns Matching bookings ordered by scheduled_date / scheduled_start_time
   */
  abstract findManyForGuestPaymentPage(
    groupOrBookingNumber: string,
  ): Promise<Booking[]>;

  /**
   * Find bookings by checkout order ID.
   *
   * @param checkoutOrderId - The checkout order ID
   * @returns Promise<Booking[]> - Array of bookings for the checkout order
   */
  abstract findByCheckoutOrderId(checkoutOrderId: number): Promise<Booking[]>;

  /**
   * Find bookings by customer ID.
   *
   * @param customerId - The customer's ID
   * @param paginationOptions - Pagination options
   * @param filterOptions - Optional filter options (status, etc.)
   * @returns Promise<IPaginatedResult<Booking>> - Paginated bookings
   */
  abstract findByCustomerId(
    customerId: number,
    paginationOptions: IPaginationOptions,
    filterOptions?: { status?: string },
  ): Promise<IPaginatedResult<Booking>>;

  /**
   * Find bookings by seller ID.
   *
   * @param sellerId - The seller's ID
   * @param paginationOptions - Pagination options
   * @param filterOptions - Optional filter options (status, etc.)
   * @returns Promise<IPaginatedResult<Booking>> - Paginated bookings
   */
  abstract findBySellerId(
    sellerId: number,
    paginationOptions: IPaginationOptions,
    filterOptions?: { status?: string; statuses?: string[] },
  ): Promise<IPaginatedResult<Booking>>;

  /**
   * Get counts by status for a seller (optionally filtered by date range).
   */
  abstract findCountsBySellerId(options: {
    sellerId: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Record<string, number>>;

  /**
   * Get counts by status for a customer (optionally filtered by date range).
   */
  abstract findCountsByCustomerId(options: {
    customerId: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Record<string, number>>;

  // DEPRECATED: findByAssignedMemberId - member assignment removed in scheduling simplification

  /**
   * Update a booking.
   *
   * @param id - The booking ID
   * @param payload - Partial booking data to update
   * @returns Promise<Booking> - Updated booking
   */
  abstract update(id: number, payload: Partial<Booking>): Promise<Booking>;

  /**
   * Soft delete a booking.
   *
   * @param id - The booking ID
   * @returns Promise<void>
   */
  abstract remove(id: number): Promise<void>;

  /**
   * Find bookings that overlap with a given time window.
   *
   * Used for availability checking to ensure no double-booking.
   * Only considers active bookings (not cancelled or completed).
   * Simplified: No member-specific checking (seller is the provider).
   *
   * @param options - Overlap search options
   * @returns Promise<Booking[]> - Array of overlapping bookings
   */
  abstract findOverlappingBookings(options: {
    seller_id: number;
    date: Date | string;
    start_time: string;
    end_time: string;
    exclude_booking_id?: number;
    exclude_customer_id?: number;
    service_id?: number;
    statuses?: string[];
  }): Promise<Booking[]>;

  /**
   * Find bookings by seller and month.
   *
   * Used for calendar view to get all bookings in a specific month.
   *
   * @param sellerId - Seller ID
   * @param year - Year (YYYY)
   * @param month - Month (1-12)
   * @returns Promise<Booking[]> - Array of bookings in the month
   */
  abstract findBySellerAndMonth(
    sellerId: number,
    year: number,
    month: number,
  ): Promise<Booking[]>;

  /**
   * Find bookings by seller and date.
   *
   * Used for day schedule view to get all bookings on a specific date.
   *
   * @param sellerId - Seller ID
   * @param date - Date (YYYY-MM-DD)
   * @returns Promise<Booking[]> - Array of bookings on the date
   */
  abstract findBySellerAndDate(
    sellerId: number,
    date: string,
  ): Promise<Booking[]>;

  /**
   * Count daily bookings for a specific service on a given date.
   *
   * Used for max_daily_bookings validation.
   * Only counts active bookings (not cancelled).
   *
   * @param serviceId - Service ID
   * @param date - Date (YYYY-MM-DD)
   * @returns Promise<number> - Count of bookings for the service on that date
   */
  abstract countDailyBookingsForService(
    serviceId: number,
    date: string,
  ): Promise<number>;
}
