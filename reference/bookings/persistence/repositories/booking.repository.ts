import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BaseBookingRepository } from '../base-booking.repository';
import { BookingEntity } from '../entities/booking.entity';
import { Booking } from '@/bookings/domain/booking';
import { BookingMapper } from '../mappers/booking.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { ServiceGalleryEntity } from '@/service-gallery/persistence/entities/service-gallery.entity';

/**
 * Concrete implementation of booking repository.
 *
 * Handles database operations for bookings using TypeORM.
 * Maps between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class BookingRepository extends BaseBookingRepository {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly repository: Repository<BookingEntity>,
  ) {
    super();
  }

  private async attachPrimaryServiceImages(bookings: Booking[]): Promise<void> {
    const serviceIds: number[] = Array.from(
      new Set(
        bookings
          .map((booking) => booking.service?.id)
          .filter((serviceId): serviceId is number =>
            Number.isInteger(serviceId),
          ),
      ),
    );

    if (serviceIds.length === 0) {
      return;
    }

    const galleryRows: ServiceGalleryEntity[] = await this.repository.manager
      .getRepository(ServiceGalleryEntity)
      .createQueryBuilder('gallery')
      .where('gallery.service_id IN (:...serviceIds)', { serviceIds })
      .andWhere('gallery.deleted_at IS NULL')
      .orderBy('gallery.service_id', 'ASC')
      .addOrderBy('gallery.is_primary', 'DESC')
      .addOrderBy('gallery.display_order', 'ASC')
      .addOrderBy('gallery.id', 'ASC')
      .getMany();

    const primaryImageByServiceId: Map<number, string> = new Map();
    for (const galleryRow of galleryRows) {
      if (
        galleryRow?.service_id &&
        galleryRow.image_url &&
        !primaryImageByServiceId.has(galleryRow.service_id)
      ) {
        primaryImageByServiceId.set(
          galleryRow.service_id,
          galleryRow.image_url,
        );
      }
    }

    for (const booking of bookings) {
      const serviceId = booking.service?.id;
      if (!serviceId) {
        continue;
      }

      const primaryImageUrl = primaryImageByServiceId.get(serviceId);
      if (primaryImageUrl && booking.service) {
        booking.service.primary_image_url = primaryImageUrl;
        booking.service.card_image_url = primaryImageUrl;
      }
    }
  }

  /**
   * Create a new booking.
   *
   * @param booking - Booking domain model to create
   * @returns Promise<Booking> - Created booking
   */
  async create(booking: Booking): Promise<Booking> {
    const persistenceEntity = BookingMapper.toPersistence(booking);
    const savedEntity = await this.repository.save(persistenceEntity);

    // Fetch with relations
    return this.findById(savedEntity.id) as Promise<Booking>;
  }

  /**
   * Find bookings with DevExtreme support.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<Booking>>
   */
  async findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Booking>> {
    const { skip = 0, take = 20 } = loadOptions;

    const [entities, totalCount] = await this.repository.findAndCount({
      relations: [
        'checkout_order',
        'seller',
        'service',
        'package',
        'assigned_member',
        'customer',
        'service_address',
        'cancelled_by_user',
        'created_by',
        'updated_by',
        'booking_guests',
        'quotation',
      ],
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return {
      data: entities.map((entity) => BookingMapper.toDomain(entity)),
      totalCount,
    };
  }

  /**
   * Find all bookings with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<Booking>>
   */
  async findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<IPaginatedResult<Booking>> {
    const {
      filterQuery,
      paginationOptions,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Apply filters from filterQuery
    if (filterQuery) {
      if (filterQuery.status === 'active') {
        // Active bookings include: confirmed, provider_assigned, and in_progress
        whereClause.status = In([
          'confirmed',
          'provider_assigned',
          'in_progress',
        ]);
      } else if (filterQuery.status) {
        whereClause.status = filterQuery.status;
      }
      if (filterQuery.seller_id) {
        whereClause.seller_id = filterQuery.seller_id;
      }
      if (filterQuery.customer_id) {
        whereClause.customer_id = filterQuery.customer_id;
      }
      if (filterQuery.scheduled_date) {
        whereClause.scheduled_date = filterQuery.scheduled_date;
      }
    }

    const allowedSortFields = [
      'created_at',
      'updated_at',
      'scheduled_date',
      'total',
      'status',
      'booking_number',
      'id',
    ];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'created_at';
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: [
        'checkout_order',
        'seller',
        'service',
        'package',
        'assigned_member',
        'customer',
        'service_address',
        'cancelled_by_user',
        'created_by',
        'updated_by',
        'booking_guests',
        'quotation',
      ],
      order: { [orderField]: orderDirection },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => BookingMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  async findCountsBySellerId(options: {
    sellerId: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Record<string, number>> {
    const { sellerId, startDate, endDate } = options;

    const qb = this.repository
      .createQueryBuilder('booking')
      .select('booking.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('booking.seller_id = :sellerId', { sellerId })
      .groupBy('booking.status');

    if (startDate) {
      qb.andWhere('booking.scheduled_date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('booking.scheduled_date <= :endDate', { endDate });
    }

    const rows = await qb.getRawMany<{ status: string; count: string }>();
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.status] = parseInt(row.count, 10);
    }
    return result;
  }

  async findCountsByCustomerId(options: {
    customerId: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Record<string, number>> {
    const { customerId, startDate, endDate } = options;

    const qb = this.repository
      .createQueryBuilder('booking')
      .select('booking.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('booking.customer_id = :customerId', { customerId })
      .groupBy('booking.status');

    if (startDate) {
      qb.andWhere('booking.scheduled_date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('booking.scheduled_date <= :endDate', { endDate });
    }

    const rows = await qb.getRawMany<{ status: string; count: string }>();
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.status] = parseInt(row.count, 10);
    }
    return result;
  }

  /**
   * Find a booking by ID.
   *
   * @param id - The booking ID
   * @returns Promise<Booking | null> - Booking if found, null otherwise
   */
  async findById(id: number): Promise<Booking | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: [
        'checkout_order',
        'seller',
        'service',
        'package',
        'assigned_member',
        'customer',
        'service_address',
        'cancelled_by_user',
        'created_by',
        'updated_by',
        'deleted_by',
        'booking_addons',
        'booking_options',
        'booking_guests',
        'booking_milestones',
        'booking_milestones.template',
        'service.gallery',
        'service.category',
        'seller.user',
        'quotation',
        'sales_order',
        'sales_order_item',
      ],
    });

    return entity ? BookingMapper.toDomain(entity) : null;
  }

  /**
   * Find a booking by booking number.
   *
   * @param bookingNumber - The booking number (e.g., 'BK-20241211-1234')
   * @returns Promise<Booking | null> - Booking if found, null otherwise
   */
  async findByBookingNumber(bookingNumber: string): Promise<Booking | null> {
    const entity = await this.repository.findOne({
      where: { booking_number: bookingNumber },
      relations: [
        'checkout_order',
        'seller',
        'service',
        'package',
        'assigned_member',
        'customer',
        'service_address',
        'cancelled_by_user',
        'created_by',
        'updated_by',
        'booking_addons',
        'booking_options',
        'booking_guests',
        'service.gallery',
        'service.category',
        'seller.user',
        'quotation',
      ],
    });

    return entity ? BookingMapper.toDomain(entity) : null;
  }

  async findByBookingGroupNumber(
    bookingGroupNumber: string,
  ): Promise<Booking | null> {
    const entity = await this.repository.findOne({
      where: { booking_group_number: bookingGroupNumber },
      relations: [
        'checkout_order',
        'seller',
        'service',
        'package',
        'assigned_member',
        'customer',
        'service_address',
        'cancelled_by_user',
        'created_by',
        'updated_by',
        'booking_addons',
        'booking_options',
        'booking_guests',
        'service.gallery',
        'service.category',
        'seller.user',
        'quotation',
      ],
      order: {
        scheduled_date: 'ASC',
        scheduled_start_time: 'ASC',
        created_at: 'ASC',
      },
    });

    return entity ? BookingMapper.toDomain(entity) : null;
  }

  async findManyByBookingGroupNumber(
    bookingGroupNumber: string,
  ): Promise<Booking[]> {
    const entities = await this.repository.find({
      where: { booking_group_number: bookingGroupNumber },
      relations: [
        'checkout_order',
        'seller',
        'service',
        'package',
        'assigned_member',
        'customer',
        'service_address',
        'cancelled_by_user',
        'created_by',
        'updated_by',
        'booking_addons',
        'booking_options',
        'booking_guests',
        'service.gallery',
        'service.category',
        'seller.user',
        'quotation',
      ],
      order: {
        scheduled_date: 'ASC',
        scheduled_start_time: 'ASC',
        created_at: 'ASC',
      },
    });

    return entities.map((entity) => BookingMapper.toDomain(entity));
  }

  /**
   * Lightweight booking lookup for guest payment-page flows.
   *
   * Loads only the 4 relations needed to render the payment page and verify
   * guest email. Intentionally omits heavy relations (gallery, addons,
   * quotation, etc.) to keep the query fast.
   *
   * Searches by booking_group_number first; falls back to booking_number when
   * the group lookup returns no rows.
   *
   * @param groupOrBookingNumber - booking_group_number or booking_number
   * @returns Matching bookings ordered by scheduled_date / scheduled_start_time
   */
  async findManyForGuestPaymentPage(
    groupOrBookingNumber: string,
  ): Promise<Booking[]> {
    const PAYMENT_PAGE_RELATIONS = [
      'seller',
      'seller.user',
      'service',
      'customer',
      'booking_guests',
    ];

    const ORDER = {
      scheduled_date: 'ASC' as const,
      scheduled_start_time: 'ASC' as const,
      created_at: 'ASC' as const,
    };

    // Try group number first (covers multi-slot bookings)
    let entities = await this.repository.find({
      where: { booking_group_number: groupOrBookingNumber },
      relations: PAYMENT_PAGE_RELATIONS,
      order: ORDER,
    });

    // Fall back to booking_number (single booking, no group)
    if (entities.length === 0) {
      entities = await this.repository.find({
        where: { booking_number: groupOrBookingNumber },
        relations: PAYMENT_PAGE_RELATIONS,
        order: ORDER,
      });
    }

    return entities.map((entity) => BookingMapper.toDomain(entity));
  }

  /**
   * Find bookings by checkout order ID.
   *
   * @param checkoutOrderId - The checkout order ID
   * @returns Promise<Booking[]> - Array of bookings for the checkout order
   */
  async findByCheckoutOrderId(checkoutOrderId: number): Promise<Booking[]> {
    const entities = await this.repository.find({
      where: { checkout_order_id: checkoutOrderId },
      relations: [
        'checkout_order',
        'seller',
        'service',
        'package',
        'assigned_member',
        'customer',
        'service_address',
        'created_by',
        'updated_by',
        'booking_guests',
        'quotation',
      ],
      order: { created_at: 'DESC' },
    });

    return entities.map((entity) => BookingMapper.toDomain(entity));
  }

  /**
   * Find bookings by customer ID.
   *
   * @param customerId - The customer's ID
   * @param paginationOptions - Pagination options
   * @returns Promise<IPaginatedResult<Booking>> - Paginated bookings
   */
  async findByCustomerId(
    customerId: number,
    paginationOptions: IPaginationOptions,
    filterOptions?: {
      status?: string;
      statuses?: string[];
      scheduled_date?: string;
      start_date?: string;
      end_date?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<IPaginatedResult<Booking>> {
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const sortField = filterOptions?.sortBy ?? null;
    const sortOrder = (filterOptions?.sortOrder?.toUpperCase() ?? 'ASC') as
      | 'ASC'
      | 'DESC';

    const qb = this.repository
      .createQueryBuilder('booking')
      .where('booking.customer_id = :customerId', { customerId });

    // Date filters
    if (filterOptions?.scheduled_date) {
      qb.andWhere('booking.scheduled_date = :scheduledDate', {
        scheduledDate: filterOptions.scheduled_date,
      });
    } else {
      if (filterOptions?.start_date) {
        qb.andWhere('booking.scheduled_date >= :startDate', {
          startDate: filterOptions.start_date,
        });
      }
      if (filterOptions?.end_date) {
        qb.andWhere('booking.scheduled_date <= :endDate', {
          endDate: filterOptions.end_date,
        });
      }
    }

    // Status filters — cast to text so PG enum comparison works reliably
    if (filterOptions?.statuses && filterOptions.statuses.length > 0) {
      qb.andWhere('booking.status::text IN (:...statuses)', {
        statuses: filterOptions.statuses,
      });
    } else if (filterOptions?.status === 'active') {
      qb.andWhere('booking.status::text IN (:...statuses)', {
        statuses: ['confirmed', 'provider_assigned', 'in_progress'],
      });
    } else if (filterOptions?.status) {
      qb.andWhere('booking.status::text = :status', {
        status: filterOptions.status,
      });
    }

    qb.leftJoinAndSelect('booking.seller', 'seller')
      .leftJoinAndSelect('seller.user', 'seller_user')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('service.category', 'service_category')
      .orderBy(
        sortField ? `booking.${sortField}` : 'booking.scheduled_date',
        sortField ? sortOrder : 'ASC',
      )
      .addOrderBy('booking.scheduled_start_time', 'ASC')
      .skip(skip)
      .take(limit);

    const [entities, total] = await qb.getManyAndCount();
    const bookings = entities.map((entity) => BookingMapper.toDomain(entity));
    await this.attachPrimaryServiceImages(bookings);

    return {
      data: bookings,
      totalResults: total,
    };
  }

  /**
   * Find bookings by seller ID.
   *
   * @param sellerId - The seller's ID
   * @param paginationOptions - Pagination options
   * @param filterOptions - Optional filter options (status, etc.)
   * @returns Promise<IPaginatedResult<Booking>> - Paginated bookings
   */
  async findBySellerId(
    sellerId: number,
    paginationOptions: IPaginationOptions,
    filterOptions?: {
      status?: string;
      statuses?: string[];
      scheduled_date?: string;
      start_date?: string;
      end_date?: string;
      awaiting_quotation?: boolean;
    },
  ): Promise<IPaginatedResult<Booking>> {
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    // Use query builder when we have date range filters for better control
    const hasDateFilters =
      filterOptions?.scheduled_date ||
      filterOptions?.start_date ||
      filterOptions?.end_date;

    if (hasDateFilters) {
      const queryBuilder = this.repository
        .createQueryBuilder('booking')
        .where('booking.seller_id = :sellerId', { sellerId });

      // Handle exact date match
      if (filterOptions?.scheduled_date) {
        queryBuilder.andWhere('booking.scheduled_date = :scheduledDate', {
          scheduledDate: filterOptions.scheduled_date,
        });
      } else {
        // Handle date range filters
        if (filterOptions?.start_date) {
          queryBuilder.andWhere('booking.scheduled_date >= :startDate', {
            startDate: filterOptions.start_date,
          });
        }
        if (filterOptions?.end_date) {
          queryBuilder.andWhere('booking.scheduled_date <= :endDate', {
            endDate: filterOptions.end_date,
          });
        }
      }

      // Apply status filter if provided (supports statuses array)
      if (filterOptions?.statuses && filterOptions.statuses.length > 0) {
        queryBuilder.andWhere('booking.status::text IN (:...statuses)', {
          statuses: filterOptions.statuses.map((s) => String(s).toLowerCase()),
        });
      } else if (filterOptions?.status === 'active') {
        queryBuilder.andWhere('booking.status::text IN (:...statuses)', {
          statuses: ['confirmed', 'provider_assigned', 'in_progress'],
        });
      } else if (filterOptions?.status) {
        queryBuilder.andWhere('booking.status::text = :status', {
          status: String(filterOptions.status).toLowerCase(),
        });
      }

      // Apply relations and pagination (service.gallery + service.category for primary_image_url)
      queryBuilder
        .leftJoinAndSelect('booking.checkout_order', 'checkout_order')
        .leftJoinAndSelect('booking.seller', 'seller')
        .leftJoinAndSelect('booking.service', 'service')
        .leftJoinAndSelect('service.gallery', 'service_gallery')
        .leftJoinAndSelect('service.category', 'service_category')
        .leftJoinAndSelect('booking.package', 'package')
        .leftJoinAndSelect('booking.assigned_member', 'assigned_member')
        .leftJoinAndSelect('booking.customer', 'customer')
        .leftJoinAndSelect('booking.service_address', 'service_address')
        .leftJoinAndSelect('booking.created_by', 'created_by')
        .leftJoinAndSelect('booking.updated_by', 'updated_by')
        .leftJoinAndSelect('booking.quotation', 'quotation')
        .orderBy('booking.created_at', 'DESC')
        .skip(skip)
        .take(limit);

      const [entities, total] = await queryBuilder.getManyAndCount();

      return {
        data: entities.map((entity) => BookingMapper.toDomain(entity)),
        totalResults: total,
      };
    }

    // Simple case: no date filters — use query builder so status works reliably with PG enum
    const qb = this.repository
      .createQueryBuilder('booking')
      .where('booking.seller_id = :sellerId', { sellerId });

    if (filterOptions?.statuses && filterOptions.statuses.length > 0) {
      qb.andWhere('booking.status::text IN (:...statuses)', {
        statuses: filterOptions.statuses.map((s) => String(s).toLowerCase()),
      });
    } else if (filterOptions?.status === 'active') {
      qb.andWhere('booking.status::text IN (:...statuses)', {
        statuses: ['confirmed', 'provider_assigned', 'in_progress'],
      });
    } else if (filterOptions?.status) {
      qb.andWhere('booking.status::text = :status', {
        status: String(filterOptions.status).toLowerCase(),
      });
    }

    qb.leftJoinAndSelect('booking.checkout_order', 'checkout_order')
      .leftJoinAndSelect('booking.seller', 'seller')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('service.gallery', 'service_gallery')
      .leftJoinAndSelect('service.category', 'service_category')
      .leftJoinAndSelect('booking.package', 'package')
      .leftJoinAndSelect('booking.assigned_member', 'assigned_member')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.service_address', 'service_address')
      .leftJoinAndSelect('booking.created_by', 'created_by')
      .leftJoinAndSelect('booking.updated_by', 'updated_by')
      .leftJoinAndSelect('booking.quotation', 'quotation')
      .orderBy('booking.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map((entity) => BookingMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  /**
   * Find bookings by assigned member ID.
   *
   * @param memberId - The assigned member's ID
   * @param paginationOptions - Pagination options
   * @returns Promise<IPaginatedResult<Booking>> - Paginated bookings
   */
  async findByAssignedMemberId(
    memberId: number,
    paginationOptions: IPaginationOptions,
  ): Promise<IPaginatedResult<Booking>> {
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repository.findAndCount({
      where: { assigned_member_id: memberId },
      relations: [
        'checkout_order',
        'seller',
        'service',
        'package',
        'assigned_member',
        'customer',
        'service_address',
        'created_by',
        'updated_by',
        'booking_guests',
        'quotation',
      ],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => BookingMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  /**
   * Update a booking.
   *
   * @param id - The booking ID
   * @param payload - Partial booking data to update
   * @returns Promise<Booking> - Updated booking
   */
  async update(id: number, payload: Partial<Booking>): Promise<Booking> {
    const existingEntity = await this.repository.findOne({ where: { id } });

    if (!existingEntity) {
      throw new Error(`Booking with ID ${id} not found`);
    }

    const updateData = BookingMapper.toPersistence({
      ...BookingMapper.toDomain(existingEntity),
      ...payload,
    });

    // Update specific fields
    Object.assign(existingEntity, updateData);
    await this.repository.save(existingEntity);

    return this.findById(id) as Promise<Booking>;
  }

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
  async findOverlappingBookings(options: {
    seller_id: number;
    date: Date | string;
    start_time: string;
    end_time: string;
    exclude_booking_id?: number;
    exclude_customer_id?: number;
    service_id?: number;
    statuses?: string[];
  }): Promise<Booking[]> {
    const {
      seller_id,
      date,
      start_time,
      end_time,
      exclude_booking_id,
      exclude_customer_id,
      service_id,
      statuses,
    } = options;

    // Convert date to Date object if string
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const dateStr = targetDate.toISOString().split('T')[0];

    // Build query - simplified: no member filtering
    const queryBuilder = this.repository
      .createQueryBuilder('booking')
      .where('booking.seller_id = :seller_id', { seller_id })
      .andWhere('booking.scheduled_date = :date', { date: dateStr })
      .andWhere('booking.deleted_at IS NULL');

    if (statuses?.length) {
      queryBuilder.andWhere('booking.status IN (:...statuses)', { statuses });
    } else {
      queryBuilder.andWhere('booking.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelled', 'completed'],
      });
    }

    // Filter by specific service (for venue services with per-service capacity)
    if (service_id) {
      queryBuilder.andWhere('booking.service_id = :service_id', {
        service_id,
      });
    }

    // Exclude specific booking (for updates)
    if (exclude_booking_id) {
      queryBuilder.andWhere('booking.id != :exclude_booking_id', {
        exclude_booking_id,
      });
    }

    // Exclude bookings from a specific customer (e.g., when adding to cart)
    if (exclude_customer_id) {
      queryBuilder.andWhere('booking.customer_id != :exclude_customer_id', {
        exclude_customer_id,
      });
    }

    // Time overlap logic:
    // Two time slots overlap if:
    // - reqStart < existingEnd AND reqEnd > existingStart
    // Use PostgreSQL time casting (::time) instead of MySQL TIME() function
    queryBuilder.andWhere(
      `(
        (booking.scheduled_start_time::time < :end_time::time AND 
         COALESCE(booking.scheduled_end_time, booking.scheduled_start_time)::time > :start_time::time)
      )`,
      { start_time, end_time },
    );

    const entities = await queryBuilder.getMany();

    return entities.map((entity) => BookingMapper.toDomain(entity));
  }

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
  async findBySellerAndMonth(
    sellerId: number,
    year: number,
    month: number,
  ): Promise<Booking[]> {
    // Calculate start and end dates for the month
    // Use UTC to avoid timezone issues when converting to date strings
    const endDate = new Date(Date.UTC(year, month, 0)); // Last day of the month

    // Format dates as YYYY-MM-DD without timezone conversion
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`;

    const entities = await this.repository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.assigned_member', 'assigned_member')
      .where('booking.seller_id = :sellerId', { sellerId })
      .andWhere('booking.scheduled_date >= :startDate', {
        startDate: startDateStr,
      })
      .andWhere('booking.scheduled_date <= :endDate', {
        endDate: endDateStr,
      })
      .andWhere('booking.deleted_at IS NULL')
      .orderBy('booking.scheduled_date', 'ASC')
      .addOrderBy('booking.scheduled_start_time', 'ASC')
      .getMany();

    return entities.map((entity) => BookingMapper.toDomain(entity));
  }

  /**
   * Find bookings by seller and date.
   *
   * Used for day schedule view to get all bookings on a specific date.
   *
   * @param sellerId - Seller ID
   * @param date - Date (YYYY-MM-DD)
   * @returns Promise<Booking[]> - Array of bookings on the date
   */
  async findBySellerAndDate(
    sellerId: number,
    date: string,
  ): Promise<Booking[]> {
    const entities = await this.repository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.package', 'package')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.booking_guests', 'booking_guests')
      .leftJoinAndSelect('booking.assigned_member', 'assigned_member')
      .where('booking.seller_id = :sellerId', { sellerId })
      .andWhere('booking.scheduled_date = :date', { date })
      .andWhere('booking.deleted_at IS NULL')
      .orderBy('booking.scheduled_start_time', 'ASC')
      .getMany();

    return entities.map((entity) => BookingMapper.toDomain(entity));
  }

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
  async countDailyBookingsForService(
    serviceId: number,
    date: string,
  ): Promise<number> {
    const count = await this.repository
      .createQueryBuilder('booking')
      .where('booking.service_id = :serviceId', { serviceId })
      .andWhere('booking.scheduled_date = :date', { date })
      .andWhere('booking.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelled', 'completed'],
      })
      .andWhere('booking.deleted_at IS NULL')
      .getCount();

    return count;
  }

  /**
   * Soft delete a booking.
   *
   * @param id - The booking ID
   * @returns Promise<void>
   */
  async remove(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }
}
