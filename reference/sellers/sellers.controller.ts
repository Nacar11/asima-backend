import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { SellersService } from '@/sellers/sellers.service';
import { SellerEarningsService } from '@/seller-earnings/seller-earnings.service';
import { Seller } from '@/sellers/domain/seller';
import { FindAllSeller } from '@/sellers/domain/find-all-seller';
import { SellerProfile, PortfolioItem } from '@/sellers/domain/seller-profile';
import { CreateSellerDto } from '@/sellers/dto/create-seller.dto';
import { UpdateSellerDto } from '@/sellers/dto/update-seller.dto';
import { QuerySellerDto } from '@/sellers/dto/query-seller.dto';
import { QuerySellerServicesDto } from '@/sellers/dto/query-seller-services.dto';
import { QuerySellerReviewsDto } from '@/sellers/dto/query-seller-reviews.dto';
import {
  PickupSettingsDto,
  PickupSettingsResponseDto,
} from '@/sellers/dto/pickup-settings.dto';
import {
  PickupAvailabilityService,
  PickupAvailabilityResponse,
} from '@/sales-orders/pickup-availability.service';
import {
  QuerySellerAvailabilityDto,
  SellerAvailabilityResponseDto,
} from '@/sellers/dto/query-seller-availability.dto';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Public } from '@/utils/decorators/public.decorator';
import { User } from '@/users/domain/user';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { Service } from '@/services/domain/service';
import { Review } from '@/reviews/domain/review';
import { FeaturedSellerResponseDto } from '@/sellers/dto/featured-seller-response.dto';
import { BulkActionDto } from '@/utils/dto/bulk-action.dto';

/**
 * Controller for seller endpoints
 */
@ApiTags('Sellers')
@ApiBearerAuth()
@UseGuards(JwtGuard, PermissionsGuard)
@Controller({
  path: 'sellers',
  version: '1',
})
export class SellersController {
  constructor(
    private readonly service: SellersService,
    private readonly sellerEarningsService: SellerEarningsService,
    private readonly pickupAvailabilityService: PickupAvailabilityService,
  ) {}

  /**
   * Get upload configuration for store files (logo/banner)
   * Public endpoint - no authentication required
   */
  @Public()
  @Get('upload-config')
  @ApiOperation({
    summary: 'Get upload configuration',
    description:
      'Returns file upload limits for store logo and banner. Public endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Upload configuration',
    schema: {
      type: 'object',
      properties: {
        maxSizeMB: { type: 'number', example: 10 },
        maxSizeBytes: { type: 'number', example: 10485760 },
      },
    },
  })
  getUploadConfig(): { maxSizeMB: number; maxSizeBytes: number } {
    return this.service.getUploadConfig();
  }

  /**
   * Create a seller with optional logo and banner upload
   */
  @Post()
  @Permissions({ SM05: 'Create' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'store_logo_url', maxCount: 1 },
      { name: 'store_banner_url', maxCount: 1 },
    ]),
  )
  @ApiOperation({
    summary: 'Create a seller with optional file uploads',
    description:
      'Creates a new seller with the provided details. Supports optional logo and banner file uploads in the same request.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'number',
          example: 1,
          description: 'User ID (one-to-one relationship)',
        },
        store_name: {
          type: 'string',
          example: 'Tech Store',
          description: 'Store name',
        },
        slug: {
          type: 'string',
          example: 'tech-store',
          description:
            'URL-friendly seller slug (optional, auto-generated from store_name if omitted)',
        },
        store_description: {
          type: 'string',
          example: 'A store selling electronics',
          nullable: true,
        },
        store_logo_url: {
          type: 'string',
          format: 'binary',
          description: 'Store logo image file (optional)',
        },
        store_banner_url: {
          type: 'string',
          format: 'binary',
          description: 'Store banner image file (optional)',
        },
        business_registration_number: {
          type: 'string',
          example: 'BR123456789',
          nullable: true,
        },
        tax_id: {
          type: 'string',
          example: 'TAX123456',
          nullable: true,
        },
        bank_account_holder: {
          type: 'string',
          example: 'John Doe',
          nullable: true,
        },
        bank_account_number: {
          type: 'string',
          example: '1234567890',
          nullable: true,
        },
        bank_name: {
          type: 'string',
          example: 'Bank of America',
          nullable: true,
        },
        is_verified: {
          type: 'boolean',
          example: false,
          default: false,
        },
        is_active: {
          type: 'boolean',
          example: true,
          default: true,
        },
        status: {
          type: 'string',
          enum: ['Active', 'Cancelled', 'Hold'],
          example: 'Active',
          default: 'Active',
        },
      },
      required: ['user_id', 'store_name'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Seller created successfully',
    type: Seller,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async create(
    @Body() input: CreateSellerDto,
    @CurrentUser() currentUser: User,
    @UploadedFiles()
    files?: {
      store_logo_url?: Express.Multer.File[];
      store_banner_url?: Express.Multer.File[];
    },
  ): Promise<Seller> {
    const logoFile = files?.store_logo_url?.[0];
    const bannerFile = files?.store_banner_url?.[0];
    return this.service.create(input, currentUser, logoFile, bannerFile);
  }

  @Post('bulk/delete')
  @Permissions({ SM05: 'Delete' })
  @HttpCode(HttpStatus.OK)
  async bulkDelete(
    @Body() bulkDeleteDto: BulkActionDto,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.service.bulkDelete(bulkDeleteDto.ids, currentUser);
  }

  /**
   * Get current user's seller profile
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get my seller profile',
    description:
      'Retrieves the seller profile for the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Seller profile found',
    type: Seller,
  })
  @ApiResponse({
    status: 404,
    description: 'Seller profile not found for current user',
  })
  async getMyProfile(@CurrentUser() currentUser: User): Promise<Seller> {
    const seller = await this.service.findByUserId(currentUser.id);
    if (!seller) {
      throw new NotFoundException('Seller profile not found for current user');
    }
    return seller;
  }

  /**
   * Get current user's seller earnings summary
   */
  @Get('me/earnings/summary')
  @ApiOperation({
    summary: 'Get my earnings summary',
    description:
      'Gets the earnings summary for the current authenticated seller including monthly breakdowns and chart data',
  })
  @ApiResponse({
    status: 200,
    description: 'Earnings summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total_earnings: {
          type: 'number',
          example: 50000.0,
          description: 'Total lifetime earnings',
        },
        available_balance: {
          type: 'number',
          example: 35000.0,
          description: 'Available balance for payout',
        },
        pending_balance: {
          type: 'number',
          example: 15000.0,
          description: 'Pending earnings (not yet available)',
        },
        this_month_earnings: {
          type: 'number',
          example: 8500.0,
          description: 'Earnings for the current month',
        },
        last_month_earnings: {
          type: 'number',
          example: 12000.0,
          description: 'Earnings for the previous month',
        },
        chart: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string', example: '2025-12-15' },
              amount: { type: 'number', example: 1500.0 },
            },
          },
          description: 'Daily earnings for the last 30 days',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Seller profile not found for current user',
  })
  async getMyEarningsSummary(@CurrentUser() currentUser: User): Promise<{
    total_earnings: number;
    available_balance: number;
    pending_balance: number;
    this_month_earnings: number;
    last_month_earnings: number;
    chart: Array<{ period: string; amount: number }>;
  }> {
    const seller = await this.service.findByUserId(currentUser.id);
    if (!seller) {
      throw new NotFoundException('Seller profile not found for current user');
    }
    return this.sellerEarningsService.getEnhancedEarningsSummary(seller.id);
  }

  /**
   * Get current user's seller earnings history
   */
  @Get('me/earnings/history')
  @ApiOperation({
    summary: 'Get my earnings history',
    description:
      'Gets the paginated earnings transaction history for the current authenticated seller',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status (pending, available, paid_out)',
  })
  @ApiResponse({
    status: 200,
    description: 'Earnings history retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Seller profile not found for current user',
  })
  async getMyEarningsHistory(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @CurrentUser() currentUser?: User,
  ) {
    const seller = await this.service.findByUserId(currentUser!.id);
    if (!seller) {
      throw new NotFoundException('Seller profile not found for current user');
    }
    const parsedPage = Number(page) || 1;
    const parsedLimit = Math.min(Number(limit) || 20, 50);

    return this.sellerEarningsService.findAll({
      seller_id: seller.id,
      status: status,
      page: parsedPage,
      limit: parsedLimit,
    });
  }

  /**
   * Get all sellers
   */
  @Get()
  @ApiOperation({
    summary: 'Get all sellers',
    description: 'Retrieves all sellers with optional filtering and pagination',
  })
  @ApiQuery({
    name: 'store_name',
    required: false,
    type: String,
    description: 'Filter by store name',
  })
  @ApiQuery({
    name: 'is_verified',
    required: false,
    type: Boolean,
    description: 'Filter by verification status',
  })
  @ApiQuery({
    name: 'is_active',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['Active', 'Cancelled', 'Hold'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'sortField',
    required: false,
    type: String,
    description:
      'Field to sort by (store_name, store_description, is_verified, sells_products, sells_services, created_at, updated_at, status, user_first_name, user_last_name). Default: created_at',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (ASC or DESC, default: DESC)',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    example: 0,
    description: 'Number of items to skip (default: 0)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of items to take/return (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of sellers',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: QuerySellerDto): Promise<FindAllSeller> {
    return this.service.findAll(query);
  }

  /**
   * Get all featured sellers — public endpoint, no auth required
   */
  @Public()
  @Get('featured')
  @ApiOperation({
    summary: 'Get featured sellers',
    description:
      'Returns all featured sellers (is_featured=true, is_active=true, is_verified=true). Public endpoint — no authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of featured sellers',
    type: FeaturedSellerResponseDto,
    isArray: true,
  })
  async getFeatured(): Promise<FeaturedSellerResponseDto[]> {
    return this.service.getFeatured();
  }

  /**
   * Get public profile of a seller/service provider
   */
  @Get(':id/profile')
  @ApiOperation({
    summary: 'Get provider public profile',
    description:
      'Retrieves the public-facing profile of a service provider including stats, bio, and business information',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider profile found',
    type: SellerProfile,
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  async getProfile(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SellerProfile> {
    return await this.service.getProfile(id);
  }

  /**
   * Get services offered by a seller
   */
  @Get(':id/services')
  @ApiOperation({
    summary: "Get provider's services",
    description: 'Retrieves all services offered by a specific seller/provider',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of services',
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
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  getServices(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QuerySellerServicesDto,
  ): Promise<{ data: Service[]; totalCount: number }> {
    return this.service.getServices(id, query);
  }

  /**
   * Get portfolio items of a seller
   */
  @Get(':id/portfolio')
  @ApiOperation({
    summary: 'Get provider portfolio',
    description:
      'Retrieves portfolio/work samples of a service provider. Note: Portfolio feature is coming soon.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of portfolio items',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PortfolioItem' },
        },
        totalCount: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  getPortfolio(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ data: PortfolioItem[]; totalCount: number }> {
    return this.service.getPortfolio(id);
  }

  /**
   * Get reviews for a seller
   */
  @Get(':id/reviews')
  @ApiOperation({
    summary: 'Get provider reviews',
    description:
      'Retrieves all reviews for a specific seller including product and service reviews',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reviews',
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
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  getReviews(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QuerySellerReviewsDto,
  ): Promise<{
    data: Review[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    return this.service.getReviews(id, query);
  }

  /**
   * Get seller availability for a specific date.
   */
  @Get(':id/availability')
  @ApiOperation({
    summary: 'Get seller availability',
    description:
      'Check if a seller is available on a specific date and optionally a specific time slot',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability check result',
    type: SellerAvailabilityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  async getAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QuerySellerAvailabilityDto,
  ): Promise<SellerAvailabilityResponseDto> {
    return this.service.checkAvailability(id, query);
  }

  /**
   * Get seller by ID
   */
  @Get(':id(\\d+)')
  @ApiOperation({
    summary: 'Get seller by ID',
    description:
      'Get detailed information about a specific seller, including all related data',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Seller found',
    type: Seller,
    example: {
      id: 1,
      user_id: 1,
      store_name: 'Admin Store',
      store_description: 'Default store for admin user',
      store_logo_url: null,
      store_banner_url: null,
      business_registration_number: null,
      tax_id: null,
      bank_account_holder: null,
      bank_account_number: null,
      bank_name: null,
      is_verified: false,
      is_active: true,
      status: 'Active',
      total_sales: 0,
      total_reviews: 0,
      categories: [
        {
          id: 1,
          category_name: 'Electronics',
          slug: 'electronics',
          display_order: 0,
          parent_category_id: null,
          seller_id: 1,
        },
        {
          id: 2,
          category_name: 'Accessories',
          slug: 'accessories',
          display_order: 1,
          parent_category_id: null,
          seller_id: 1,
        },
      ],
      created_by: {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      },
      created_at: '2024-11-14T10:30:00Z',
      updated_by: {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      },
      updated_at: '2024-11-14T10:30:00Z',
      deleted_by: null,
      deleted_at: null,
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Seller> {
    return this.service.findById(id);
  }

  /**
   * Update a seller
   */
  @Put(':id')
  @Permissions({ SM05: 'Edit' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a seller (full replacement)',
    description: 'Updates an existing seller with the provided details',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Seller updated successfully',
    type: Seller,
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateSellerDto,
    @CurrentUser() currentUser: User,
  ): Promise<Seller> {
    return this.service.update(id, input, currentUser);
  }

  /**
   * Partially update a seller
   */
  @Patch(':id')
  @Permissions({ SM05: 'Edit' })
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  @ApiOperation({
    summary: 'Partially update a seller',
    description:
      'Partially updates an existing seller with the provided fields. Supports optional logo and banner file uploads.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        store_name: { type: 'string', example: 'Updated Store Name' },
        store_description: { type: 'string', example: 'Updated description' },
        business_registration_number: { type: 'string', nullable: true },
        tax_id: { type: 'string', nullable: true },
        bank_account_holder: { type: 'string', nullable: true },
        bank_account_number: { type: 'string', nullable: true },
        bank_name: { type: 'string', nullable: true },
        is_verified: { type: 'boolean' },
        is_active: { type: 'boolean' },
        status: { type: 'string', enum: ['Active', 'Cancelled', 'Hold'] },
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Store logo image file (optional)',
        },
        banner: {
          type: 'string',
          format: 'binary',
          description: 'Store banner image file (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Seller updated successfully',
    type: Seller,
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateSellerDto,
    @CurrentUser() currentUser: User,
    @UploadedFiles()
    files?: {
      logo?: Express.Multer.File[];
      banner?: Express.Multer.File[];
    },
  ): Promise<Seller> {
    const logoFile = files?.logo?.[0];
    const bannerFile = files?.banner?.[0];
    return this.service.patch(id, input, currentUser, logoFile, bannerFile);
  }

  /**
   * Delete a seller
   */
  @Delete(':id')
  @Permissions({ SM05: 'Delete' })
  @ApiOperation({
    summary: 'Delete a seller',
    description: 'Soft deletes a seller (marks as deleted)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Seller deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.service.delete(id, currentUser);
  }

  /**
   * Get pickup settings for a seller
   */
  @Get(':id/pickup-settings')
  @ApiOperation({
    summary: 'Get seller pickup settings',
    description:
      'Retrieves pickup configuration for a seller including address and store schedules',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Pickup settings retrieved successfully',
    type: PickupSettingsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  async getPickupSettings(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PickupSettingsResponseDto> {
    return await this.service.getPickupSettings(id);
  }

  /**
   * Update pickup settings for a seller
   */
  @Put(':id/pickup-settings')
  @Permissions({ SM05: 'Edit' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update seller pickup settings',
    description:
      'Updates pickup configuration for a seller. Validation: if pickup_enabled=true, pickup_address_id must be present and at least one seller_schedule must have status=Active',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Pickup settings updated successfully',
    type: PickupSettingsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async updatePickupSettings(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: PickupSettingsDto,
    @CurrentUser() currentUser: User,
  ): Promise<PickupSettingsResponseDto> {
    return await this.service.updatePickupSettings(id, input, currentUser);
  }

  /**
   * Get pickup availability for a seller
   */
  @Get(':id/pickup-availability')
  @ApiOperation({
    summary: 'Get seller pickup availability',
    description:
      'Get available pickup time slots for a seller on a specific date',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiQuery({
    name: 'date',
    type: String,
    example: '2024-12-25',
    description: 'Date to check availability (YYYY-MM-DD format)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Pickup availability retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - pickup not enabled or invalid date',
  })
  async getPickupAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
  ): Promise<PickupAvailabilityResponse> {
    return await this.pickupAvailabilityService.getAvailableSlots(id, date);
  }

  /**
   * Get pickup info for checkout display
   */
  @Get(':id/pickup-info')
  @ApiOperation({
    summary: 'Get seller pickup info for checkout',
    description:
      'Returns pickup address, store hours, and instructions for checkout display',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Pickup info retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        pickup_address: {
          type: 'object',
          example: {
            id: 123,
            address_line1: '123 Pickup St',
            city: 'Quezon City',
            state_province: 'Metro Manila',
            postal_code: '1100',
            country: 'Philippines',
          },
        },
        seller_schedules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day_of_week: { type: 'number' },
              start_time: { type: 'string' },
              end_time: { type: 'string' },
              status: { type: 'string' },
              break_start: { type: 'string' },
              break_end: { type: 'string' },
            },
          },
        },
        pickup_instructions: {
          type: 'string',
          example: 'Please arrive at the back entrance and ring the bell',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  async getPickupInfo(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const pickupSettings = await this.service.getPickupSettings(id);

    return {
      pickup_address: pickupSettings.pickup_address,
      seller_schedules: pickupSettings.seller_schedules,
      pickup_instructions: pickupSettings.pickup_instructions,
    };
  }
}
