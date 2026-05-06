import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ServicesService } from '@/services/services.service';
import { CreateServiceDto } from '@/services/dto/create-service.dto';
import { UpdateServiceDto } from '@/services/dto/update-service.dto';
import { QueryServiceDto } from '@/services/dto/query-service.dto';
import { Service as ServiceModel } from '@/services/domain/service';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { ModerateServiceDto } from '@/services/dto/moderate-service.dto';
import { BulkModerateServicesDto } from '@/services/dto/bulk-moderate-services.dto';
import { SearchServicesDto } from '@/services/dto/search-services.dto';
import { GetServiceAvailabilityDto } from '@/services/dto/get-service-availability.dto';
import { GetServiceAvailableDatesDto } from '@/services/dto/get-service-available-dates.dto';
import { AvailableSlotResponseDto } from '@/seller-schedules/dto/available-slots.dto';
import { ServicePackage } from '@/service-packages/domain/service-package';
import { ServiceArea } from '@/service-areas/domain/service-area';
import { ServiceGallery } from '@/service-gallery/domain/service-gallery';
import { Review } from '@/reviews/domain/review';
import { FormTemplate } from '@/form-templates/domain/form-template';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { ScheduleByCourtResponseDto } from '@/services/dto/schedule-by-court-response.dto';
import { ScheduleByCourtQueryDto } from '@/services/dto/schedule-by-court-query.dto';

class NearbyQueryDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radius_km?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  seller_id?: number;
}

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'services',
  version: '1',
})
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Post()
  @Permissions({ SM10: 'Create' })
  @ApiCreatedResponse({ type: ServiceModel })
  create(@Body() dto: CreateServiceDto, @CurrentUser() currentUser: User) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by service title or code (case-insensitive)',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    type: String,
    description: 'Filter by service title (case-insensitive partial match)',
  })
  @ApiQuery({
    name: 'sortField',
    required: false,
    type: String,
    enum: [
      'title',
      'created_at',
      'updated_at',
      'base_price',
      'hourly_rate',
      'average_rating',
      'total_bookings',
      'view_count',
      'category_id',
      'seller_id',
      'status',
      'service_type',
    ],
    description: 'Field to sort by (default: created_at)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
    description: 'Sort direction (default: DESC)',
  })
  @ApiQuery({
    name: 'active_seller_only',
    required: false,
    type: Boolean,
    example: true,
    description: 'Filter to only include services whose seller is active.',
  })
  @ApiOkResponse({ type: ServiceModel, isArray: true })
  async findAll(@Query() query: QueryServiceDto) {
    // Convert page/limit to skip/take if provided (prioritize page/limit over skip/take)
    const queryParams: QueryServiceDto = { ...query };
    if (query.page !== undefined || query.limit !== undefined) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      queryParams.skip = (page - 1) * limit;
      queryParams.take = limit;
    }
    const { data, totalCount } = await this.service.findAll(queryParams);
    return { data, totalCount };
  }

  @Patch('bulk-approve')
  @ApiOkResponse({
    description: 'Bulk approve services',
    schema: {
      type: 'object',
      properties: {
        approved: {
          type: 'number',
          description: 'Number of successfully approved services',
        },
        failed: { type: 'number', description: 'Number of failed approvals' },
        approved_ids: { type: 'array', items: { type: 'number' } },
        failed_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async bulkApprove(
    @Body() dto: BulkModerateServicesDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.bulkApprove(dto, currentUser);
  }

  @Patch('bulk-reject')
  @ApiOkResponse({
    description: 'Bulk reject services',
    schema: {
      type: 'object',
      properties: {
        rejected: {
          type: 'number',
          description: 'Number of successfully rejected services',
        },
        failed: { type: 'number', description: 'Number of failed rejections' },
        rejected_ids: { type: 'array', items: { type: 'number' } },
        failed_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async bulkReject(
    @Body() dto: BulkModerateServicesDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.bulkReject(dto, currentUser);
  }

  @Patch('bulk-suspend')
  @ApiOkResponse({
    description: 'Bulk suspend services',
    schema: {
      type: 'object',
      properties: {
        suspended: {
          type: 'number',
          description: 'Number of successfully suspended services',
        },
        failed: { type: 'number', description: 'Number of failed suspensions' },
        suspended_ids: { type: 'array', items: { type: 'number' } },
        failed_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async bulkSuspend(
    @Body() dto: BulkModerateServicesDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.bulkSuspend(dto, currentUser);
  }

  @Patch(':id/approve')
  @Permissions({ SM10: 'Approve' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceModel })
  approve(
    @Param('id') id: number,
    @Body() dto: ModerateServiceDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.approve(id, dto, currentUser);
  }

  @Patch(':id/reject')
  @Permissions({ SM10: 'Approve' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceModel })
  reject(
    @Param('id') id: number,
    @Body() dto: ModerateServiceDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.reject(id, dto, currentUser);
  }

  @Patch(':id/suspend')
  @Permissions({ SM10: 'Approve' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceModel })
  suspend(
    @Param('id') id: number,
    @Body() dto: ModerateServiceDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.suspend(id, dto, currentUser);
  }

  @Get('featured')
  @ApiOkResponse({ type: ServiceModel, isArray: true })
  async featured(
    @Query('limit') limit?: number,
    @Query('seller_id') sellerId?: number,
    @Query('exclude_seller_slug') excludeSellerSlug?: string,
  ) {
    const num = Number(limit);
    const parsedLimit = Number.isFinite(num) && num > 0 ? num : undefined;
    const sellerNum = Number(sellerId);
    const parsedSellerId =
      Number.isInteger(sellerNum) && sellerNum > 0 ? sellerNum : undefined;
    const excludeSellerSlugs = excludeSellerSlug
      ? excludeSellerSlug
          .split(',')
          .map((v) => v.trim().toLowerCase())
          .filter(Boolean)
      : undefined;
    const { data } = await this.service.featured(
      parsedLimit,
      parsedSellerId,
      excludeSellerSlugs,
    );
    return data;
  }

  @Get('popular')
  @ApiOkResponse({ type: ServiceModel, isArray: true })
  async popular(
    @Query('limit') limit?: number,
    @Query('seller_id') sellerId?: number,
  ) {
    const num = Number(limit);
    const parsedLimit = Number.isFinite(num) && num > 0 ? num : undefined;
    const sellerNum = Number(sellerId);
    const parsedSellerId =
      Number.isInteger(sellerNum) && sellerNum > 0 ? sellerNum : undefined;
    const { data } = await this.service.popular(parsedLimit, parsedSellerId);
    return data;
  }

  @Get('nearby')
  @ApiOkResponse({ type: ServiceModel, isArray: true })
  async nearby(@Query() query: NearbyQueryDto) {
    const { data } = await this.service.nearby({
      latitude: query.latitude,
      longitude: query.longitude,
      radiusKm: query.radius_km,
      limit: query.limit,
      sellerId: query.seller_id,
    });
    return data;
  }

  @Get('search')
  @ApiOkResponse({ type: ServiceModel, isArray: true })
  async search(@Query() query: SearchServicesDto) {
    const { data, totalCount } = await this.service.search(query);
    return { data, totalCount };
  }

  @Get('search/suggestions')
  @ApiOkResponse({
    description: 'List of suggestion strings',
    schema: { type: 'array', items: { type: 'string' } },
  })
  async suggestions(@Query('q') q?: string, @Query('limit') limit?: number) {
    const num = Number(limit);
    const parsedLimit = Number.isFinite(num) && num > 0 ? num : undefined;
    return this.service.suggestions(q, parsedLimit);
  }

  @Get('search/popular')
  @ApiOkResponse({
    description: 'List of popular search terms with search counts',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          count: { type: 'number' },
        },
      },
    },
  })
  popularSearchTerms(@Query('limit') limit?: number) {
    const num = Number(limit);
    const parsedLimit = Number.isFinite(num) && num > 0 ? num : 10;
    return this.service.getPopularSearchTerms(parsedLimit);
  }

  @Get('schedule-by-court')
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Filter by booking date (YYYY-MM-DD)',
    example: '2026-03-05',
  })
  @ApiQuery({
    name: 'service_id',
    required: false,
    type: Number,
    description: 'Filter by service ID',
    example: 101,
  })
  @ApiOperation({
    summary: 'Get booking schedule by court',
    description:
      'Returns bookings and blocked slots with nested service and customer user details.',
  })
  @ApiOkResponse({
    type: ScheduleByCourtResponseDto,
    description:
      'Schedule grouped as bookings -> service and bookings -> customer -> user, plus blocked_slots',
  })
  async getScheduleByCourt(
    @Query() query: ScheduleByCourtQueryDto,
  ): Promise<ScheduleByCourtResponseDto> {
    return await this.service.getScheduleByCourt(query);
  }

  @Get(':id/detail')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    description: 'Service detail with packages, areas, gallery',
    schema: {
      type: 'object',
      properties: {
        service: { type: 'object' },
        packages: { type: 'array', items: { type: 'object' } },
        areas: { type: 'array', items: { type: 'object' } },
        gallery: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  async detail(@Param('id') id: number) {
    const detail = await this.service.detail(id);
    if (!detail.service) {
      return { service: null, packages: [], areas: [], gallery: [] };
    }
    return detail;
  }

  /**
   * Get available time slots for a service on a specific date.
   *
   * Applies comprehensive availability checks:
   *
   * **LEVEL 1: Seller-Level Validations**
   * - Seller schedule exists for that day
   * - Schedule status is ACTIVE
   * - Time within working hours
   * - Not during break time
   * - No store unavailability blocks
   * - max_concurrent_bookings not exceeded
   *
   * **LEVEL 2: Service-Level Validations**
   * - Within advance_booking_days limit
   * - minimum_notice_hours satisfied (interpreted as minutes)
   * - max_daily_bookings not exceeded
   *
   * @example
   * GET /v1/services/1/availability?date=2025-01-15
   * GET /v1/services/1/availability?date=2025-01-15&slot_duration_minutes=60
   */
  @Get(':id/availability')
  @ApiParam({ name: 'id', type: Number, description: 'Service ID' })
  @ApiOperation({
    summary: 'Get available time slots for a service',
    description: `
      Returns all available time slots for a service on a specific date.
      
      **Validations Applied:**
      
      *Seller-Level:*
      - Schedule exists and is ACTIVE
      - Time within working hours
      - Not during break periods
      - No unavailability blocks
      - Concurrent booking capacity
      
      *Service-Level:*
      - advance_booking_days limit
      - minimum_notice_hours requirement (interpreted as minutes)
      - max_daily_bookings limit
    `,
  })
  @ApiOkResponse({
    type: AvailableSlotResponseDto,
    isArray: true,
    description: 'List of time slots with availability status',
  })
  async getAvailability(
    @Param('id') id: number,
    @Query() query: GetServiceAvailabilityDto,
  ): Promise<AvailableSlotResponseDto[]> {
    return await this.service.getAvailability(id, query);
  }

  /**
   * Get available dates for a service within a date range.
   *
   * Returns which dates have available slots, useful for calendar displays.
   * Applies all Level 1 and Level 2 availability validations.
   *
   * @example
   * GET /v1/services/1/available-dates?start_date=2025-01-01&end_date=2025-01-31
   */
  @Get(':id/available-dates')
  @ApiParam({ name: 'id', type: Number, description: 'Service ID' })
  @ApiOperation({
    summary: 'Get available dates for a service',
    description: `
      Returns dates that have available time slots within the specified range.
      Useful for calendar UI to show which dates are bookable.
      
      Applies all availability validations (seller and service level).
    `,
  })
  @ApiOkResponse({
    description: 'List of dates with availability information',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date', example: '2025-01-15' },
          hasAvailability: { type: 'boolean', example: true },
          slotsCount: { type: 'number', example: 8 },
        },
      },
    },
  })
  async getAvailableDates(
    @Param('id') id: number,
    @Query() query: GetServiceAvailableDatesDto,
  ): Promise<
    Array<{
      date: string;
      hasAvailability: boolean;
      slotsCount: number;
    }>
  > {
    return await this.service.getAvailableDates(id, query);
  }

  /**
   * Get available time slots for a venue service.
   *
   * Returns slots with remaining capacity, peak pricing info, and hourly rate.
   * Only works for services with service_type = 'venue'.
   *
   * @example
   * GET /v1/services/1/venue-slots?date=2026-02-15
   */
  @Get(':id/venue-slots')
  @ApiParam({ name: 'id', type: Number, description: 'Service ID' })
  @ApiQuery({
    name: 'date',
    type: String,
    description: 'Date to check (YYYY-MM-DD)',
    example: '2026-02-15',
  })
  @ApiOperation({
    summary: 'Get available venue time slots',
    description: `
      Returns time slots for a venue service on a specific date.
      Each slot includes remaining capacity, peak status, and hourly rate.
      Only works for services with service_type = 'venue'.
    `,
  })
  @ApiOkResponse({
    type: AvailableSlotResponseDto,
    isArray: true,
    description: 'List of venue time slots with capacity and pricing',
  })
  async getVenueSlots(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
  ): Promise<AvailableSlotResponseDto[]> {
    if (!date) {
      throw new BadRequestException('date query parameter is required');
    }
    return await this.service.getVenueAvailableSlots(id, date);
  }

  /**
   * Get packages for a service
   */
  @Get(':id/packages')
  @ApiParam({ name: 'id', type: Number, description: 'Service ID' })
  @ApiOkResponse({
    description: 'List of service packages',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ServicePackage' },
        },
        totalCount: { type: 'number' },
      },
    },
  })
  async getPackages(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ data: ServicePackage[]; totalCount: number }> {
    return await this.service.getPackages(id);
  }

  /**
   * Get service areas for a service
   */
  @Get(':id/areas')
  @ApiParam({ name: 'id', type: Number, description: 'Service ID' })
  @ApiOkResponse({
    description: 'List of service areas',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ServiceArea' },
        },
        totalCount: { type: 'number' },
      },
    },
  })
  async getAreas(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ data: ServiceArea[]; totalCount: number }> {
    return await this.service.getAreas(id);
  }

  /**
   * Get gallery items for a service
   */
  @Get(':id/gallery')
  @ApiParam({ name: 'id', type: Number, description: 'Service ID' })
  @ApiOkResponse({
    description: 'List of gallery images',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ServiceGallery' },
        },
        totalCount: { type: 'number' },
      },
    },
  })
  async getGallery(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ data: ServiceGallery[]; totalCount: number }> {
    return await this.service.getGallery(id);
  }

  /**
   * Get reviews for a service
   */
  @Get(':id/reviews')
  @ApiParam({ name: 'id', type: Number, description: 'Service ID' })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of items to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of items to take',
  })
  @ApiOkResponse({
    description: 'List of reviews for the service',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Review' },
        },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
      },
    },
  })
  async getReviews(
    @Param('id', ParseIntPipe) id: number,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ): Promise<{
    data: Review[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    const skipNum = skip ? Number(skip) : 0;
    const takeNum = take ? Number(take) : 20;
    return await this.service.getReviews(id, skipNum, takeNum);
  }

  /**
   * Get related services (same category)
   */
  @Get(':id/related')
  @ApiParam({ name: 'id', type: Number, description: 'Service ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of related services to return (default: 6)',
  })
  @ApiOkResponse({
    description: 'List of related services',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Service' },
        },
        totalCount: { type: 'number' },
      },
    },
  })
  async getRelated(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: number,
  ): Promise<{ data: ServiceModel[]; totalCount: number }> {
    const limitNum = limit ? Number(limit) : 6;
    return await this.service.getRelated(id, limitNum);
  }

  /**
   * Get form templates for a service
   */
  @Get(':id/form-templates')
  @ApiParam({ name: 'id', type: Number, description: 'Service ID' })
  @ApiOkResponse({
    description: 'List of form templates for the service',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/FormTemplate' },
        },
        totalCount: { type: 'number' },
      },
    },
  })
  async getFormTemplates(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ data: FormTemplate[]; totalCount: number }> {
    return await this.service.getFormTemplates(id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceModel })
  findOne(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Put(':id')
  @Permissions({ SM10: 'Edit' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceModel })
  put(
    @Param('id') id: number,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Patch(':id')
  @Permissions({ SM10: 'Edit' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceModel })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete('bulk-delete')
  @ApiOkResponse({
    description: 'Bulk delete services',
    schema: {
      type: 'object',
      properties: {
        deleted: {
          type: 'number',
          description: 'Number of successfully deleted services',
        },
        failed: { type: 'number', description: 'Number of failed deletions' },
        deleted_ids: { type: 'array', items: { type: 'number' } },
        failed_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async bulkDelete(
    @Body() dto: BulkModerateServicesDto,
    @CurrentUser() currentUser: User,
  ) {
    return await this.service.bulkDelete(dto, currentUser);
  }

  @Delete(':id')
  @Permissions({ SM10: 'Delete' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.service.remove(id, currentUser);
  }
}
