import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { BaseSellerRepository } from '@/sellers/persistence/base-seller.repository';
import { Seller, SellerSubscription } from '@/sellers/domain/seller';
import {
  FeaturedSellerResponseDto,
  FeaturedProductDto,
  FeaturedServiceDto,
} from '@/sellers/dto/featured-seller-response.dto';
import { FindAllSeller } from '@/sellers/domain/find-all-seller';
import { SellerProfile, PortfolioItem } from '@/sellers/domain/seller-profile';
import { CreateSellerDto } from '@/sellers/dto/create-seller.dto';
import { UpdateSellerDto } from '@/sellers/dto/update-seller.dto';
import { QuerySellerDto } from '@/sellers/dto/query-seller.dto';
import { QuerySellerServicesDto } from '@/sellers/dto/query-seller-services.dto';
import { QuerySellerReviewsDto } from '@/sellers/dto/query-seller-reviews.dto';
import {
  QuerySellerAvailabilityDto,
  SellerAvailabilityResponseDto,
} from '@/sellers/dto/query-seller-availability.dto';
import {
  PickupSettingsDto,
  PickupSettingsResponseDto,
} from '@/sellers/dto/pickup-settings.dto';
import { User } from '@/users/domain/user';
import { UsersService } from '@/users/users.service';
import { UserAddressesService } from '@/user-addresses/user-addresses.service';
import { StorageService } from '@/storage/storage.service';
import { BaseServiceRepository } from '@/services/persistence/base-service.repository';
import { ReviewRepository } from '@/reviews/persistence/repositories/review.repository';
import { BaseSellerScheduleRepository } from '@/seller-schedules/persistence/base-seller-schedule.repository';
import { BaseStoreUnavailabilityRepository } from '@/store-unavailability/persistence/base-store-unavailability.repository';
import { BaseBookingRepository } from '@/bookings/persistence/base-booking.repository';
import { BaseSellerPortfolioRepository } from '@/seller-portfolio/persistence/base-seller-portfolio.repository';
import { Service } from '@/services/domain/service';
import { Review } from '@/reviews/domain/review';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { TagEntity } from '@/tags/persistence/entities/tag.entity';
import { AttributeEntity } from '@/attributes/persistence/entities/attribute.entity';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';
import { AllConfigType } from '@/config/config.type';

/**
 * Service for seller business logic
 */
@Injectable()
export class SellersService {
  constructor(
    private readonly repository: BaseSellerRepository,
    private readonly usersService: UsersService,
    private readonly userAddressesService: UserAddressesService,
    private readonly storageService: StorageService,
    private readonly serviceRepository: BaseServiceRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly sellerScheduleRepository: BaseSellerScheduleRepository,
    private readonly storeUnavailabilityRepository: BaseStoreUnavailabilityRepository,
    private readonly bookingRepository: BaseBookingRepository,
    private readonly portfolioRepository: BaseSellerPortfolioRepository,
    @InjectRepository(ProductEntity)
    private readonly productEntityRepository: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryEntityRepository: Repository<CategoryEntity>,
    @InjectRepository(TagEntity)
    private readonly tagEntityRepository: Repository<TagEntity>,
    @InjectRepository(AttributeEntity)
    private readonly attributeEntityRepository: Repository<AttributeEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionEntityRepository: Repository<SubscriptionEntity>,
    @InjectRepository(UserAddressEntity)
    private readonly userAddressEntityRepository: Repository<UserAddressEntity>,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  private async validateSellerDeletable(sellerId: number): Promise<void> {
    const publishedProductsCount = await this.productEntityRepository.count({
      where: {
        seller_id: sellerId,
        status: 'Published',
        deleted_at: IsNull(),
      },
    });
    const categoriesCount = await this.categoryEntityRepository.count({
      where: {
        seller_id: sellerId,
        deleted_at: IsNull(),
      },
    });
    const tagsCount = await this.tagEntityRepository.count({
      where: {
        seller_id: sellerId,
        deleted_at: IsNull(),
      },
    });
    const attributesCount = await this.attributeEntityRepository.count({
      where: {
        seller_id: sellerId,
        deleted_at: IsNull(),
      },
    });

    const errors: Record<string, string> = {};
    if (publishedProductsCount > 0) {
      errors.products = 'Seller has published products';
    }
    if (categoriesCount > 0) {
      errors.categories = 'Seller has categories';
    }
    if (tagsCount > 0) {
      errors.tags = 'Seller has tags';
    }
    if (attributesCount > 0) {
      errors.attributes = 'Seller has attributes';
    }
    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException({
        status: 422,
        errors,
      });
    }
  }

  /**
   * Create URL-friendly slug from store name
   */
  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  private ensureSlug(inputSlug: string | undefined, storeName: string): string {
    const base = inputSlug?.trim() || this.createSlug(storeName);
    return base.toLowerCase();
  }

  /**
   * Upload file to storage (MinIO/S3)
   */
  private async uploadFile(
    file: Express.Multer.File,
    storeName: string,
    fileType: 'logo' | 'banner',
  ): Promise<string> {
    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        `${fileType} must be an image file (jpg, png, etc.)`,
      );
    }

    // Validate file size using config
    const maxSizeBytes = this.configService.getOrThrow(
      'upload.storeFileMaxSizeBytes',
      { infer: true },
    );
    const maxSizeMB = this.configService.getOrThrow(
      'upload.storeFileMaxSizeMB',
      {
        infer: true,
      },
    );

    if (file.size > maxSizeBytes) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `File size exceeds maximum limit of ${maxSizeMB}MB. Your file is ${actualSizeMB}MB.`,
      );
    }

    // Create URL-friendly slug from store name
    const storeSlug = this.createSlug(storeName);

    // Generate file path
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    const fileName = `${fileType}-${timestamp}.${extension}`;
    const folderPath = `sellers/${storeSlug}`;
    const filePath = `${folderPath}/${fileName}`;

    // Upload to MinIO/S3
    const uploadResult = await this.storageService.put(file, filePath);

    // Return the storage key/path
    return uploadResult.key;
  }

  /**
   * Get upload configuration for store files (logo/banner)
   * Used by frontend to validate file size before upload
   */
  getUploadConfig(): { maxSizeMB: number; maxSizeBytes: number } {
    const maxSizeMB = this.configService.getOrThrow(
      'upload.storeFileMaxSizeMB',
      {
        infer: true,
      },
    );
    const maxSizeBytes = this.configService.getOrThrow(
      'upload.storeFileMaxSizeBytes',
      { infer: true },
    );
    return { maxSizeMB, maxSizeBytes };
  }

  /**
   * Create a new seller
   * Supports optional logo and banner file uploads
   */
  async create(
    input: CreateSellerDto,
    causer: User,
    logoFile?: Express.Multer.File,
    bannerFile?: Express.Multer.File,
  ): Promise<Seller> {
    await this.usersService.findById(input.user_id);
    const sellerWithSameUserId = await this.repository.findByUserId(
      input.user_id,
    );
    if (sellerWithSameUserId) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: {
          user_id: 'seller already exists for this user',
        },
      });
    }
    const slug = this.ensureSlug(input.slug, input.store_name);
    const duplicateSlug = await this.repository.findBySlug(slug);
    const duplicateStoreName = await this.repository.findByStoreName(
      input.store_name,
    );

    const errors: Record<string, string> = {};
    if (duplicateSlug) {
      errors.slug = 'slug already exists';
    }
    if (duplicateStoreName) {
      errors.store_name = 'store name already exists';
    }
    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException({
        status: 422,
        errors,
      });
    }

    // Upload logo if provided, otherwise accept URL string
    let logoUrl: string | null | undefined;
    if (logoFile) {
      console.log('📸 Uploading logo file:', logoFile.originalname);
      logoUrl = await this.uploadFile(logoFile, input.store_name, 'logo');
      console.log('✅ Logo uploaded to:', logoUrl);
    } else if (typeof input.store_logo_url === 'string') {
      logoUrl = this.extractStorageKeyFromUrl(input.store_logo_url);
    } else if (input.store_logo_url === null) {
      logoUrl = null;
    } else {
      console.log('ℹ️ No logo file provided');
    }

    // Upload banner if provided, otherwise accept URL string
    let bannerUrl: string | null | undefined;
    if (bannerFile) {
      console.log('🖼️ Uploading banner file:', bannerFile.originalname);
      bannerUrl = await this.uploadFile(bannerFile, input.store_name, 'banner');
      console.log('✅ Banner uploaded to:', bannerUrl);
    } else if (typeof input.store_banner_url === 'string') {
      bannerUrl = this.extractStorageKeyFromUrl(input.store_banner_url);
    } else if (input.store_banner_url === null) {
      bannerUrl = null;
    } else {
      console.log('ℹ️ No banner file provided');
    }

    // Prepare data from input; logo/banner fields may come from uploads or URL strings
    const inputData = { ...input };
    inputData.slug = slug;

    // Create new seller
    const seller = Object.assign(new Seller(), inputData, {
      is_verified: input.is_verified ?? false,
      is_active: input.is_active ?? true,
      sells_products: input.sells_products ?? true,
      sells_services: input.sells_services ?? false,
      auto_accept_bookings: input.auto_accept_bookings ?? false,
      bio: input.bio ?? null,
      years_of_experience: input.years_of_experience ?? null,
      hourly_rate: input.hourly_rate ?? 0,
      average_rating: 0,
      total_services: 0,
      total_completed_bookings: 0,
      total_sales: 0,
      total_reviews: 0,
      created_by: causer,
      updated_by: causer,
      ...(logoUrl !== undefined && { store_logo_url: logoUrl }),
      ...(bannerUrl !== undefined && { store_banner_url: bannerUrl }),
    });
    // console.log('📝 Creating seller with data:', {
    //   store_name: seller.store_name,
    //   store_logo_url: seller.store_logo_url,
    //   store_banner_url: seller.store_banner_url,
    // });
    return this.repository.create(seller);
  }

  /**
   * Get all sellers with pagination and filters
   * Includes subscription data for each seller
   */
  async findAll(query: QuerySellerDto): Promise<FindAllSeller> {
    const result = await this.repository.findAll(query);

    // Get unique user IDs from the sellers
    const userIds = result.data.map((seller) => seller.user_id);

    // Fetch active subscriptions for all seller users in a single query
    const subscriptions = await this.subscriptionEntityRepository.find({
      where: {
        user_id: In(userIds),
        status: In([
          SubscriptionStatusEnum.ACTIVE,
          SubscriptionStatusEnum.PENDING_PAYMENT,
        ]),
      },
      relations: ['plan'],
    });

    // Create a map of user_id to subscription
    const subscriptionMap = new Map<number, SellerSubscription>();
    for (const sub of subscriptions) {
      // Prefer active subscriptions over pending_payment
      const existing = subscriptionMap.get(sub.user_id);
      if (
        !existing ||
        (sub.status === SubscriptionStatusEnum.ACTIVE &&
          existing.status !== SubscriptionStatusEnum.ACTIVE)
      ) {
        subscriptionMap.set(sub.user_id, {
          id: sub.id,
          plan_id: sub.plan_id,
          plan: sub.plan
            ? {
                id: sub.plan.id,
                plan_name: sub.plan.plan_name,
                plan_code: sub.plan.plan_code,
                price: sub.plan.price,
                billing_cycle: sub.plan.billing_cycle,
              }
            : undefined,
          subscription_number: sub.subscription_number,
          status: sub.status,
          start_date: sub.start_date,
          end_date: sub.end_date,
          next_billing_date: sub.next_billing_date,
          auto_renew: sub.auto_renew,
        });
      }
    }

    // Attach subscriptions to sellers
    const sellersWithSubscriptions = result.data.map((seller) => ({
      ...seller,
      subscription: subscriptionMap.get(seller.user_id) ?? null,
    }));

    return {
      ...result,
      data: sellersWithSubscriptions,
    };
  }

  /**
   * Get all featured sellers (is_featured=true, is_active=true, is_verified=true)
   * Used by the public featured endpoint — no pagination
   */
  async getFeatured(): Promise<FeaturedSellerResponseDto[]> {
    const sellers = await this.repository.findFeatured();

    if (sellers.length === 0) {
      return [];
    }

    return Promise.all(
      sellers.map(async (seller) => {
        const dto = new FeaturedSellerResponseDto();
        dto.id = seller.id;
        dto.store_name = seller.store_name;
        dto.store_logo_url = seller.store_logo_url ?? null;
        dto.store_description = seller.store_description ?? null;
        dto.sells_products = seller.sells_products;
        dto.sells_services = seller.sells_services;
        dto.pickup_address = seller.pickup_address ?? null;
        dto.pickup_city = seller.pickup_city ?? null;
        dto.pickup_province = seller.pickup_province ?? null;
        dto.pickup_postal_code = seller.pickup_postal_code ?? null;
        dto.contact = seller.contact ?? null;
        dto.email = seller.email ?? null;
        dto.website = seller.website ?? null;

        if (seller.sells_products) {
          const [products, productCount] = await Promise.all([
            this.productEntityRepository.find({
              where: {
                seller_id: seller.id,
                status: 'Published',
                deleted_at: IsNull(),
              },
              order: { created_at: 'DESC' },
              take: 5,
              select: { id: true, product_name: true },
            }),
            this.productEntityRepository.count({
              where: {
                seller_id: seller.id,
                status: 'Published',
                deleted_at: IsNull(),
              },
            }),
          ]);
          dto.product_count = productCount;
          dto.products = products.map(
            (p): FeaturedProductDto => ({
              id: p.id,
              product_name: p.product_name,
            }),
          );
        }

        if (seller.sells_services) {
          const { data, totalCount } = await this.serviceRepository.findAll({
            seller_id: seller.id,
            take: 5,
            skip: 0,
          });
          dto.service_count = totalCount;
          dto.services = data.map(
            (s): FeaturedServiceDto => ({ id: s.id, title: s.title }),
          );
        }

        return dto;
      }),
    );
  }

  /**
   * Get a seller by ID
   */
  async findById(id: number): Promise<Seller> {
    const seller = await this.repository.findById(id);
    if (!seller) {
      throw new NotFoundException(`Seller with id ${id} not found`);
    }
    return seller;
  }

  /**
   * If a seller has no service_location_address_id yet, link their first user
   * address so the mobile walk-in map has coordinates to display.
   */
  async autoLinkWalkInAddress(sellerId: number): Promise<void> {
    const seller = await this.findById(sellerId);
    if (seller.service_location_address_id != null) return;
    if (!seller.user_id) return;
    const address = await this.userAddressEntityRepository.findOne({
      where: { user_id: seller.user_id },
      order: { id: 'ASC' },
    });
    if (!address) return;
    const partial = new Seller();
    partial.service_location_address_id = address.id;
    await this.repository.update(sellerId, partial);
  }

  /**
   * Get a seller by user ID
   */
  async findByUserId(userId: number): Promise<Seller | null> {
    return this.repository.findByUserId(userId);
  }

  async findBySlug(slug: string): Promise<Seller | null> {
    return this.repository.findBySlug(slug);
  }

  /**
   * Extract storage key from a full URL
   */
  private extractStorageKeyFromUrl(url: string): string {
    const bucket =
      process.env.AWS_DEFAULT_S3_BUCKET || 'store-media';
    // If it's not a full URL, return as-is (it's already a storage key)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return url;
    }

    // Extract storage key from full URL
    // Format: http://endpoint/bucket/key
    const urlPattern = new RegExp(
      `^https?://[^/]+/${bucket.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(.+)$`,
    );
    const match = url.match(urlPattern);
    if (match && match[1]) {
      // Decode the path segments
      return decodeURIComponent(match[1]);
    }

    // Try to extract from common patterns
    const parts = url.split('/');
    const bucketIndex = parts.findIndex((part) => part === bucket);
    if (bucketIndex !== -1 && bucketIndex < parts.length - 1) {
      return parts.slice(bucketIndex + 1).join('/');
    }

    // If we can't extract, return the original (might be a different URL format)
    return url;
  }

  /**
   * Partially update a seller with optional file uploads or URL strings
   */
  async patch(
    id: number,
    input: UpdateSellerDto,
    causer: User,
    logoFile?: Express.Multer.File,
    bannerFile?: Express.Multer.File,
  ): Promise<Seller> {
    const existingSeller = await this.findById(id);

    // Enforce bank dependency even if validation is bypassed
    if (
      !input.bank_name &&
      (input.bank_account_number || input.bank_account_holder)
    ) {
      throw new BadRequestException(
        'Bank name is required when providing bank account number or holder',
      );
    }

    // Handle logo: can be file upload OR URL string
    let logoUrl: string | undefined;
    if (logoFile) {
      // File upload
      console.log('📸 Uploading logo file:', logoFile.originalname);
      logoUrl = await this.uploadFile(
        logoFile,
        input.store_name ?? existingSeller.store_name,
        'logo',
      );
      console.log('✅ Logo uploaded to:', logoUrl);
      // Delete old logo if it exists
      if (existingSeller.store_logo_url) {
        try {
          await this.storageService.delete(existingSeller.store_logo_url);
          console.log('🗑️ Deleted old logo:', existingSeller.store_logo_url);
        } catch (error) {
          console.error('Failed to delete old logo:', error);
        }
      }
    } else if (
      input.store_logo_url &&
      typeof input.store_logo_url === 'string'
    ) {
      // URL string provided - extract storage key from URL
      logoUrl = this.extractStorageKeyFromUrl(input.store_logo_url);
      console.log('📸 Logo URL provided, extracted storage key:', logoUrl);
    }

    // Handle banner: can be file upload OR URL string
    let bannerUrl: string | undefined;
    if (bannerFile) {
      // File upload
      console.log('🖼️ Uploading banner file:', bannerFile.originalname);
      bannerUrl = await this.uploadFile(
        bannerFile,
        input.store_name ?? existingSeller.store_name,
        'banner',
      );
      console.log('✅ Banner uploaded to:', bannerUrl);
      // Delete old banner if it exists
      if (existingSeller.store_banner_url) {
        try {
          await this.storageService.delete(existingSeller.store_banner_url);
          console.log(
            '🗑️ Deleted old banner:',
            existingSeller.store_banner_url,
          );
        } catch (error) {
          console.error('Failed to delete old banner:', error);
        }
      }
    } else if (
      input.store_banner_url &&
      typeof input.store_banner_url === 'string'
    ) {
      // URL string provided - extract storage key from URL
      bannerUrl = this.extractStorageKeyFromUrl(input.store_banner_url);
      console.log('🖼️ Banner URL provided, extracted storage key:', bannerUrl);
    }

    // Treat empty bank account number as null to clear existing value
    if (
      input.hasOwnProperty('bank_account_number') &&
      input.bank_account_number === ''
    ) {
      input.bank_account_number = null;
    }

    // Prepare data without URL fields and file fields from input (we'll set them from uploads/URLs)
    const inputData = { ...input };
    delete inputData.store_logo_url;
    delete inputData.store_banner_url;

    const partialSeller: Partial<Seller> = new Seller();
    Object.assign(partialSeller, inputData, {
      updated_by: causer,
      // Set logo/banner URLs if provided (either from file upload or URL string)
      ...(logoUrl && { store_logo_url: logoUrl }),
      ...(bannerUrl && { store_banner_url: bannerUrl }),
    });
    return this.repository.update(id, partialSeller);
  }

  /**
   * Update a seller
   */
  async update(
    id: number,
    input: UpdateSellerDto,
    causer: User,
  ): Promise<Seller> {
    const existingSeller = await this.findById(id);

    // Enforce bank dependency even if validation is bypassed
    if (
      !input.bank_name &&
      (input.bank_account_number || input.bank_account_holder)
    ) {
      throw new BadRequestException(
        'Bank name is required when providing bank account number or holder',
      );
    }

    if (input.slug || input.store_name) {
      const newSlug = this.ensureSlug(
        input.slug,
        input.store_name ?? existingSeller.store_name,
      );
      const duplicate = await this.repository.findBySlug(newSlug);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Seller slug already exists');
      }
      input.slug = newSlug;
    }

    // Check if logo is being explicitly removed (set to null or empty string)
    if (
      input.hasOwnProperty('store_logo_url') &&
      (input.store_logo_url === null || input.store_logo_url === '') &&
      existingSeller.store_logo_url
    ) {
      try {
        await this.storageService.delete(existingSeller.store_logo_url);
        console.log(
          '🗑️ Deleted logo from storage:',
          existingSeller.store_logo_url,
        );
      } catch (error) {
        console.error('Failed to delete logo from storage:', error);
      }
    }

    // Check if banner is being explicitly removed (set to null or empty string)
    if (
      input.hasOwnProperty('store_banner_url') &&
      (input.store_banner_url === null || input.store_banner_url === '') &&
      existingSeller.store_banner_url
    ) {
      try {
        await this.storageService.delete(existingSeller.store_banner_url);
        console.log(
          '🗑️ Deleted banner from storage:',
          existingSeller.store_banner_url,
        );
      } catch (error) {
        console.error('Failed to delete banner from storage:', error);
      }
    }

    // Treat empty bank account number as null to clear existing value
    if (
      input.hasOwnProperty('bank_account_number') &&
      input.bank_account_number === ''
    ) {
      input.bank_account_number = null;
    }

    const partialSeller: Partial<Seller> = new Seller();
    Object.assign(partialSeller, input, {
      updated_by: causer,
    });
    return this.repository.update(id, partialSeller);
  }

  /**
   * Delete a seller
   */
  async delete(id: number, causer: User): Promise<void> {
    const seller = await this.findById(id);
    await this.validateSellerDeletable(seller.id);
    const partialSeller: Partial<Seller> = new Seller();
    Object.assign(partialSeller, {
      deleted_by: causer,
    });
    await this.repository.update(id, partialSeller);
    await this.repository.remove(id);
  }

  async bulkDelete(ids: number[], causer: User): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }
    for (const id of ids) {
      const seller = await this.findById(id);
      await this.validateSellerDeletable(seller.id);
    }
    for (const id of ids) {
      await this.delete(id, causer);
    }
  }

  /**
   * Get public profile of a seller/service provider
   *
   * @param id - Seller ID
   * @returns Public provider profile
   */
  async getProfile(id: number): Promise<SellerProfile> {
    const seller = await this.findById(id);

    const profile: SellerProfile = {
      id: seller.id,
      name: seller.store_name,
      slug: seller.slug,
      avatar: seller.store_logo_url || null,
      cover_image: seller.store_banner_url || null,
      bio: seller.bio || seller.store_description || null,
      years_of_experience: seller.years_of_experience || null,
      average_rating: seller.average_rating || 0,
      total_reviews: seller.total_reviews || 0,
      total_services: seller.total_services || 0,
      total_completed_bookings: seller.total_completed_bookings || 0,
      is_verified: seller.is_verified || false,
      sells_services: seller.sells_services || false,
      sells_products: seller.sells_products || true,
      hourly_rate: seller.hourly_rate || 0,
      business_type: seller.business_type || null,
      member_since: seller.created_at,
    };

    return profile;
  }

  /**
   * Get services offered by a seller
   *
   * @param id - Seller ID
   * @param query - Query parameters
   * @returns List of services with total count
   */
  async getServices(
    id: number,
    query: QuerySellerServicesDto,
  ): Promise<{ data: Service[]; totalCount: number }> {
    // Validate seller exists
    await this.findById(id);

    // Query services using the service repository
    return this.serviceRepository.findAll({
      seller_id: id,
      skip: query.skip,
      take: query.take,
      search: query.search,
      status: query.status,
      category_id: query.category_id,
    });
  }

  /**
   * Get portfolio items for a seller
   *
   * Note: Portfolio table doesn't exist yet, returning empty array
   * This will be populated once seller_portfolio table is created
   *
   * @param id - Seller ID
   * @returns List of portfolio items
   */
  async getPortfolio(
    id: number,
  ): Promise<{ data: PortfolioItem[]; totalCount: number }> {
    // Validate seller exists
    await this.findById(id);

    // Query portfolio items for this seller
    const result = await this.portfolioRepository.findAll({
      seller_id: id,
      status: 'Active',
    });

    // Map to PortfolioItem interface
    const portfolioItems: PortfolioItem[] = result.data.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description ?? undefined,
      image_url: item.image_url,
      project_url: item.project_url ?? undefined,
      display_order: item.display_order ?? 0,
    }));

    return {
      data: portfolioItems,
      totalCount: result.totalCount,
    };
  }

  /**
   * Get reviews for a seller
   *
   * @param id - Seller ID
   * @param query - Query parameters
   * @returns List of reviews with total count
   */
  async getReviews(
    id: number,
    query: QuerySellerReviewsDto,
  ): Promise<{
    data: Review[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    // Validate seller exists
    await this.findById(id);

    // Query reviews using the review repository
    return this.reviewRepository.findAll({
      seller_id: id,
      skip: query.skip ?? 0,
      take: query.take ?? 20,
      rating: query.min_rating,
      status: 'Active',
    });
  }

  /**
   * Check seller availability for a specific date and time slot.
   *
   * @param sellerId - Seller ID
   * @param query - Availability query parameters
   * @returns Availability response
   */
  async checkAvailability(
    sellerId: number,
    query: QuerySellerAvailabilityDto,
  ): Promise<SellerAvailabilityResponseDto> {
    // Validate seller exists
    await this.findById(sellerId);

    const dayOfWeek = new Date(query.date).getDay();

    // Get seller schedule for the day
    const schedule = await this.sellerScheduleRepository.findBySellerAndDay(
      sellerId,
      dayOfWeek,
    );

    if (!schedule || schedule.status !== 'Active') {
      return {
        is_available: false,
        date: query.date,
        reason: 'No schedule available for this day',
      };
    }

    // Check if requested time is within schedule
    const startTimeMinutes = this.timeToMinutes(query.start_time);
    const endTimeMinutes = this.timeToMinutes(query.end_time);
    const scheduleStartMinutes = this.timeToMinutes(
      schedule.start_time || '00:00',
    );
    const scheduleEndMinutes = this.timeToMinutes(schedule.end_time || '23:59');

    if (
      startTimeMinutes < scheduleStartMinutes ||
      endTimeMinutes > scheduleEndMinutes
    ) {
      return {
        is_available: false,
        date: query.date,
        reason: 'Requested time is outside business hours',
      };
    }

    // Check for break time conflicts
    if (schedule.break_start && schedule.break_end) {
      const breakStartMinutes = this.timeToMinutes(schedule.break_start);
      const breakEndMinutes = this.timeToMinutes(schedule.break_end);

      if (
        (startTimeMinutes >= breakStartMinutes &&
          startTimeMinutes < breakEndMinutes) ||
        (endTimeMinutes > breakStartMinutes &&
          endTimeMinutes <= breakEndMinutes) ||
        (startTimeMinutes <= breakStartMinutes &&
          endTimeMinutes >= breakEndMinutes)
      ) {
        return {
          is_available: false,
          date: query.date,
          reason: 'Requested time conflicts with break time',
        };
      }
    }

    // Check for store unavailability blocks
    const unavailabilityBlocks =
      await this.storeUnavailabilityRepository.findOverlapsForWindow({
        seller_id: sellerId,
        date: query.date,
        start_time: query.start_time,
        end_time: query.end_time,
      });

    if (unavailabilityBlocks && unavailabilityBlocks.length > 0) {
      return {
        is_available: false,
        date: query.date,
        reason:
          unavailabilityBlocks[0].reason ||
          'Seller is unavailable at this time',
      };
    }

    // Check for existing bookings (skip if method throws error)
    try {
      const overlappingBookings =
        await this.bookingRepository.findOverlappingBookings({
          seller_id: sellerId,
          date: query.date,
          start_time: query.start_time,
          end_time: query.end_time,
        });

      if (overlappingBookings && overlappingBookings.length > 0) {
        return {
          is_available: false,
          date: query.date,
          reason: 'Time slot is already booked',
        };
      }
    } catch {
      // Booking overlap check failed, continue without it
    }

    return {
      is_available: true,
      date: query.date,
      schedule: {
        start_time: schedule.start_time || '',
        end_time: schedule.end_time || '',
        break_start: schedule.break_start || undefined,
        break_end: schedule.break_end || undefined,
      },
    };
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((v) => Number(v));
    return hours * 60 + minutes;
  }

  /**
   * Get pickup settings for a seller
   */
  async getPickupSettings(
    sellerId: number,
  ): Promise<PickupSettingsResponseDto> {
    const seller = await this.repository.findById(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Get pickup address if set
    let pickupAddress: any = null;
    if (seller.pickup_address_id) {
      pickupAddress = await this.userAddressEntityRepository.findOne({
        where: { id: seller.pickup_address_id },
      });
    }

    // Get seller schedules for all 7 days using findAll
    const sellerSchedulesResult = await this.sellerScheduleRepository.findAll({
      seller_id: sellerId,
    });
    const sellerSchedules = sellerSchedulesResult.data;

    return {
      pickup_enabled: seller.pickup_enabled,
      pickup_address_id: seller.pickup_address_id ?? null,
      pickup_preparation_time: seller.pickup_preparation_time ?? 30,
      pickup_max_concurrent_orders: seller.pickup_max_concurrent_orders ?? 10,
      pickup_instructions: seller.pickup_instructions ?? null,
      pickup_grace_period: seller.pickup_grace_period ?? 120,
      pickup_address: pickupAddress,
      seller_schedules: sellerSchedules,
    };
  }

  /**
   * Update pickup settings for a seller
   */
  async updatePickupSettings(
    sellerId: number,
    input: PickupSettingsDto,
    currentUser: User,
  ): Promise<PickupSettingsResponseDto> {
    const seller = await this.repository.findById(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Validation: if pickup_enabled=true, pickup_address_id must be present
    if (input.pickup_enabled && !input.pickup_address_id) {
      throw new BadRequestException(
        'Pickup address is required when pickup is enabled',
      );
    }

    // Validation: at least one seller_schedule must have status='Active' when pickup is enabled
    if (input.pickup_enabled) {
      const activeSchedulesResult = await this.sellerScheduleRepository.findAll(
        {
          seller_id: sellerId,
        },
      );
      const hasActiveSchedule = activeSchedulesResult.data.some(
        (schedule) => schedule.status === 'Active',
      );

      if (!hasActiveSchedule) {
        throw new BadRequestException(
          'At least one active store schedule is required when pickup is enabled',
        );
      }
    }

    // Update seller pickup settings
    // pickup_address_id is optional — if not sent, keep the existing value
    await this.repository.update(sellerId, {
      pickup_enabled: input.pickup_enabled,
      ...(input.pickup_address_id !== undefined && {
        pickup_address_id: input.pickup_address_id,
      }),
      pickup_preparation_time: input.pickup_preparation_time,
      pickup_max_concurrent_orders: input.pickup_max_concurrent_orders,
      pickup_instructions: input.pickup_instructions ?? null,
      pickup_grace_period: input.pickup_grace_period,
      updated_by: currentUser,
    });

    // Return updated settings
    return this.getPickupSettings(sellerId);
  }
}
