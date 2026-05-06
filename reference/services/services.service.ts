import {
  BadRequestException,
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { BaseServiceRepository } from '@/services/persistence/base-service.repository';
import { CreateServiceDto } from '@/services/dto/create-service.dto';
import { UpdateServiceDto } from '@/services/dto/update-service.dto';
import { QueryServiceDto } from '@/services/dto/query-service.dto';
import { Service } from '@/services/domain/service';
import { PricingTypeEnum } from '@/services/enums/pricing-type.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServiceLocationTypeEnum } from '@/services/enums/service-location-type.enum';
import { User } from '@/users/domain/user';
import { SellersService } from '@/sellers/sellers.service';
import { ServiceCategoriesService } from '@/service-categories/service-categories.service';
import { CurrenciesService } from '@/currencies/currencies.service';
import { ModerateServiceDto } from '@/services/dto/moderate-service.dto';
import { BulkModerateServicesDto } from '@/services/dto/bulk-moderate-services.dto';
import { SearchServicesDto } from '@/services/dto/search-services.dto';
import { SellerSchedulesService } from '@/seller-schedules/seller-schedules.service';
import { ServicePackagesService } from '@/service-packages/service-packages.service';
import { ServiceAreasService } from '@/service-areas/service-areas.service';
import { ServiceGalleryService } from '@/service-gallery/service-gallery.service';
import { ReviewRepository } from '@/reviews/persistence/repositories/review.repository';
import { GetServiceAvailabilityDto } from '@/services/dto/get-service-availability.dto';
import { GetServiceAvailableDatesDto } from '@/services/dto/get-service-available-dates.dto';
import { AvailableSlotResponseDto } from '@/seller-schedules/dto/available-slots.dto';
import { ServicePackage } from '@/service-packages/domain/service-package';
import { ServiceArea } from '@/service-areas/domain/service-area';
import { ServiceGallery } from '@/service-gallery/domain/service-gallery';
import { Review } from '@/reviews/domain/review';
import { FormTemplatesService } from '@/form-templates/form-templates.service';
import { FormTemplate } from '@/form-templates/domain/form-template';
import { ScheduleByCourtResponseDto } from '@/services/dto/schedule-by-court-response.dto';
import { ScheduleByCourtQueryDto } from '@/services/dto/schedule-by-court-query.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly repository: BaseServiceRepository,
    private readonly sellersService: SellersService,
    private readonly serviceCategoriesService: ServiceCategoriesService,
    private readonly currenciesService: CurrenciesService,
    @Inject(forwardRef(() => SellerSchedulesService))
    private readonly sellerSchedulesService: SellerSchedulesService,
    @Inject(forwardRef(() => ServicePackagesService))
    private readonly servicePackagesService: ServicePackagesService,
    @Inject(forwardRef(() => ServiceAreasService))
    private readonly serviceAreasService: ServiceAreasService,
    @Inject(forwardRef(() => ServiceGalleryService))
    private readonly serviceGalleryService: ServiceGalleryService,
    private readonly reviewRepository: ReviewRepository,
    private readonly formTemplatesService: FormTemplatesService,
  ) {}

  private ensureCode(code: string | undefined, title: string): string {
    const base = code?.trim() || title;
    return base
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private ensurePricing(dto: CreateServiceDto | UpdateServiceDto) {
    if (dto.pricing_type === PricingTypeEnum.FIXED && dto.base_price == null) {
      throw new BadRequestException('base_price is required for fixed pricing');
    }
    if (dto.pricing_type === PricingTypeEnum.HOURLY) {
      const hasHourlyRate = dto.hourly_rate != null;
      const venueWithBasePrice =
        dto.service_type === ServiceTypeEnum.VENUE && dto.base_price != null;
      if (!hasHourlyRate && !venueWithBasePrice) {
        throw new BadRequestException(
          'hourly_rate is required for hourly pricing (or base_price for venue services)',
        );
      }
    }
  }

  async create(dto: CreateServiceDto, causer: User) {
    await this.sellersService.findById(dto.seller_id);
    if (dto.category_id) {
      await this.serviceCategoriesService.findById(dto.category_id);
    }
    if (dto.currency_id) {
      await this.currenciesService.findById(dto.currency_id);
    }
    this.ensurePricing(dto);
    const code = this.ensureCode(dto.code, dto.title);
    const existing = await this.repository.findByCode(code);
    if (existing) throw new BadRequestException('Code already exists');

    // Venue + hourly: use base_price as rate per slot; persist as hourly_rate for consistency
    const hourlyRate =
      dto.service_type === ServiceTypeEnum.VENUE &&
      dto.pricing_type === PricingTypeEnum.HOURLY &&
      dto.hourly_rate == null &&
      dto.base_price != null
        ? dto.base_price
        : dto.hourly_rate;

    const service = Object.assign(new Service(), dto, {
      code,
      pricing_type: dto.pricing_type ?? PricingTypeEnum.FIXED,
      status: dto.status ?? ServiceStatusEnum.DRAFT,
      is_featured: dto.is_featured ?? false,
      requires_quote: dto.requires_quote ?? false,
      instant_booking: dto.instant_booking ?? true,
      view_count: 0,
      total_bookings: 0,
      average_rating: 0,
      total_reviews: 0,
      created_by: causer,
      updated_by: causer,
      ...(hourlyRate != null && { hourly_rate: hourlyRate }),
    });
    const created = await this.repository.create(service);

    const locType = dto.service_location_type;
    if (
      locType === ServiceLocationTypeEnum.WALK_IN ||
      locType === ServiceLocationTypeEnum.BOTH
    ) {
      await this.sellersService.autoLinkWalkInAddress(dto.seller_id);
    }

    return created;
  }

  async findAll(query: QueryServiceDto) {
    return this.repository.findAll(query);
  }

  async getScheduleByCourt(
    query: ScheduleByCourtQueryDto,
  ): Promise<ScheduleByCourtResponseDto> {
    const [bookings, blockedSlots] = await Promise.all([
      this.repository.findScheduleByCourt(query),
      this.repository.findScheduleByCourtBlockedSlots(query),
    ]);
    return { bookings, blocked_slots: blockedSlots };
  }

  async findById(id: number) {
    const service = await this.repository.findById(id);
    if (!service) throw new NotFoundException('Service not found');

    // Fetch reviews for this service
    const reviews = await this.reviewRepository.findByService(id);
    service.reviews = reviews;

    // Normalize peak times to HH:mm for API consumers
    if (service.peak_start_time)
      service.peak_start_time = this.normalizeTimeToHHmm(
        service.peak_start_time,
      );
    if (service.peak_end_time)
      service.peak_end_time = this.normalizeTimeToHHmm(service.peak_end_time);

    // Computed peak price for convenience (hourly_rate * peak_price_multiplier)
    if (
      service.hourly_rate != null &&
      service.peak_price_multiplier != null &&
      service.peak_price_multiplier > 0
    ) {
      (service as any).peak_price =
        Number(service.hourly_rate) * Number(service.peak_price_multiplier);
    }

    return service;
  }

  /** Normalize time string (e.g. "17:00:00") to "HH:mm". */
  private normalizeTimeToHHmm(t: string): string {
    const parts = t.trim().split(':');
    const h = parts[0] ?? '00';
    const m = (parts[1] ?? '00').padStart(2, '0');
    return `${h}:${m}`;
  }

  async update(id: number, dto: UpdateServiceDto, causer: User) {
    const existing = await this.findById(id);
    if (dto.seller_id) {
      await this.sellersService.findById(dto.seller_id);
    }
    if (dto.category_id) {
      await this.serviceCategoriesService.findById(dto.category_id);
    }
    if (dto.currency_id) {
      await this.currenciesService.findById(dto.currency_id);
    }
    if (dto.pricing_type) this.ensurePricing(dto);

    let code = existing.code;
    if (dto.code || dto.title) {
      code = this.ensureCode(dto.code, dto.title ?? existing.title);
      const dup = await this.repository.findByCode(code);
      if (dup && dup.id !== id)
        throw new BadRequestException('Code already exists');
    }

    const isVenue =
      (dto.service_type ?? existing.service_type) === ServiceTypeEnum.VENUE;
    const isHourly =
      (dto.pricing_type ?? existing.pricing_type) === PricingTypeEnum.HOURLY;
    const venueHourlyRate =
      isVenue && isHourly && dto.base_price != null && dto.hourly_rate == null
        ? dto.base_price
        : undefined;

    return this.repository.update(id, {
      ...dto,
      code,
      updated_by: causer,
      ...(venueHourlyRate != null && { hourly_rate: venueHourlyRate }),
    });
  }

  async remove(id: number, causer: User) {
    await this.findById(id);
    await this.repository.remove(id, causer?.id);
  }

  async bulkDelete(dto: BulkModerateServicesDto, causer: User) {
    const results = {
      deleted: [] as number[],
      failed: [] as Array<{ id: number; error: string }>,
    };

    for (const id of dto.ids) {
      try {
        await this.remove(id, causer);
        results.deleted.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      deleted: results.deleted.length,
      failed: results.failed.length,
      deleted_ids: results.deleted,
      failed_items: results.failed,
    };
  }

  async approve(id: number, _dto: ModerateServiceDto, causer: User) {
    await this.findById(id);
    return this.repository.update(id, {
      status: ServiceStatusEnum.ACTIVE,
      updated_by: causer,
    });
  }

  async reject(id: number, dto: ModerateServiceDto, causer: User) {
    await this.findById(id);
    // For now we only track status; reason can be logged later if a column is added
    return this.repository.update(id, {
      status: ServiceStatusEnum.ARCHIVED,
      updated_by: causer,
    });
  }

  async suspend(id: number, dto: ModerateServiceDto, causer: User) {
    await this.findById(id);
    return this.repository.update(id, {
      status: ServiceStatusEnum.PAUSED,
      updated_by: causer,
    });
  }

  async bulkApprove(dto: BulkModerateServicesDto, causer: User) {
    const results = {
      approved: [] as number[],
      failed: [] as Array<{ id: number; error: string }>,
    };

    for (const id of dto.ids) {
      try {
        await this.approve(id, { reason: dto.reason }, causer);
        results.approved.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      approved: results.approved.length,
      failed: results.failed.length,
      approved_ids: results.approved,
      failed_items: results.failed,
    };
  }

  async bulkReject(dto: BulkModerateServicesDto, causer: User) {
    const results = {
      rejected: [] as number[],
      failed: [] as Array<{ id: number; error: string }>,
    };

    for (const id of dto.ids) {
      try {
        await this.reject(id, { reason: dto.reason }, causer);
        results.rejected.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      rejected: results.rejected.length,
      failed: results.failed.length,
      rejected_ids: results.rejected,
      failed_items: results.failed,
    };
  }

  async bulkSuspend(dto: BulkModerateServicesDto, causer: User) {
    const results = {
      suspended: [] as number[],
      failed: [] as Array<{ id: number; error: string }>,
    };

    for (const id of dto.ids) {
      try {
        await this.suspend(id, { reason: dto.reason }, causer);
        results.suspended.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      suspended: results.suspended.length,
      failed: results.failed.length,
      suspended_ids: results.suspended,
      failed_items: results.failed,
    };
  }

  async featured(
    limit?: number,
    sellerId?: number,
    excludeSellerSlugs?: string[],
  ) {
    const result = await this.repository.findFeatured(
      limit,
      sellerId,
      excludeSellerSlugs,
    );
    // Batch fetch reviews for all services
    if (result.data.length > 0) {
      const serviceIds = result.data.map((s) => s.id);
      const allReviews = await Promise.all(
        serviceIds.map((id) => this.reviewRepository.findByService(id)),
      );
      // Map reviews to services
      result.data.forEach((service, index) => {
        service.reviews = allReviews[index];
      });
    }
    return result;
  }

  async popular(limit?: number, sellerId?: number) {
    const result = await this.repository.findPopular(limit, sellerId);
    // Batch fetch reviews for all services
    if (result.data.length > 0) {
      const serviceIds = result.data.map((s) => s.id);
      const allReviews = await Promise.all(
        serviceIds.map((id) => this.reviewRepository.findByService(id)),
      );
      // Map reviews to services
      result.data.forEach((service, index) => {
        service.reviews = allReviews[index];
      });
    }
    return result;
  }

  async nearby(params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    limit?: number;
    sellerId?: number;
  }) {
    return this.repository.findNearby(params);
  }

  async search(params: SearchServicesDto) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    return this.repository.search({
      q: params.q,
      sellerId: params.seller_id,
      categoryIds: params.category_ids,
      minPrice: params.min_price,
      maxPrice: params.max_price,
      minRating: params.min_rating,
      pricingType: params.pricing_type,
      isFeatured: params.is_featured,
      instantBooking: params.instant_booking,
      isRemoteAvailable: params.is_remote_available,
      serviceLocationType: params.service_location_type,
      page,
      limit,
      sortBy: params.sort_by,
      latitude: params.latitude,
      longitude: params.longitude,
      city: params.city,
      province: params.province,
    });
  }

  async suggestions(q?: string, limit?: number) {
    return this.repository.suggestions(q, limit);
  }

  /**
   * Get popular search terms.
   *
   * Returns a list of popular search terms based on search history.
   * Falls back to common service categories if no search history exists.
   *
   * @param limit - Maximum number of terms to return (default: 10)
   * @returns Array of popular search terms with counts
   */
  getPopularSearchTerms(
    limit: number = 10,
  ): Array<{ term: string; count: number }> {
    // TODO: Implement actual popular terms from user_search_histories table
    // For now, return popular service categories/common search terms
    const popularTerms = [
      { term: 'Cleaning', count: 1250 },
      { term: 'Plumbing', count: 980 },
      { term: 'Electrician', count: 875 },
      { term: 'Air Conditioning', count: 720 },
      { term: 'Painting', count: 650 },
      { term: 'Carpentry', count: 580 },
      { term: 'Landscaping', count: 520 },
      { term: 'Moving', count: 480 },
      { term: 'Pest Control', count: 420 },
      { term: 'Home Repair', count: 380 },
      { term: 'Appliance Repair', count: 350 },
      { term: 'Tutoring', count: 320 },
      { term: 'Photography', count: 290 },
      { term: 'Catering', count: 270 },
      { term: 'Massage', count: 250 },
    ];

    return popularTerms.slice(0, limit);
  }

  async detail(id: number) {
    return this.repository.findDetail(id);
  }

  /**
   * Get available time slots for a service on a specific date.
   *
   * Delegates to SellerSchedulesService.getAvailableSlots() with service context.
   *
   * @param serviceId - Service ID
   * @param dto - Availability query parameters
   * @returns Array of available time slots
   */
  async getAvailability(
    serviceId: number,
    dto: GetServiceAvailabilityDto,
  ): Promise<AvailableSlotResponseDto[]> {
    // Verify service exists
    await this.findById(serviceId);

    // Get slot duration from package if provided, otherwise use default
    let slotDuration = dto.slot_duration_minutes || 30;
    if (dto.package_id) {
      const pkg = await this.servicePackagesService.findById(dto.package_id);
      if (pkg.service_id !== serviceId) {
        throw new BadRequestException(
          'Package does not belong to this service',
        );
      }
      if (pkg.duration_minutes) {
        slotDuration = pkg.duration_minutes;
      }
    }

    // Delegate to seller schedules service (simplified: no member_id)
    return this.sellerSchedulesService.getAvailableSlots({
      service_id: serviceId,
      date: dto.date,
      slot_duration_minutes: slotDuration,
    });
  }

  /**
   * Get available dates for a service within a date range.
   *
   * Returns dates that have at least one available slot.
   *
   * @param serviceId - Service ID
   * @param dto - Date range query parameters
   * @returns Array of dates with availability information
   */
  async getAvailableDates(
    serviceId: number,
    dto: GetServiceAvailableDatesDto,
  ): Promise<
    Array<{
      date: string;
      hasAvailability: boolean;
      slotsCount: number;
    }>
  > {
    // Verify service exists
    await this.findById(serviceId);

    // Get slot duration from package if provided
    let slotDuration = 30;
    if (dto.package_id) {
      const pkg = await this.servicePackagesService.findById(dto.package_id);
      if (pkg.service_id !== serviceId) {
        throw new BadRequestException(
          'Package does not belong to this service',
        );
      }
      if (pkg.duration_minutes) {
        slotDuration = pkg.duration_minutes;
      }
    }

    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const results: Array<{
      date: string;
      hasAvailability: boolean;
      slotsCount: number;
    }> = [];

    // Iterate through each date in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Get available slots for this date
      const slots = await this.sellerSchedulesService.getAvailableSlots({
        service_id: serviceId,
        date: dateStr,
        slot_duration_minutes: slotDuration,
      });

      results.push({
        date: dateStr,
        hasAvailability: slots.length > 0,
        slotsCount: slots.length,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return results;
  }

  /**
   * Get available time slots for a venue service on a specific date.
   *
   * Returns slots with capacity info and peak pricing.
   * Only works for services with service_type = 'venue'.
   *
   * @param serviceId - Service ID
   * @param date - Date string (YYYY-MM-DD)
   * @returns Array of venue slots with capacity and pricing
   */
  async getVenueAvailableSlots(
    serviceId: number,
    date: string,
  ): Promise<AvailableSlotResponseDto[]> {
    const service = await this.findById(serviceId);

    if (service.service_type !== ServiceTypeEnum.VENUE) {
      throw new BadRequestException(
        'This endpoint is only available for venue services. Use /availability for other service types.',
      );
    }

    return this.sellerSchedulesService.getAvailableSlots({
      service_id: serviceId,
      date,
    });
  }

  /**
   * Get packages for a specific service
   *
   * @param serviceId - Service ID
   * @returns List of service packages
   */
  async getPackages(
    serviceId: number,
  ): Promise<{ data: ServicePackage[]; totalCount: number }> {
    await this.findById(serviceId);
    return this.servicePackagesService.findAll({ service_id: serviceId });
  }

  /**
   * Get service areas for a specific service
   *
   * @param serviceId - Service ID
   * @returns List of service areas
   */
  async getAreas(
    serviceId: number,
  ): Promise<{ data: ServiceArea[]; totalCount: number }> {
    await this.findById(serviceId);
    return this.serviceAreasService.findAll({ service_id: serviceId });
  }

  /**
   * Get gallery items for a specific service
   *
   * @param serviceId - Service ID
   * @returns List of gallery items
   */
  async getGallery(
    serviceId: number,
  ): Promise<{ data: ServiceGallery[]; totalCount: number }> {
    await this.findById(serviceId);
    return this.serviceGalleryService.findAll({ service_id: serviceId });
  }

  /**
   * Get reviews for a specific service
   *
   * @param serviceId - Service ID
   * @param skip - Number of items to skip
   * @param take - Number of items to take
   * @returns List of reviews with pagination
   */
  async getReviews(
    serviceId: number,
    skip = 0,
    take = 20,
  ): Promise<{
    data: Review[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    await this.findById(serviceId);
    return this.reviewRepository.findAll({
      service_id: serviceId,
      skip,
      take,
      status: 'Active',
    });
  }

  /**
   * Get related services (same category, excluding the current service)
   *
   * @param serviceId - Service ID
   * @param limit - Number of related services to return
   * @returns List of related services
   */
  async getRelated(
    serviceId: number,
    limit = 6,
  ): Promise<{ data: Service[]; totalCount: number }> {
    const service = await this.findById(serviceId);

    // Find services in the same category, excluding the current service
    const { data, totalCount } = await this.repository.search({
      categoryIds: service.category_id ? [service.category_id] : undefined,
      limit: limit + 1, // Get one extra to exclude current
      page: 1,
    });

    // Filter out the current service
    const filtered = data.filter((s) => s.id !== serviceId);

    return {
      data: filtered.slice(0, limit),
      totalCount: Math.max(0, totalCount - 1),
    };
  }

  /**
   * Get form templates for a specific service
   *
   * @param serviceId - Service ID
   * @returns List of form templates
   */
  async getFormTemplates(
    serviceId: number,
  ): Promise<{ data: FormTemplate[]; totalCount: number }> {
    await this.findById(serviceId); // Verify service exists
    const templates =
      await this.formTemplatesService.findByServiceId(serviceId);
    return {
      data: templates,
      totalCount: templates.length,
    };
  }
}
