import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, IsNull, Repository, Brackets } from 'typeorm';
import { BaseServiceRepository } from '@/services/persistence/base-service.repository';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServiceMapper } from '@/services/persistence/mappers/service.mapper';
import { Service } from '@/services/domain/service';
import { QueryServiceDto } from '@/services/dto/query-service.dto';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import {
  ScheduleByCourtBlockedSlotDto,
  ScheduleByCourtBookingDto,
} from '@/services/dto/schedule-by-court-response.dto';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { ScheduleByCourtQueryDto } from '@/services/dto/schedule-by-court-query.dto';
import { StoreUnavailabilityEntity } from '@/store-unavailability/persistence/entities/store-unavailability.entity';

@Injectable()
export class ServiceRepository implements BaseServiceRepository {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly repo: Repository<ServiceEntity>,
  ) {}

  async create(data: Service): Promise<Service> {
    const exists = await this.repo.findOne({ where: { code: data.code } });
    if (exists) throw new ConflictException('Code already exists');

    const saved = await this.repo.save(
      this.repo.create(ServiceMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: [
        'seller',
        'category',
        'currency',
        'milestone_templates',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return ServiceMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryServiceDto,
  ): Promise<{ data: Service[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    // Use query builder if price filtering is needed (for OR conditions) or active_seller_only is true
    if (
      query.min_price !== undefined ||
      query.max_price !== undefined ||
      query.active_seller_only === true
    ) {
      const qb = this.repo
        .createQueryBuilder('service')
        .leftJoinAndSelect('service.seller', 'seller')
        .leftJoinAndSelect(
          'seller.service_location_address',
          'seller_service_location_address',
        )
        .leftJoinAndSelect('service.category', 'category')
        .leftJoinAndSelect('service.currency', 'currency')
        .leftJoinAndSelect(
          'service.gallery',
          'gallery',
          'gallery.deleted_at IS NULL',
        )
        .leftJoinAndSelect('service.milestone_templates', 'milestone_templates')
        .leftJoinAndSelect('service.created_by', 'created_by')
        .leftJoinAndSelect('service.updated_by', 'updated_by')
        .leftJoinAndSelect('service.deleted_by', 'deleted_by')
        .where('service.deleted_at IS NULL');

      // Search filter
      if (query.search) {
        qb.andWhere(
          '(service.title ILIKE :search OR service.code ILIKE :search)',
          { search: `%${query.search}%` },
        );
      }

      // Title filter
      if (query.title) {
        qb.andWhere('service.title ILIKE :title', {
          title: `%${query.title}%`,
        });
      }

      // Other filters
      if (query.seller_id !== undefined) {
        qb.andWhere('service.seller_id = :seller_id', {
          seller_id: query.seller_id,
        });
      }
      if (query.category_id !== undefined) {
        qb.andWhere('service.category_id = :category_id', {
          category_id: query.category_id,
        });
      }
      if (query.pricing_type !== undefined) {
        qb.andWhere('service.pricing_type = :pricing_type', {
          pricing_type: query.pricing_type,
        });
      }
      if (query.service_type !== undefined) {
        qb.andWhere('service.service_type = :service_type', {
          service_type: query.service_type,
        });
      }
      // Default to Active when status not specified (public listing shows only active services)
      const statusFilter = query.status ?? ServiceStatusEnum.ACTIVE;
      qb.andWhere('service.status = :status', { status: statusFilter });
      if (query.is_featured !== undefined) {
        qb.andWhere('service.is_featured = :is_featured', {
          is_featured: query.is_featured,
        });
      }
      if (query.requires_quote !== undefined) {
        qb.andWhere('service.requires_quote = :requires_quote', {
          requires_quote: query.requires_quote,
        });
      }
      if (query.instant_booking !== undefined) {
        qb.andWhere('service.instant_booking = :instant_booking', {
          instant_booking: query.instant_booking,
        });
      }

      if (query.active_seller_only === true) {
        qb.andWhere('seller.status = :sellerStatus', {
          sellerStatus: 'Active',
        });
      }

      // Price filtering: check both base_price and hourly_rate
      // Filter by base_price if it exists, otherwise by hourly_rate
      if (query.min_price !== undefined || query.max_price !== undefined) {
        const priceConditions: string[] = [];
        const priceParams: Record<string, number> = {};

        if (query.min_price !== undefined && query.max_price !== undefined) {
          // Both min and max: price must be between min and max
          priceConditions.push(
            '(service.base_price >= :min_price AND service.base_price <= :max_price AND service.base_price IS NOT NULL)',
          );
          priceConditions.push(
            '(service.hourly_rate >= :min_price AND service.hourly_rate <= :max_price AND service.base_price IS NULL AND service.hourly_rate IS NOT NULL)',
          );
          priceParams.min_price = query.min_price;
          priceParams.max_price = query.max_price;
        } else if (query.min_price !== undefined) {
          // Only min: price must be >= min
          priceConditions.push(
            '(service.base_price >= :min_price AND service.base_price IS NOT NULL)',
          );
          priceConditions.push(
            '(service.hourly_rate >= :min_price AND service.base_price IS NULL AND service.hourly_rate IS NOT NULL)',
          );
          priceParams.min_price = query.min_price;
        } else if (query.max_price !== undefined) {
          // Only max: price must be <= max
          priceConditions.push(
            '(service.base_price <= :max_price AND service.base_price IS NOT NULL)',
          );
          priceConditions.push(
            '(service.hourly_rate <= :max_price AND service.base_price IS NULL AND service.hourly_rate IS NOT NULL)',
          );
          priceParams.max_price = query.max_price;
        }

        if (priceConditions.length > 0) {
          qb.andWhere(
            new Brackets((qb) => {
              qb.where(priceConditions.join(' OR '), priceParams);
            }),
          );
        }
      }

      // Apply sorting
      const sortField = query.sortField || 'created_at';
      const sortBy = query.sortBy || 'DESC';
      qb.orderBy(`service.${sortField}`, sortBy);

      // Secondary sort for consistency
      if (sortField !== 'created_at') {
        qb.addOrderBy('service.created_at', 'DESC');
      }
      if (sortField !== 'title') {
        qb.addOrderBy('service.title', 'ASC');
      }

      qb.skip(skip).take(take);

      const [entities, totalCount] = await qb.getManyAndCount();

      return {
        data: entities.map((e) => ServiceMapper.toDomain(e)),
        totalCount,
      };
    }

    // Use findAndCount for simpler queries without price filtering
    const baseWhere: FindOptionsWhere<ServiceEntity> = {};

    // Apply filters to baseWhere (default status to Active for public listing)
    if (query.seller_id !== undefined) baseWhere.seller_id = query.seller_id;
    if (query.category_id !== undefined)
      baseWhere.category_id = query.category_id;
    if (query.pricing_type !== undefined)
      baseWhere.pricing_type = query.pricing_type;
    if (query.service_type !== undefined)
      baseWhere.service_type = query.service_type;
    baseWhere.status = query.status ?? ServiceStatusEnum.ACTIVE;
    if (query.is_featured !== undefined)
      baseWhere.is_featured = query.is_featured;
    if (query.requires_quote !== undefined)
      baseWhere.requires_quote = query.requires_quote;
    if (query.instant_booking !== undefined)
      baseWhere.instant_booking = query.instant_booking;

    const where: FindOptionsWhere<ServiceEntity>[] = [];

    // Title filter (applied to all conditions)
    if (query.title) {
      baseWhere.title = ILike(`%${query.title}%`);
    }

    // Search filter (creates OR conditions for title OR code)
    if (query.search) {
      const like = ILike(`%${query.search}%`);
      where.push({ ...baseWhere, title: like });
      where.push({ ...baseWhere, code: like });
    } else {
      // No search, use baseWhere (which may include title filter)
      where.push(baseWhere);
    }

    if (where.length === 0) where.push({});

    // Build order clause
    const sortField = query.sortField || 'created_at';
    const sortBy = query.sortBy || 'DESC';
    const order: Record<string, 'ASC' | 'DESC'> = {};

    // Primary sort field
    order[sortField] = sortBy;

    // Secondary sorts for consistency
    if (sortField !== 'created_at') {
      order['created_at'] = 'DESC';
    }
    if (sortField !== 'title') {
      order['title'] = 'ASC';
    }

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order,
      relations: [
        'seller',
        'seller.service_location_address',
        'category',
        'currency',
        'gallery',
        'milestone_templates',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });

    return {
      data: entities.map((e) => ServiceMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<Service | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: [
        'seller',
        'seller.service_location_address',
        'category',
        'currency',
        'milestone_templates',
        'option_groups',
        'option_groups.option_values',
        'addons',
        'addons.inclusions',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return entity ? ServiceMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Service | null> {
    const entity = await this.repo.findOne({
      where: { code },
      relations: [
        'seller',
        'category',
        'currency',
        'milestone_templates',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return entity ? ServiceMapper.toDomain(entity) : null;
  }

  async findFeatured(
    limit = 10,
    sellerId?: number,
    excludeSellerSlugs?: string[],
  ): Promise<{ data: Service[]; totalCount: number }> {
    if (excludeSellerSlugs?.length) {
      const qb = this.repo
        .createQueryBuilder('s')
        .where('s.is_featured = :isFeatured', { isFeatured: true })
        .andWhere('s.deleted_at IS NULL')
        .leftJoinAndSelect('s.seller', 'seller')
        .andWhere('seller.slug NOT IN (:...excludeSellerSlugs)', {
          excludeSellerSlugs: excludeSellerSlugs.map((s) => s.toLowerCase()),
        })
        .leftJoinAndSelect('s.category', 'category')
        .leftJoinAndSelect('s.currency', 'currency')
        .leftJoinAndSelect('s.gallery', 'gallery', 'gallery.deleted_at IS NULL')
        .orderBy('s.updated_at', 'DESC')
        .take(limit);

      if (sellerId) {
        qb.andWhere('s.seller_id = :sellerId', { sellerId });
      }

      const [entities, totalCount] = await qb.getManyAndCount();
      return { data: entities.map(ServiceMapper.toDomain), totalCount };
    }

    const where: FindOptionsWhere<ServiceEntity> = {
      is_featured: true,
      deleted_at: IsNull(),
      ...(sellerId ? { seller_id: sellerId } : {}),
    };
    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      order: { updated_at: 'DESC' },
      take: limit,
      relations: ['seller', 'category', 'currency', 'gallery'],
    });

    return { data: entities.map(ServiceMapper.toDomain), totalCount };
  }

  async findPopular(
    limit = 10,
    sellerId?: number,
  ): Promise<{ data: Service[]; totalCount: number }> {
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.deleted_at IS NULL')
      .andWhere(
        sellerId ? 's.seller_id = :sellerId' : '1=1',
        sellerId ? { sellerId } : {},
      )
      .orderBy('s.total_bookings', 'DESC')
      .addOrderBy('s.view_count', 'DESC')
      .limit(limit);

    const [entities, totalCount] = await Promise.all([
      qb
        .leftJoinAndSelect('s.seller', 'seller')
        .leftJoinAndSelect('s.category', 'category')
        .leftJoinAndSelect('s.currency', 'currency')
        .leftJoinAndSelect('s.gallery', 'gallery', 'gallery.deleted_at IS NULL')
        .getMany(),
      qb.getCount(),
    ]);

    return { data: entities.map(ServiceMapper.toDomain), totalCount };
  }

  async findNearby(params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    limit?: number;
    sellerId?: number;
  }): Promise<{ data: Service[]; totalCount: number }> {
    const { latitude, longitude, radiusKm = 25, limit = 20, sellerId } = params;

    // Haversine distance calculation using service_areas.center_latitude/longitude
    const qb = this.repo
      .createQueryBuilder('s')
      .innerJoin(
        'service_areas',
        'sa',
        'sa.service_id = s.id AND sa.deleted_at IS NULL',
      )
      .addSelect(
        `(6371 * acos( cos(radians(:lat)) * cos(radians(sa.center_latitude)) * cos(radians(sa.center_longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(sa.center_latitude)) ))`,
        'distance_km',
      )
      .where('s.deleted_at IS NULL')
      .andWhere(
        sellerId ? 's.seller_id = :sellerId' : '1=1',
        sellerId ? { sellerId } : {},
      )
      .andWhere('sa.center_latitude IS NOT NULL')
      .andWhere('sa.center_longitude IS NOT NULL')
      .andWhere(
        `(6371 * acos( cos(radians(:lat)) * cos(radians(sa.center_latitude)) * cos(radians(sa.center_longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(sa.center_latitude)) )) <= :radiusKm`,
        { radiusKm },
      )
      .orderBy('distance_km', 'ASC')
      .addOrderBy('s.total_bookings', 'DESC')
      .limit(limit)
      .setParameters({ lat: latitude, lng: longitude });

    const [entities, totalCount] = await Promise.all([
      qb
        .leftJoinAndSelect('s.seller', 'seller')
        .leftJoinAndSelect('s.category', 'category')
        .leftJoinAndSelect('s.currency', 'currency')
        .leftJoinAndSelect('s.gallery', 'gallery', 'gallery.deleted_at IS NULL')
        .getMany(),
      qb.getCount(),
    ]);

    return { data: entities.map(ServiceMapper.toDomain), totalCount };
  }

  async search(params: {
    q?: string;
    sellerId?: number;
    categoryIds?: number[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    pricingType?: string;
    isFeatured?: boolean;
    instantBooking?: boolean;
    isRemoteAvailable?: boolean;
    serviceLocationType?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    province?: string;
  }): Promise<{ data: Service[]; totalCount: number }> {
    const {
      q,
      sellerId,
      categoryIds,
      minPrice,
      maxPrice,
      minRating,
      pricingType,
      isFeatured,
      instantBooking,
      isRemoteAvailable,
      serviceLocationType,
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      latitude,
      longitude,
      city,
      province,
    } = params;

    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.deleted_at IS NULL')
      // Only return Active services in search results
      .andWhere('s.status = :activeStatus', {
        activeStatus: ServiceStatusEnum.ACTIVE,
      })
      .leftJoinAndSelect('s.seller', 'seller')
      .leftJoinAndSelect('s.category', 'category')
      .leftJoinAndSelect('s.currency', 'currency')
      .leftJoinAndSelect('s.gallery', 'gallery', 'gallery.deleted_at IS NULL');

    if (q) {
      qb.andWhere('(LOWER(s.title) LIKE :q OR LOWER(s.code) LIKE :q)', {
        q: `%${q.toLowerCase()}%`,
      });
    }
    if (sellerId !== undefined) {
      qb.andWhere('s.seller_id = :sellerId', { sellerId });
    }
    if (categoryIds?.length)
      qb.andWhere('s.category_id IN (:...cids)', { cids: categoryIds });
    if (minPrice !== undefined)
      qb.andWhere('(s.base_price IS NULL OR s.base_price >= :minPrice)', {
        minPrice,
      });
    if (maxPrice !== undefined)
      qb.andWhere('(s.base_price IS NULL OR s.base_price <= :maxPrice)', {
        maxPrice,
      });
    if (minRating !== undefined)
      qb.andWhere('s.average_rating >= :minRating', { minRating });
    if (pricingType)
      qb.andWhere('s.pricing_type = :pricingType', { pricingType });
    if (isFeatured !== undefined)
      qb.andWhere('s.is_featured = :isFeatured', { isFeatured });
    if (instantBooking !== undefined)
      qb.andWhere('s.instant_booking = :instantBooking', { instantBooking });
    if (isRemoteAvailable !== undefined)
      qb.andWhere('s.is_remote_available = :isRemoteAvailable', {
        isRemoteAvailable,
      });
    if (serviceLocationType)
      qb.andWhere('s.service_location_type = :serviceLocationType', {
        serviceLocationType,
      });

    // Location-based filtering: filter by services that cover the customer's location
    // A service is shown if:
    // 1. It is remote or walk-in (not location-dependent on customer), OR
    // 2. It has at least one ACTIVE service area that covers the customer's location
    if (city || province || (latitude && longitude)) {
      qb.andWhere(
        `(
          s.service_location_type IN ('remote', 'walk_in')
          OR EXISTS (
            SELECT 1 FROM service_areas sa
            WHERE sa.service_id = s.id
            AND sa.deleted_at IS NULL
            AND sa.status = 'Active'
            AND (
              ${city ? `LOWER(sa.city) = LOWER(:city)` : 'FALSE'}
              ${province ? `OR LOWER(sa.province) = LOWER(:province)` : ''}
              ${
                latitude && longitude
                  ? `OR (
                sa.center_latitude IS NOT NULL
                AND sa.center_longitude IS NOT NULL
                AND (6371 * acos(
                  cos(radians(:lat)) * cos(radians(sa.center_latitude)) *
                  cos(radians(sa.center_longitude) - radians(:lng)) +
                  sin(radians(:lat)) * sin(radians(sa.center_latitude))
                )) <= COALESCE(sa.radius_km, s.service_radius_km, 10)
              )`
                  : ''
              }
            )
          )
        )`,
        {
          ...(city ? { city } : {}),
          ...(province ? { province } : {}),
          ...(latitude && longitude ? { lat: latitude, lng: longitude } : {}),
        },
      );
    }

    switch (sortBy) {
      case 'price_asc':
        qb.orderBy('s.base_price', 'ASC', 'NULLS LAST');
        break;
      case 'price_desc':
        qb.orderBy('s.base_price', 'DESC', 'NULLS LAST');
        break;
      case 'rating':
        qb.orderBy('s.average_rating', 'DESC').addOrderBy(
          's.total_reviews',
          'DESC',
        );
        break;
      case 'recent':
        qb.orderBy('s.created_at', 'DESC');
        break;
      default:
        qb.orderBy('s.total_bookings', 'DESC').addOrderBy(
          's.view_count',
          'DESC',
        );
        break;
    }

    const totalCount = await qb.getCount();
    const entities = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data: entities.map(ServiceMapper.toDomain), totalCount };
  }

  async suggestions(q?: string, limit = 10): Promise<string[]> {
    if (!q) return [];
    const rows = await this.repo
      .createQueryBuilder('s')
      .select(['s.title'])
      .where('s.deleted_at IS NULL')
      .andWhere('LOWER(s.title) LIKE :q', { q: `%${q.toLowerCase()}%` })
      .orderBy('s.total_bookings', 'DESC')
      .addOrderBy('s.view_count', 'DESC')
      .limit(limit)
      .getMany();
    return rows.map((r) => r.title);
  }

  async findScheduleByCourt(
    query: ScheduleByCourtQueryDto,
  ): Promise<ScheduleByCourtBookingDto[]> {
    type RawScheduleRow = {
      service_id: number;
      service_title: string;
      booking_id: number | null;
      booking_number: string | null;
      booking_group_number: string | null;
      scheduled_date: string | Date | null;
      scheduled_start_time: string | null;
      scheduled_end_time: string | null;
      booking_status: string | null;
      sales_order_payment_status: string | null;
      open_play_event_id: number | null;
      guest_names_summary: string | null;
      booking_customer_id: number | null;
      customer_id: number | null;
      customer_first_name: string | null;
      customer_last_name: string | null;
      customer_email: string | null;
      customer_phone: string | null;
    };

    const qb = this.repo.manager
      .createQueryBuilder(BookingEntity, 'booking')
      .innerJoin(
        ServiceEntity,
        'service',
        'service.id = booking.service_id AND service.deleted_at IS NULL',
      )
      .leftJoin(
        SalesOrderEntity,
        'sales_order',
        'sales_order.id = booking.sales_order_id AND sales_order.deleted_at IS NULL',
      )
      .leftJoin(
        UserEntity,
        'customer',
        'customer.id = booking.customer_id AND customer.deleted_at IS NULL',
      )
      .where('booking.deleted_at IS NULL')
      .andWhere('service.service_type = :serviceType', {
        serviceType: ServiceTypeEnum.VENUE,
      })
      .andWhere(
        query.service_id ? 'service.id = :serviceId' : '1=1',
        query.service_id ? { serviceId: query.service_id } : {},
      )
      .andWhere(
        query.date ? 'DATE(booking.scheduled_date) = :scheduledDate' : '1=1',
        query.date ? { scheduledDate: query.date } : {},
      )
      .select([
        'service.id AS service_id',
        'service.title AS service_title',
        'booking.id AS booking_id',
        'booking.booking_number AS booking_number',
        'booking.booking_group_number AS booking_group_number',
        'booking.scheduled_date AS scheduled_date',
        'booking.scheduled_start_time AS scheduled_start_time',
        'booking.scheduled_end_time AS scheduled_end_time',
        'booking.status AS booking_status',
        'sales_order.payment_status AS sales_order_payment_status',
        'booking.open_play_event_id AS open_play_event_id',
        `(SELECT STRING_AGG(TRIM(CONCAT(COALESCE(bg_summary.first_name, ''), ' ', COALESCE(bg_summary.last_name, ''))), ', ' ORDER BY bg_summary.sort_order) FROM booking_guests bg_summary WHERE bg_summary.booking_id = booking.id) AS guest_names_summary`,
        'booking.customer_id AS booking_customer_id',
        'customer.id AS customer_id',
        'customer.first_name AS customer_first_name',
        'customer.last_name AS customer_last_name',
        'customer.email AS customer_email',
        'customer.phone AS customer_phone',
      ])
      .orderBy('service.title', 'ASC')
      .addOrderBy('booking.scheduled_date', 'ASC')
      .addOrderBy('booking.scheduled_start_time', 'ASC');

    const rows = await qb.getRawMany<RawScheduleRow>();

    return rows
      .filter((row) => Boolean(row.booking_id))
      .map((row) => {
        let normalizedDate = '';
        if (row.scheduled_date instanceof Date) {
          const year = row.scheduled_date.getFullYear();
          const month = String(row.scheduled_date.getMonth() + 1).padStart(
            2,
            '0',
          );
          const day = String(row.scheduled_date.getDate()).padStart(2, '0');
          normalizedDate = `${year}-${month}-${day}`;
        } else if (typeof row.scheduled_date === 'string') {
          normalizedDate = row.scheduled_date.includes('T')
            ? row.scheduled_date.slice(0, 10)
            : row.scheduled_date;
        }

        return {
          id: row.booking_id!,
          booking_number: row.booking_number ?? '',
          booking_group_number: row.booking_group_number ?? null,
          scheduled_date: normalizedDate,
          scheduled_start_time: row.scheduled_start_time ?? '',
          scheduled_end_time: row.scheduled_end_time,
          status: row.booking_status ?? '',
          sales_order_payment_status: row.sales_order_payment_status,
          open_play_event_id: row.open_play_event_id ?? null,
          guest_names_summary: row.guest_names_summary ?? null,
          service: {
            id: row.service_id,
            title: row.service_title,
          },
          customer: {
            user: {
              id: row.customer_id ?? row.booking_customer_id ?? 0,
              first_name: row.customer_first_name ?? '',
              last_name: row.customer_last_name ?? '',
              email: row.customer_email ?? '',
              phone: row.customer_phone,
            },
          },
        };
      });
  }

  async findScheduleByCourtBlockedSlots(
    query: ScheduleByCourtQueryDto,
  ): Promise<ScheduleByCourtBlockedSlotDto[]> {
    type RawBlockedSlotRow = {
      id: number;
      service_id: number | null;
      unavailable_date: string | Date;
      end_date: string | Date | null;
      start_time: string | null;
      end_time: string | null;
      is_full_day: boolean;
      reason: string | null;
      block_type: string | null;
      open_play_event_id: number | null;
      status: string;
    };

    if (!query.service_id) {
      return [];
    }

    const targetService = await this.repo.manager
      .createQueryBuilder(ServiceEntity, 'target_service')
      .select([
        'target_service.id AS id',
        'target_service.seller_id AS seller_id',
      ])
      .where('target_service.id = :serviceId', { serviceId: query.service_id })
      .andWhere('target_service.deleted_at IS NULL')
      .andWhere('target_service.service_type = :serviceType', {
        serviceType: ServiceTypeEnum.VENUE,
      })
      .getRawOne<{ id: number; seller_id: number }>();

    if (!targetService?.id || !targetService.seller_id) {
      return [];
    }

    const qb = this.repo.manager
      .createQueryBuilder(StoreUnavailabilityEntity, 'block')
      .where('block.deleted_at IS NULL')
      .andWhere('block.status = :status', { status: 'Active' })
      .andWhere('block.seller_id = :sellerId', {
        sellerId: targetService.seller_id,
      })
      .andWhere('(block.service_id IS NULL OR block.service_id = :serviceId)', {
        serviceId: targetService.id,
      });

    if (query.date) {
      qb.andWhere('block.unavailable_date <= :targetDate::date', {
        targetDate: query.date,
      }).andWhere(
        'COALESCE(block.end_date, block.unavailable_date) >= :targetDate::date',
        {
          targetDate: query.date,
        },
      );
    }

    qb.select([
      'block.id AS id',
      'block.service_id AS service_id',
      'block.unavailable_date AS unavailable_date',
      'block.end_date AS end_date',
      'block.start_time AS start_time',
      'block.end_time AS end_time',
      'block.is_full_day AS is_full_day',
      'block.reason AS reason',
      'block.block_type AS block_type',
      'block.open_play_event_id AS open_play_event_id',
      'block.status AS status',
    ])
      .orderBy('block.unavailable_date', 'ASC')
      .addOrderBy('block.start_time', 'ASC')
      .addOrderBy('block.id', 'ASC');

    const rows = await qb.getRawMany<RawBlockedSlotRow>();

    const normalizeDate = (value: string | Date | null): string | null => {
      if (!value) {
        return null;
      }

      if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      return value.includes('T') ? value.slice(0, 10) : value;
    };

    return rows
      .map((row) => ({
        id: row.id,
        service_id: row.service_id,
        unavailable_date: normalizeDate(row.unavailable_date) ?? '',
        end_date: normalizeDate(row.end_date),
        start_time: row.start_time,
        end_time: row.end_time,
        is_full_day: Boolean(row.is_full_day),
        reason: row.reason,
        block_type: row.block_type ?? null,
        open_play_event_id: row.open_play_event_id ?? null,
        status: row.status,
      }))
      .filter((row) => row.unavailable_date.length > 0);
  }

  async findDetail(id: number): Promise<{
    service: Service | null;
    packages: any[];
    areas: any[];
    gallery: any[];
  }> {
    const service = await this.findById(id);
    if (!service)
      return { service: null, packages: [], areas: [], gallery: [] };

    const packages = await this.repo.manager.query(
      `
      SELECT sp.*
      FROM service_packages sp
      WHERE sp.service_id = $1 AND sp.deleted_at IS NULL
      ORDER BY sp.display_order ASC, sp.id ASC
      `,
      [id],
    );

    const areas = await this.repo.manager.query(
      `
      SELECT sa.*
      FROM service_areas sa
      WHERE sa.service_id = $1 AND sa.deleted_at IS NULL
      ORDER BY sa.id ASC
      `,
      [id],
    );

    const gallery = await this.repo.manager.query(
      `
      SELECT sg.*
      FROM service_gallery sg
      WHERE sg.service_id = $1 AND sg.deleted_at IS NULL
      ORDER BY sg.is_primary DESC, sg.display_order ASC, sg.id ASC
      `,
      [id],
    );

    return { service, packages, areas, gallery };
  }

  async update(id: number, payload: Partial<Service>): Promise<Service> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Service not found');

    if (payload.code && payload.code !== existing.code) {
      const dup = await this.repo.findOne({ where: { code: payload.code } });
      if (dup && dup.id !== id)
        throw new ConflictException('Code already exists');
    }

    const updated = await this.repo.save(
      this.repo.create(
        ServiceMapper.toPersistence({
          ...ServiceMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: [
        'seller',
        'category',
        'currency',
        'milestone_templates',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return ServiceMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Service not found');
    await this.repo.save({
      id,
      deleted_at: new Date(),
      deleted_by: causerId ? ({ id: causerId } as any) : null,
      status: ServiceStatusEnum.INACTIVE,
    });
  }
}
