import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Brackets, EntityManager, In, IsNull, QueryRunner, Repository } from 'typeorm';
import type { AllConfigType } from '@/config/config.type';
import { VoucherQrTokenEntity } from '@/vouchers/persistence/entities/voucher-qr-token.entity';
import { GenerateQrTokenResponseDto } from '@/vouchers/dto/generate-qr-token-response.dto';
import { ScanVoucherDto } from '@/vouchers/dto/scan-voucher.dto';
import { RedeemOnsiteDto } from '@/vouchers/dto/redeem-onsite.dto';
import { BaseVoucherRepository } from '@/vouchers/persistence/base-voucher.repository';
import { QueryAdminVoucherDto } from '@/vouchers/dto/query-admin-voucher.dto';
import { FindAllVoucher } from '@/vouchers/domain/find-all-voucher';
import { Voucher } from '@/vouchers/domain/voucher';
import { CreateAdminVoucherDto } from '@/vouchers/dto/create-admin-voucher.dto';
import { CreateSellerVoucherDto } from '@/vouchers/dto/create-seller-voucher.dto';
import { CollectVoucherByCodeDto } from '@/vouchers/dto/collect-voucher-by-code.dto';
import { QuerySellerVoucherDto } from '@/vouchers/dto/query-seller-voucher.dto';
import {
  parseScopeParam,
  QueryVoucherDto,
} from '@/vouchers/dto/query-voucher.dto';
import { UpdateAdminVoucherDto } from '@/vouchers/dto/update-admin-voucher.dto';
import { UpdateSellerVoucherDto } from '@/vouchers/dto/update-seller-voucher.dto';
import { GiftVoucherToUsersDto } from '@/vouchers/dto/gift-voucher-to-users.dto';
import { ValidateVoucherDto } from '@/vouchers/dto/validate-voucher.dto';
import { VoucherValidationResult } from '@/vouchers/domain/voucher-validation-result';
import { User } from '@/users/domain/user';
import { VoucherDiscountTypeEnum } from '@/vouchers/enums/voucher-discount-type.enum';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';
import { VoucherStatusEnum } from '@/vouchers/enums/voucher-status.enum';
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { UserVoucherStatusEnum } from '@/vouchers/enums/user-voucher-status.enum';
import { VoucherRedemption } from '@/voucher-redemptions/domain/voucher-redemption';
import { VoucherRedemptionEntity } from '@/voucher-redemptions/persistence/entities/voucher-redemption.entity';
import { UserVoucher } from '@/vouchers/domain/user-voucher';
import { QueryMyVouchersDto } from '@/vouchers/dto/query-my-vouchers.dto';
import { VoucherCategoryEntity } from '@/voucher-categories/persistence/entities/voucher-category.entity';
import { VoucherProductEntity } from '@/voucher-products/persistence/entities/voucher-product.entity';
import { VoucherServiceCategoryEntity } from '@/voucher-service-categories/persistence/entities/voucher-service-category.entity';
import { VoucherServiceEntity } from '@/voucher-services/persistence/entities/voucher-service.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { ShoppingCartEntity } from '@/shopping-carts/persistence/entities/shopping-cart.entity';
import { ShoppingCartItemEntity } from '@/shopping-carts/persistence/entities/shopping-cart-item.entity';
import { VoucherGiftLogEntity } from '@/vouchers/persistence/entities/voucher-gift-log.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { GroupedUserVoucher } from './domain/grouped-user-voucher';

type RecordVoucherRedemptionInput = {
  voucherId: number;
  userId: number;
  orderSubtotal: number;
  discountAmount: number;
  voucherCode?: string;
  salesOrderId?: number | null;
  bookingId?: number | null;
  userVoucherId?: number;
  sellerId?: number | null;
};

type ApplyVoucherDiscountInput = {
  code: string;
  userId: number;
  applicableSubtotal: number;
  sellerId?: number;
  categoryIds?: number[];
  productIds?: number[];
  serviceCategoryIds?: number[];
  serviceIds?: number[];
};

type VoucherEligibilityResult = {
  is_elligible: boolean;
  voucher_id: number;
  message: string;
  voucher?: Voucher;
};

type ApplyStackedVoucherDiscountsInput = {
  codes: string[];
  userId: number;
  applicableSubtotal: number;
  /** Total price of selected add-ons. When a voucher has include_addons_flag=false
   *  the discount is computed on (applicableSubtotal - addons_total) only. */
  addons_total?: number;
  /** Number of booked slots/hours (venue). Used by per_hours discount type. */
  numSlots?: number;
  sellerId?: number;
  categoryIds?: number[];
  productIds?: number[];
  serviceCategoryIds?: number[];
  serviceIds?: number[];
  allowDuplicateCodes?: boolean;
  /** Forwarded from getApplicableVouchersForBooking / previewBookingDiscount
   *  so per_hours venue validation is consistent across all call sites. */
  serviceType?: string;
};

type AppliedVoucherDiscount = {
  voucherId: number;
  voucherCode: string;
  discountAmount: number;
  includeAddons: boolean;
};

type ValidateSingleVoucherInput = {
  code: string;
  applicable_subtotal: number;
  /** Full booking subtotal before any discounts are applied.
   *  Used by per_hours discount type to derive the correct per-slot base amount. */
  original_subtotal?: number;
  /** Number of booked slots/hours. Used with per_hours discount type. */
  num_slots?: number;
  shipping_fee?: number;
  seller_id?: number;
  category_ids?: number[];
  product_ids?: number[];
  service_category_ids?: number[];
  service_ids?: number[];
  checkout_variants?: VoucherValidationCheckoutVariantContext[];
  /** Service type of the booked service (e.g. 'venue', 'standard'). Used to enforce
   *  venue-only restrictions on per_hours vouchers without a pivot-table lookup. */
  service_type?: string;
  /** Total price of selected add-ons. Used with include_addons_flag to compute
   *  the correct discount base when add-ons are excluded from the voucher. */
  addons_total?: number;
};

type VoucherRestrictionIdSets = {
  categoryIdsByVoucherId: Map<number, Set<number>>;
  productIdsByVoucherId: Map<number, Set<number>>;
  serviceCategoryIdsByVoucherId: Map<number, Set<number>>;
  serviceIdsByVoucherId: Map<number, Set<number>>;
};

type VoucherValidationCheckoutVariant = {
  variant_id: number;
  quantity: number;
};

type VoucherValidationCheckoutVariantContext = {
  variant_id: number;
  product_id: number;
  quantity: number;
  selling_price: number;
  category_ids: number[];
};

type VoucherValidationCheckoutContext = {
  applicableSubtotal: number;
  shippingFee: number;
  productIds: number[];
  categoryIds: number[];
  sellerId?: number;
  serviceCategoryIds: number[];
  serviceIds: number[];
  checkoutVariants: VoucherValidationCheckoutVariantContext[];
};

type AppliedVoucherValidation = {
  is_valid: boolean;
  voucher_id: number;
  voucher_code: string;
  discount_amount: number;
  remaining_subtotal: number;
};

type PrioritizedVoucherValidationCandidate = {
  code: string;
  voucher: Voucher;
  discountAmount: number;
};

type RecordStackedVoucherRedemptionsInput = {
  userId: number;
  salesOrderId?: number;
  bookingId?: number;
  vouchers: Array<{
    voucherId: number;
    voucherCode: string;
    orderSubtotal: number;
    discountAmount: number;
  }>;
};

type CreateSellerVoucherRestrictionLinksInput = {
  voucherId: number;
  sellerId: number;
  scope:
    | VoucherScopeEnum.PRODUCTS
    | VoucherScopeEnum.CATEGORIES
    | VoucherScopeEnum.SERVICES
    | VoucherScopeEnum.SERVICE_CATEGORIES;
  productIds?: number[];
  categoryIds?: number[];
  serviceIds?: number[];
  serviceCategoryIds?: number[];
};

type UpdateSellerVoucherRestrictionLinksInput = {
  voucherId: number;
  sellerId: number;
  scope:
    | VoucherScopeEnum.PRODUCTS
    | VoucherScopeEnum.CATEGORIES
    | VoucherScopeEnum.SERVICES
    | VoucherScopeEnum.SERVICE_CATEGORIES;
  productIds?: number[];
  categoryIds?: number[];
  serviceIds?: number[];
  serviceCategoryIds?: number[];
  hasProductIdsInInput: boolean;
  hasCategoryIdsInInput: boolean;
  hasServiceIdsInInput: boolean;
  hasServiceCategoryIdsInInput: boolean;
  hasScopeInInput: boolean;
};

type UpdateAdminVoucherRestrictionLinksInput = {
  voucherId: number;
  scope: VoucherScopeEnum;
  categoryIds?: number[];
  productIds?: number[];
  serviceIds?: number[];
  serviceCategoryIds?: number[];
  hasCategoryIdsInInput: boolean;
  hasProductIdsInInput: boolean;
  hasServiceIdsInInput: boolean;
  hasServiceCategoryIdsInInput: boolean;
  hasScopeInInput: boolean;
};

/**
 * Handles voucher management, validation, and discount application logic.
 */
@Injectable()
export class VouchersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly voucherRepository: BaseVoucherRepository,
    @InjectRepository(VoucherEntity)
    private readonly voucherEntityRepository: Repository<VoucherEntity>,
    @InjectRepository(UserVoucherEntity)
    private readonly userVoucherRepository: Repository<UserVoucherEntity>,
    @InjectRepository(VoucherQrTokenEntity)
    private readonly voucherQrTokenRepository: Repository<VoucherQrTokenEntity>,
    @InjectRepository(VoucherRedemptionEntity)
    private readonly voucherRedemptionRepository: Repository<VoucherRedemptionEntity>,
    @InjectRepository(VoucherCategoryEntity)
    private readonly voucherCategoryRepository: Repository<VoucherCategoryEntity>,
    @InjectRepository(VoucherProductEntity)
    private readonly voucherProductRepository: Repository<VoucherProductEntity>,
    @InjectRepository(VoucherServiceCategoryEntity)
    private readonly voucherServiceCategoryRepository: Repository<VoucherServiceCategoryEntity>,
    @InjectRepository(VoucherServiceEntity)
    private readonly voucherServiceRepository: Repository<VoucherServiceEntity>,
    @InjectRepository(SalesOrderVoucherEntity)
    private readonly salesOrderVoucherRepository: Repository<SalesOrderVoucherEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly productVariantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(ProductCategoryEntity)
    private readonly productCategoryRepository: Repository<ProductCategoryEntity>,
    @InjectRepository(ServiceEntity)
    private readonly serviceEntityRepository: Repository<ServiceEntity>,
    @InjectRepository(ServiceCategoryEntity)
    private readonly serviceCategoryEntityRepository: Repository<ServiceCategoryEntity>,
    @InjectRepository(ShoppingCartEntity)
    private readonly shoppingCartRepository: Repository<ShoppingCartEntity>,
    @InjectRepository(ShoppingCartItemEntity)
    private readonly shoppingCartItemRepository: Repository<ShoppingCartItemEntity>,
    @InjectRepository(VoucherGiftLogEntity)
    private readonly voucherGiftLogRepository: Repository<VoucherGiftLogEntity>,
  ) {}
  /**
   * Creates an admin voucher.
   */
  public async createGlobalVoucher(
    input: CreateAdminVoucherDto,
    causer: User,
  ): Promise<Voucher> {
    if (!causer.system_admin) {
      throw new ForbiddenException('Only admins can create admin vouchers');
    }
    const normalizedCode: string = this.normalizeCode(input.code);
    await this.ensureVoucherCodeIsUnique(normalizedCode);
    this.ensureVoucherDatesAreValid(input.starts_at, input.expires_at);
    this.ensureVoucherDiscountShapeIsValid(
      input.discount_type,
      input.max_discount_cap,
    );
    this.ensureAdminRestrictionPayloadIsValid(input);
    const resolvedScope = input.scope ?? VoucherScopeEnum.CATEGORIES;
    this.ensureIncludeAddonsFlagIsValid(
      resolvedScope,
      input.include_addons_flag,
    );
    await this.ensurePerHoursVoucherIsValid(
      input.discount_type,
      resolvedScope,
      input.service_ids ??
        (input.service_id != null ? [input.service_id] : undefined),
    );
    const voucher: Voucher = Object.assign(new Voucher(), {
      code: normalizedCode,
      scope: resolvedScope,
      seller_id: null,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      max_discount_cap:
        input.discount_type === VoucherDiscountTypeEnum.PERCENTAGE
          ? (input.max_discount_cap ?? null)
          : null,
      min_order_amount: input.min_order_amount ?? 0,
      total_limit: input.total_limit ?? null,
      per_user_limit: input.per_user_limit ?? 1,
      used_count: 0,
      starts_at: input.starts_at ? new Date(input.starts_at) : null,
      expires_at: input.expires_at ? new Date(input.expires_at) : null,
      status: input.status ?? VoucherStatusEnum.ACTIVE,
      is_claimable: input.is_claimable ?? false,
      description: input.description ?? null,
      terms_and_conditions: input.terms_and_conditions ?? null,
      include_addons_flag: this.resolveIncludeAddonsFlag(
        resolvedScope,
        input.include_addons_flag,
      ),
      created_by: causer,
      updated_by: causer,
    });
    const createdVoucher: Voucher =
      await this.voucherRepository.create(voucher);
    await this.createAdminVoucherRestrictionLinks({
      voucherId: createdVoucher.id,
      scope: resolvedScope,
      categoryIds: input.category_ids,
      productIds: input.product_ids,
      serviceIds:
        input.service_ids ??
        (input.service_id != null ? [input.service_id] : undefined),
      serviceCategoryIds: input.service_category_ids,
    });
    return createdVoucher;
  }
  /**
   * Creates a seller-scoped voucher.
   */
  public async createSellerVoucher(
    input: CreateSellerVoucherDto,
    causer: User,
  ): Promise<Voucher> {
    if (!causer.seller_id) {
      throw new ForbiddenException('Only sellers can create seller vouchers');
    }
    const sellerId: number = causer.seller_id;
    this.ensureSellerRestrictionPayloadIsValid(input);
    const normalizedCode: string = this.normalizeCode(input.code);
    await this.ensureVoucherCodeIsUnique(normalizedCode);
    this.ensureVoucherDatesAreValid(input.starts_at, input.expires_at);
    this.ensureVoucherDiscountShapeIsValid(
      input.discount_type,
      input.max_discount_cap,
    );
    await this.ensurePerHoursVoucherIsValid(
      input.discount_type,
      input.scope,
      input.service_ids ??
        (input.service_id != null ? [input.service_id] : undefined),
    );
    this.ensureIncludeAddonsFlagIsValid(input.scope, input.include_addons_flag);
    const serviceIdForVoucher: number | null =
      input.scope === VoucherScopeEnum.SERVICES && input.service_id != null
        ? input.service_id
        : null;
    const serviceIdsForLinks: number[] =
      input.scope === VoucherScopeEnum.SERVICES
        ? input.service_id != null
          ? [input.service_id]
          : (input.service_ids ?? [])
        : [];
    // Pre-validate scope ownership BEFORE writing the voucher row so a failed
    // ownership check does not leave an orphaned voucher in the database.
    if (input.scope === VoucherScopeEnum.SERVICE_CATEGORIES) {
      await this.findValidSellerServiceCategoryIds({
        sellerId,
        serviceCategoryIds: input.service_category_ids ?? [],
      });
    } else if (input.scope === VoucherScopeEnum.SERVICES) {
      await this.findValidSellerServiceIds({
        sellerId,
        serviceIds: serviceIdsForLinks,
      });
    } else if (input.scope === VoucherScopeEnum.PRODUCTS) {
      await this.findValidSellerProductIds({
        sellerId,
        productIds: input.product_ids ?? [],
      });
    } else if (input.scope === VoucherScopeEnum.CATEGORIES) {
      await this.findValidSellerCategoryIds({
        sellerId,
        categoryIds: input.category_ids ?? [],
      });
    }
    const voucher: Voucher = Object.assign(new Voucher(), {
      code: normalizedCode,
      scope: input.scope,
      seller_id: sellerId,
      service_id: serviceIdForVoucher,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      max_discount_cap:
        input.discount_type === VoucherDiscountTypeEnum.PERCENTAGE
          ? (input.max_discount_cap ?? null)
          : null,
      min_order_amount: input.min_order_amount ?? 0,
      total_limit:
        input.total_limit != null && input.total_limit > 0
          ? input.total_limit
          : null,
      per_user_limit: input.per_user_limit ?? 1,
      used_count: 0,
      starts_at: input.starts_at ? new Date(input.starts_at) : null,
      expires_at: input.expires_at ? new Date(input.expires_at) : null,
      status: input.status ?? VoucherStatusEnum.ACTIVE,
      is_claimable: input.is_claimable ?? false,
      description: input.description ?? null,
      terms_and_conditions: input.terms_and_conditions ?? null,
      include_addons_flag: this.resolveIncludeAddonsFlag(
        input.scope,
        input.include_addons_flag,
      ),
      allowed_user_ids: null,
      created_by: causer,
      updated_by: causer,
    });
    const createdVoucher: Voucher =
      await this.voucherRepository.create(voucher);
    await this.createSellerVoucherRestrictionLinks({
      voucherId: createdVoucher.id,
      sellerId,
      scope: input.scope ?? VoucherScopeEnum.PRODUCTS,
      productIds: input.product_ids,
      categoryIds: input.category_ids,
      serviceIds:
        serviceIdsForLinks.length > 0 ? serviceIdsForLinks : undefined,
      serviceCategoryIds: input.service_category_ids,
    });
    return createdVoucher;
  }
  /**
   * Lists vouchers for admin view.
   */
  public async findAllForAdmin(
    query: QueryAdminVoucherDto,
    causer: User,
  ): Promise<FindAllVoucher> {
    if (!causer.system_admin) {
      throw new ForbiddenException('Only admins can view all vouchers');
    }
    const adminQuery: QueryVoucherDto = {
      ...query,
      sellerId: null,
    };
    const result = await this.voucherRepository.findAll(adminQuery);
    await this.batchEnrichVouchersWithRestrictionLinks(result.data);
    return result;
  }
  /**
   * Lists vouchers for the current seller.
   */
  public async findAllForSeller(
    query: QuerySellerVoucherDto,
    causer: User,
  ): Promise<FindAllVoucher> {
    if (!causer.seller_id) {
      throw new ForbiddenException('Only sellers can view seller vouchers');
    }
    const sellerQuery: QueryVoucherDto = {
      search: query.search,
      scope: query.scope,
      status: query.status,
      discount_type: query.discount_type,
      skip: query.skip,
      take: query.take,
      include_admin_vouchers: false,
      sellerId: causer.seller_id,
    };
    const result = await this.voucherRepository.findAll(sellerQuery);
    await this.batchEnrichVouchersWithRestrictionLinks(result.data);
    return result;
  }
  /**
   * Finds a voucher by ID.
   */
  public async findById(id: number): Promise<Voucher> {
    const voucher: Voucher | null = await this.voucherRepository.findById(id);
    if (!voucher) {
      throw new NotFoundException(`Voucher with id ${id} not found`);
    }
    return this.enrichVoucherWithRestrictionLinks(voucher);
  }
  /**
   * Gifts an existing seller voucher to specific users: auto-collects the voucher for each user
   * (creates user_voucher records). Caller must be the seller that owns the voucher.
   */
  public async giftVoucherToUsers(
    voucherId: number,
    input: GiftVoucherToUsersDto,
    causer: User,
  ): Promise<{ collected_count: number }> {
    if (!causer.seller_id) {
      throw new ForbiddenException('Only sellers can gift vouchers');
    }
    const voucher: Voucher = await this.findById(voucherId);
    if (voucher.seller_id !== causer.seller_id) {
      throw new ForbiddenException('Voucher must belong to your store');
    }
    const now: Date = new Date();
    if (voucher.status !== VoucherStatusEnum.ACTIVE) {
      throw new BadRequestException('Voucher is not active');
    }
    if (voucher.expires_at && voucher.expires_at < now) {
      throw new BadRequestException('Cannot gift expired vouchers to users');
    }
    if (voucher.starts_at && voucher.starts_at > now) {
      throw new BadRequestException(
        'Cannot gift vouchers where Start Date has not yet began',
      );
    }
    const quantityPerUser: number = input.quantity_per_user ?? 1;
    const voucherEntityId: number = voucher.id;
    const userIdCountMap = new Map<number, number>();
    for (const userId of input.user_ids) {
      userIdCountMap.set(userId, (userIdCountMap.get(userId) ?? 0) + 1);
    }
    let totalVouchersCreated = 0;
    await this.voucherEntityRepository.manager.transaction(async (manager) => {
      const transactionalUserVoucherRepository: Repository<UserVoucherEntity> =
        manager.getRepository(UserVoucherEntity);
      for (const [userId, occurrenceCount] of userIdCountMap) {
        const requestedCount = occurrenceCount * quantityPerUser;
        const vouchersToCreate = requestedCount;
        // Gift is administrative — does not consume total_limit or per_user_limit.
        // Redemption-based gating (§10) enforces caps at the moment a voucher is
        // actually used in a transaction, not when it is gifted.
        for (let i = 0; i < vouchersToCreate; i++) {
          await transactionalUserVoucherRepository.save(
            transactionalUserVoucherRepository.create({
              user_id: userId,
              voucher_id: voucherEntityId,
              status: UserVoucherStatusEnum.AVAILABLE,
              expires_at: voucher.expires_at ?? null,
            }),
          );
          totalVouchersCreated += 1;
        }
      }
    });
    if (userIdCountMap.size > 0) {
      const recipientIds = Array.from(userIdCountMap.keys());
      const recipientUsers = await this.voucherEntityRepository.manager
        .getRepository(UserEntity)
        .find({
          where: { id: In(recipientIds) },
          select: ['id', 'first_name', 'last_name'],
        });
      const userNameMap = new Map(
        recipientUsers.map((u) => [
          u.id,
          { first_name: u.first_name, last_name: u.last_name },
        ]),
      );

      let sellerName: string | null = null;
      if (voucher.seller_id) {
        const seller = await this.voucherEntityRepository.manager
          .getRepository(SellerEntity)
          .findOne({
            where: { id: voucher.seller_id },
            select: ['id', 'store_name'],
          });
        sellerName = seller?.store_name ?? null;
      }

      const giftLogEntries = recipientIds.map((giftedToUserId) =>
        this.voucherGiftLogRepository.create({
          voucher_id: voucherEntityId,
          gifted_by_user_id: causer.id,
          gifted_to_user_id: giftedToUserId,
          quantity: quantityPerUser,
          created_by: causer.id,
          voucher_code: voucher.code,
          voucher_discount_type: voucher.discount_type,
          voucher_discount_value: voucher.discount_value,
          voucher_max_discount_cap: voucher.max_discount_cap ?? null,
          voucher_scope: voucher.scope,
          voucher_description: voucher.description ?? null,
          seller_id: voucher.seller_id ?? null,
          seller_name: sellerName,
          gifted_to_first_name:
            userNameMap.get(giftedToUserId)?.first_name ?? null,
          gifted_to_last_name:
            userNameMap.get(giftedToUserId)?.last_name ?? null,
        }),
      );
      await this.voucherGiftLogRepository.save(giftLogEntries);
    }
    return { collected_count: totalVouchersCreated };
  }
  /**
   * Gifts an existing admin voucher to specific users: collects the voucher for each user.
   * Caller must be a system admin; voucher must be an admin voucher (seller_id is null).
   */
  public async giftAdminVoucherToUsers(
    voucherId: number,
    input: GiftVoucherToUsersDto,
    causer: User,
  ): Promise<{ collected_count: number }> {
    if (!causer.system_admin) {
      throw new ForbiddenException('Only admins can gift admin vouchers');
    }
    const voucher: Voucher = await this.findById(voucherId);
    if (voucher.seller_id != null) {
      throw new ForbiddenException(
        'Only admin vouchers can be gifted from admin. Use the store vouchers gift endpoint for seller vouchers.',
      );
    }
    const now: Date = new Date();
    if (voucher.status !== VoucherStatusEnum.ACTIVE) {
      throw new BadRequestException('Voucher is not active');
    }
    if (voucher.expires_at && voucher.expires_at < now) {
      throw new BadRequestException('Cannot gift expired vouchers to users');
    }
    if (voucher.starts_at && voucher.starts_at > now) {
      throw new BadRequestException(
        'Cannot gift vouchers where Start Date has not yet began',
      );
    }
    const quantityPerUser: number = input.quantity_per_user ?? 1;
    const voucherEntityId: number = voucher.id;
    const userIdCountMap = new Map<number, number>();
    for (const userId of input.user_ids) {
      userIdCountMap.set(userId, (userIdCountMap.get(userId) ?? 0) + 1);
    }
    let totalVouchersCreated = 0;
    await this.voucherEntityRepository.manager.transaction(async (manager) => {
      const transactionalUserVoucherRepository: Repository<UserVoucherEntity> =
        manager.getRepository(UserVoucherEntity);
      for (const [userId, occurrenceCount] of userIdCountMap) {
        const requestedCount = occurrenceCount * quantityPerUser;
        const vouchersToCreate = requestedCount;
        // Gift is administrative — does not consume total_limit or per_user_limit.
        // Redemption-based gating (§10) enforces caps at the moment a voucher is
        // actually used in a transaction, not when it is gifted.
        for (let i = 0; i < vouchersToCreate; i++) {
          await transactionalUserVoucherRepository.save(
            transactionalUserVoucherRepository.create({
              user_id: userId,
              voucher_id: voucherEntityId,
              status: UserVoucherStatusEnum.AVAILABLE,
              expires_at: voucher.expires_at ?? null,
            }),
          );
          totalVouchersCreated += 1;
        }
      }
    });
    if (userIdCountMap.size > 0) {
      const recipientIds = Array.from(userIdCountMap.keys());
      const recipientUsers = await this.voucherEntityRepository.manager
        .getRepository(UserEntity)
        .find({
          where: { id: In(recipientIds) },
          select: ['id', 'first_name', 'last_name'],
        });
      const userNameMap = new Map(
        recipientUsers.map((u) => [
          u.id,
          { first_name: u.first_name, last_name: u.last_name },
        ]),
      );

      const giftLogEntries = recipientIds.map((giftedToUserId) =>
        this.voucherGiftLogRepository.create({
          voucher_id: voucherEntityId,
          gifted_by_user_id: causer.id,
          gifted_to_user_id: giftedToUserId,
          quantity: quantityPerUser,
          created_by: causer.id,
          voucher_code: voucher.code,
          voucher_discount_type: voucher.discount_type,
          voucher_discount_value: voucher.discount_value,
          voucher_max_discount_cap: voucher.max_discount_cap ?? null,
          voucher_scope: voucher.scope,
          voucher_description: voucher.description ?? null,
          seller_id: null,
          seller_name: null,
          gifted_to_first_name:
            userNameMap.get(giftedToUserId)?.first_name ?? null,
          gifted_to_last_name:
            userNameMap.get(giftedToUserId)?.last_name ?? null,
        }),
      );
      await this.voucherGiftLogRepository.save(giftLogEntries);
    }
    return { collected_count: totalVouchersCreated };
  }
  public async giftVoucherToUser(
    voucherId: number,
    userId: number,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const voucher = await this.findById(voucherId);
    const repo = queryRunner
      ? queryRunner.manager.getRepository(UserVoucherEntity)
      : this.userVoucherRepository;
    await repo.save(
      repo.create({
        user_id: userId,
        voucher_id: voucher.id,
        status: UserVoucherStatusEnum.AVAILABLE,
        expires_at: voucher.expires_at ?? null,
      }),
    );
  }

  private async enrichVoucherWithRestrictionLinks(
    voucher: Voucher,
  ): Promise<Voucher> {
    const [
      voucherCategories,
      voucherProducts,
      voucherServices,
      voucherServiceCategories,
      userVoucherCount,
    ] = await Promise.all([
      this.voucherCategoryRepository.find({
        where: { voucher_id: voucher.id },
        relations: ['category'],
      }),
      this.voucherProductRepository.find({
        where: { voucher_id: voucher.id },
        relations: ['product'],
      }),
      this.voucherServiceRepository.find({
        where: { voucher_id: voucher.id },
        relations: ['service'],
      }),
      this.voucherServiceCategoryRepository.find({
        where: { voucher_id: voucher.id },
        relations: ['service_category'],
      }),
      this.userVoucherRepository.count({ where: { voucher_id: voucher.id } }),
    ]);
    const mappedVoucherCategories: Array<{
      id: number;
      voucher_id: number;
      category_id: number;
      category_name: string | null;
    }> = voucherCategories.map((item: VoucherCategoryEntity) => ({
      id: item.id,
      voucher_id: item.voucher_id,
      category_id: item.category_id,
      category_name: item.category?.category_name ?? null,
    }));
    const mappedVoucherProducts: Array<{
      id: number;
      voucher_id: number;
      product_id: number;
      product_name: string | null;
    }> = voucherProducts.map((item: VoucherProductEntity) => ({
      id: item.id,
      voucher_id: item.voucher_id,
      product_id: item.product_id,
      product_name: item.product?.product_name ?? null,
    }));
    const mappedVoucherServices: Array<{
      id: number;
      voucher_id: number;
      service_id: number;
      service_name: string | null;
    }> = voucherServices.map((item: VoucherServiceEntity) => ({
      id: item.id,
      voucher_id: item.voucher_id,
      service_id: item.service_id,
      service_name: item.service?.title ?? null,
    }));
    const mappedVoucherServiceCategories: Array<{
      id: number;
      voucher_id: number;
      service_category_id: number;
      service_category_name: string | null;
    }> = voucherServiceCategories.map((item: VoucherServiceCategoryEntity) => ({
      id: item.id,
      voucher_id: item.voucher_id,
      service_category_id: item.service_category_id,
      service_category_name: item.service_category?.name ?? null,
    }));
    return Object.assign(voucher, {
      voucher_categories: mappedVoucherCategories,
      voucher_products: mappedVoucherProducts,
      voucher_services: mappedVoucherServices,
      voucher_service_categories: mappedVoucherServiceCategories,
      has_claims: userVoucherCount > 0,
    });
  }

  /**
   * Batch-enrich a list of vouchers with their restriction links in 4 parallel queries.
   * Avoids N+1 by loading all links for all voucher IDs at once.
   */
  private async batchEnrichVouchersWithRestrictionLinks(
    vouchers: Voucher[],
  ): Promise<void> {
    if (vouchers.length === 0) return;
    const ids = vouchers.map((v) => v.id);
    const [allCategories, allProducts, allServices, allServiceCategories] =
      await Promise.all([
        this.voucherCategoryRepository.find({
          where: { voucher_id: In(ids) },
          relations: ['category'],
        }),
        this.voucherProductRepository.find({
          where: { voucher_id: In(ids) },
          relations: ['product'],
        }),
        this.voucherServiceRepository.find({
          where: { voucher_id: In(ids) },
          relations: ['service'],
        }),
        this.voucherServiceCategoryRepository.find({
          where: { voucher_id: In(ids) },
          relations: ['service_category'],
        }),
      ]);
    for (const voucher of vouchers) {
      voucher.voucher_categories = allCategories
        .filter((c) => c.voucher_id === voucher.id)
        .map((c) => ({
          id: c.id,
          voucher_id: c.voucher_id,
          category_id: c.category_id,
          category_name: c.category?.category_name ?? null,
        }));
      voucher.voucher_products = allProducts
        .filter((p) => p.voucher_id === voucher.id)
        .map((p) => ({
          id: p.id,
          voucher_id: p.voucher_id,
          product_id: p.product_id,
          product_name: p.product?.product_name ?? null,
        }));
      voucher.voucher_services = allServices
        .filter((s) => s.voucher_id === voucher.id)
        .map((s) => ({
          id: s.id,
          voucher_id: s.voucher_id,
          service_id: s.service_id,
          service_name: s.service?.title ?? null,
        }));
      voucher.voucher_service_categories = allServiceCategories
        .filter((sc) => sc.voucher_id === voucher.id)
        .map((sc) => ({
          id: sc.id,
          voucher_id: sc.voucher_id,
          service_category_id: sc.service_category_id,
          service_category_name: sc.service_category?.name ?? null,
        }));
    }
  }

  /**
   * Updates a voucher with access checks.
   */
  public async updateVoucher(
    id: number,
    input: UpdateAdminVoucherDto | UpdateSellerVoucherDto,
    causer: User,
  ): Promise<Voucher> {
    const currentVoucher: Voucher = await this.findById(id);
    this.ensureVoucherOwnership(currentVoucher, causer);
    this.ensureIncludeAddonsFlagIsValid(
      currentVoucher.scope,
      input.include_addons_flag,
    );

    // §10.5 — Increase-only validation for total_limit and per_user_limit.
    // Guard kicks in only after at least one redemption (used_count > 0).
    const hasRedemptions: boolean = (currentVoucher.used_count ?? 0) > 0;
    if (input.total_limit !== undefined && hasRedemptions) {
      if (
        input.total_limit !== null &&
        input.total_limit < (currentVoucher.used_count ?? 0)
      ) {
        throw new BadRequestException({
          errors: [
            {
              field: 'total_limit',
              reason: 'below_used_count',
              detail: `total_limit cannot be less than the number of redemptions already recorded (${currentVoucher.used_count}).`,
            },
          ],
        });
      }
      const isDecrease =
        currentVoucher.total_limit != null &&
        input.total_limit !== null &&
        input.total_limit < currentVoucher.total_limit;
      if (isDecrease) {
        throw new BadRequestException({
          errors: [
            {
              field: 'total_limit',
              reason: 'decrease_not_allowed',
              detail:
                'Total Redeemable Limit cannot be decreased after redemptions have been recorded.',
            },
          ],
        });
      }
    }
    if (input.per_user_limit !== undefined && hasRedemptions) {
      const isDecrease =
        currentVoucher.per_user_limit !== null &&
        input.per_user_limit !== null &&
        input.per_user_limit < currentVoucher.per_user_limit;
      if (isDecrease) {
        throw new BadRequestException({
          errors: [
            {
              field: 'per_user_limit',
              reason: 'decrease_not_allowed',
              detail:
                'Per User Redeemable Limit cannot be decreased after redemptions have been recorded.',
            },
          ],
        });
      }
    }

    // §5 — expires_at: editable on claimable vouchers; extend-only after first claim.
    if ('expires_at' in input && input.expires_at !== undefined && currentVoucher.is_claimable) {
      const hasClaims = await this.hasClaimedUserVouchers(currentVoucher.id);
      if (hasClaims && input.expires_at !== null) {
        const currentExpiry = currentVoucher.expires_at ?? null;
        const expiryViolation =
          currentExpiry === null ||
          new Date(input.expires_at) < currentExpiry;
        if (expiryViolation) {
          throw new BadRequestException({
            errors: [
              {
                field: 'expires_at',
                reason: 'extend_only_after_claim',
                detail:
                  'expires_at can only be extended (moved later) after the voucher has been claimed.',
              },
            ],
          });
        }
      }
    }

    const scopeDiff = await this.validateAndComputeScopeDiff(
      currentVoucher,
      input,
    );
    const scalarPatch: Partial<Voucher> = {
      updated_by: causer,
      include_addons_flag: this.resolveIncludeAddonsFlag(
        currentVoucher.scope,
        input.include_addons_flag ?? currentVoucher.include_addons_flag,
      ),
    };
    if (input.status !== undefined) scalarPatch.status = input.status;
    if (input.is_claimable !== undefined)
      scalarPatch.is_claimable = input.is_claimable;
    if (input.description !== undefined)
      scalarPatch.description = input.description;
    if (input.terms_and_conditions !== undefined)
      scalarPatch.terms_and_conditions = input.terms_and_conditions;
    if (input.total_limit !== undefined)
      scalarPatch.total_limit = input.total_limit;
    if (input.per_user_limit !== undefined)
      scalarPatch.per_user_limit = input.per_user_limit;
    if ('expires_at' in input && input.expires_at !== undefined && currentVoucher.is_claimable)
      scalarPatch.expires_at = input.expires_at
        ? new Date(input.expires_at)
        : null;

    // Wrap scalar patch + scope diff in a single transaction to prevent
    // partial-apply on concurrent edits or mid-flight failures.
    await this.voucherEntityRepository.manager.transaction(async (manager) => {
      await manager.getRepository(VoucherEntity).update(id, scalarPatch as any);
      if (scopeDiff) {
        await this.applyScopeDiff(id, currentVoucher, scopeDiff, manager);
      }
    });
    return this.findById(id);
  }
  /**
   * Updates voucher status.
   */
  public async updateVoucherStatus(
    id: number,
    status: VoucherStatusEnum,
    causer: User,
  ): Promise<Voucher> {
    const currentVoucher: Voucher = await this.findById(id);
    this.ensureVoucherOwnership(currentVoucher, causer);
    return this.voucherRepository.update(id, {
      status,
      updated_by: causer,
    });
  }
  /**
   * Soft deletes a voucher.
   */
  public async deleteVoucher(id: number, causer: User): Promise<void> {
    await this.findById(id);
    if (!causer.system_admin) {
      throw new ForbiddenException('Only admins can delete vouchers');
    }
    await this.voucherRepository.update(id, { deleted_by: causer });
    await this.deleteAvailableUserVouchersByVoucherId(id);
    await this.deleteVoucherRestrictionLinksByVoucherId(id);
    await this.voucherRepository.remove(id);
  }
  /**
   * Soft deletes a seller voucher with strict ownership checks.
   */
  public async deleteSellerVoucher(id: number, causer: User): Promise<void> {
    const currentVoucher: Voucher = await this.findById(id);
    if (causer.seller_id === null || causer.seller_id === undefined) {
      throw new ForbiddenException('Only sellers can delete store vouchers');
    }
    if (
      currentVoucher.seller_id === null ||
      currentVoucher.seller_id === undefined
    ) {
      throw new ForbiddenException(
        'You are not allowed to delete this voucher',
      );
    }
    if (currentVoucher.seller_id !== causer.seller_id) {
      throw new ForbiddenException(
        'You are not allowed to delete this voucher',
      );
    }
    await this.voucherRepository.update(id, { deleted_by: causer });
    await this.deleteAvailableUserVouchersByVoucherId(id);
    await this.deleteVoucherRestrictionLinksByVoucherId(id);
    await this.voucherRepository.remove(id);
  }
  /**
   * Returns claimable vouchers visible to customers.
   */
  public async findAvailableVouchers(
    query: QueryVoucherDto,
    causer: User,
  ): Promise<FindAllVoucher> {
    const skip: number = query.skip ?? 0;
    const take: number = query.take ?? 20;
    const now: Date = new Date();
    const validityFrom: Date = query.starts_at
      ? new Date(query.starts_at + 'T00:00:00.000Z')
      : now;
    const validityTo: Date = query.ends_at
      ? new Date(query.ends_at + 'T23:59:59.999Z')
      : now;
    const queryBuilder =
      this.voucherEntityRepository.createQueryBuilder('voucher');
    queryBuilder
      .where('voucher.is_claimable = :isClaimable', { isClaimable: true })
      .andWhere('voucher.status = :status', {
        status: VoucherStatusEnum.ACTIVE,
      })
      .andWhere(
        '(voucher.starts_at IS NULL OR voucher.starts_at <= :validityTo)',
        { validityTo },
      )
      .andWhere(
        '(voucher.expires_at IS NULL OR voucher.expires_at >= :validityFrom)',
        { validityFrom },
      )
      .andWhere(
        '(voucher.total_limit IS NULL OR voucher.used_count < voucher.total_limit)',
      )
      .andWhere('voucher.deleted_at IS NULL');
    if (query.search) {
      queryBuilder.andWhere('voucher.code ILIKE :search', {
        search: `%${query.search}%`,
      });
    }
    const scopes = parseScopeParam(query.scope);
    if (scopes.length) {
      queryBuilder.andWhere('voucher.scope IN (:...scopes)', { scopes });
    }
    if (query.discount_type) {
      queryBuilder.andWhere('voucher.discount_type = :discountType', {
        discountType: query.discount_type,
      });
    }
    const shouldIncludeAdminVouchers: boolean =
      query.include_admin_vouchers === true;
    const sellerIdFilter: number | null | undefined =
      query.seller_id ?? query.sellerId;
    if (sellerIdFilter !== undefined) {
      if (shouldIncludeAdminVouchers) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where('voucher.seller_id = :sellerId', {
              sellerId: sellerIdFilter,
            }).orWhere('voucher.seller_id IS NULL');
          }),
        );
      } else {
        queryBuilder.andWhere('voucher.seller_id = :sellerId', {
          sellerId: sellerIdFilter,
        });
      }
    } else if (!shouldIncludeAdminVouchers) {
      queryBuilder.andWhere('voucher.seller_id IS NOT NULL');
    }
    queryBuilder.andWhere(
      `NOT EXISTS (
        SELECT 1
        FROM user_vouchers userVoucher
        WHERE userVoucher.voucher_id = voucher.id
          AND userVoucher.user_id = :userId
      )`,
      { userId: causer.id },
    );
    queryBuilder.orderBy('voucher.expires_at', 'ASC').skip(skip).take(take);
    const [entities, totalCount]: [VoucherEntity[], number] =
      await queryBuilder.getManyAndCount();
    return {
      data: entities.map((entity: VoucherEntity) =>
        this.mapVoucherEntity(entity),
      ),
      totalCount,
      skip,
      take,
    };
  }
  /**
   * Collects a claimable voucher for the user.
   */
  public async collectVoucher(
    voucherId: number,
    causer: User,
  ): Promise<UserVoucher> {
    const voucher: Voucher = await this.findById(voucherId);
    return this.collectVoucherForUser(voucher, causer);
  }
  /**
   * Collects a claimable voucher by exact voucher code.
   */
  public async collectVoucherByCode(
    input: CollectVoucherByCodeDto,
    causer: User,
  ): Promise<UserVoucher> {
    const normalizedCode: string = this.normalizeCode(input.voucher_code);
    const voucher: Voucher | null =
      await this.voucherRepository.findByCode(normalizedCode);
    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }
    return this.collectVoucherForUser(voucher, causer);
  }
  /**
   * Finds a user's claimed voucher by voucher code.
   * Returns null if the user has not claimed the voucher.
   */
  public async findUserVoucherByCode(
    user: User,
    voucherCode: string,
  ): Promise<UserVoucher | null> {
    const normalizedCode: string = this.normalizeCode(voucherCode);
    const voucher: Voucher | null =
      await this.voucherRepository.findByCode(normalizedCode);
    if (!voucher) {
      return null;
    }
    const userVoucherEntity: UserVoucherEntity | null =
      await this.userVoucherRepository.findOne({
        where: { user_id: user.id, voucher_id: voucher.id },
      });
    if (!userVoucherEntity) {
      return null;
    }
    return this.mapUserVoucherEntity(userVoucherEntity);
  }
  private async collectVoucherForUser(
    voucher: Voucher,
    causer: User,
  ): Promise<UserVoucher> {
    await this.ensureVoucherClaimEligibility(voucher, causer);
    const voucherId: number = voucher.id;
    let savedUserVoucher: UserVoucherEntity | undefined;
    await this.voucherEntityRepository.manager.transaction(async (manager) => {
      const transactionalUserVoucherRepository: Repository<UserVoucherEntity> =
        manager.getRepository(UserVoucherEntity);
      const transactionalExistingUserVoucher: UserVoucherEntity | null =
        await transactionalUserVoucherRepository.findOne({
          where: { user_id: causer.id, voucher_id: voucherId },
        });
      if (transactionalExistingUserVoucher) {
        throw new ConflictException('Voucher already collected');
      }
      savedUserVoucher = await transactionalUserVoucherRepository.save(
        transactionalUserVoucherRepository.create({
          user_id: causer.id,
          voucher_id: voucherId,
          status: UserVoucherStatusEnum.AVAILABLE,
          expires_at: voucher.expires_at ?? null,
        }),
      );
    });
    if (!savedUserVoucher) {
      throw new BadRequestException('Failed to collect voucher');
    }
    return this.mapUserVoucherEntity(savedUserVoucher);
  }
  private async ensureVoucherClaimEligibility(
    voucher: Voucher,
    causer: User,
  ): Promise<void> {
    const now: Date = new Date();
    if (!voucher.is_claimable) {
      throw new BadRequestException('Voucher is not claimable');
    }
    if (voucher.status !== VoucherStatusEnum.ACTIVE) {
      throw new BadRequestException('Voucher is not active');
    }
    if (
      (voucher.starts_at && voucher.starts_at > now) ||
      (voucher.expires_at && voucher.expires_at < now)
    ) {
      throw new BadRequestException('Voucher is outside validity period');
    }
    // Claims are NOT gated by total_limit or per_user_limit (§10.1).
    // These caps fire at redemption time inside recordVoucherRedemption.
    const existingUserVoucher: UserVoucherEntity | null =
      await this.userVoucherRepository.findOne({
        where: { user_id: causer.id, voucher_id: voucher.id },
      });
    if (existingUserVoucher) {
      throw new ConflictException('Voucher already collected');
    }
  }
  /**
   * Lists customer vouchers.
   */
  public async findMyVouchers(
    query: QueryMyVouchersDto,
    causer: User,
  ): Promise<{
    data: UserVoucher[] | GroupedUserVoucher[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    const skip: number = query.skip ?? 0;
    const take: number = query.take ?? 20;
    if (query.group_vouchers) {
      return this.findMyVouchersGrouped(query, causer, skip, take);
    }
    const queryBuilder = this.userVoucherRepository
      .createQueryBuilder('userVoucher')
      .leftJoinAndSelect('userVoucher.voucher', 'voucher')
      .where('(voucher.id IS NOT NULL OR userVoucher.status = :usedStatus)', {
        usedStatus: UserVoucherStatusEnum.USED,
      })
      .andWhere('userVoucher.user_id = :userId', { userId: causer.id });
    if (query.status) {
      queryBuilder.andWhere('userVoucher.status = :status', {
        status: query.status,
      });
    }
    // Exclude user_vouchers linked to soft-deleted vouchers unless filtering by 'used'
    if (query.status !== UserVoucherStatusEnum.USED) {
      queryBuilder.andWhere('voucher.deleted_at IS NULL');
    }
    if (query.discount_type) {
      queryBuilder.andWhere('voucher.discount_type = :discountType', {
        discountType: query.discount_type,
      });
    }
    if (query.search) {
      queryBuilder.andWhere(
        '(voucher.code ILIKE :search OR voucher.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    queryBuilder
      .addSelect(
        `CASE "userVoucher"."status"
           WHEN '${UserVoucherStatusEnum.AVAILABLE}' THEN 1
           WHEN '${UserVoucherStatusEnum.USED}' THEN 2
           WHEN '${UserVoucherStatusEnum.EXPIRED}' THEN 3
           ELSE 4
         END`,
        'status_order',
      )
      .orderBy('status_order', 'ASC')
      .addOrderBy('userVoucher.collected_at', 'DESC')
      .skip(skip)
      .take(take);
    const [entities, totalCount]: [UserVoucherEntity[], number] =
      await queryBuilder.getManyAndCount();
    // Load soft-deleted vouchers for used user_vouchers missing their voucher data
    const missingVoucherIds: number[] = entities
      .filter(
        (entity: UserVoucherEntity) =>
          !entity.voucher && entity.status === UserVoucherStatusEnum.USED,
      )
      .map((entity: UserVoucherEntity) => entity.voucher_id);
    if (missingVoucherIds.length > 0) {
      const deletedVouchers: VoucherEntity[] =
        await this.voucherEntityRepository
          .createQueryBuilder('voucher')
          .withDeleted()
          .whereInIds(missingVoucherIds)
          .getMany();
      const voucherMap = new Map<number, VoucherEntity>(
        deletedVouchers.map((v: VoucherEntity) => [v.id, v]),
      );
      for (const entity of entities) {
        if (!entity.voucher && entity.status === UserVoucherStatusEnum.USED) {
          entity.voucher = voucherMap.get(entity.voucher_id) ?? (null as any);
        }
      }
    }
    return {
      data: entities.map((entity: UserVoucherEntity) =>
        this.mapUserVoucherEntity(entity),
      ),
      totalCount,
      skip,
      take,
    };
  }
  private async findMyVouchersGrouped(
    query: QueryMyVouchersDto,
    causer: User,
    skip: number,
    take: number,
  ): Promise<{
    data: GroupedUserVoucher[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    // Query 1: Get distinct voucher codes matching filters
    const groupQb = this.userVoucherRepository
      .createQueryBuilder('uv')
      .innerJoin('uv.voucher', 'v')
      .select('v.code', 'code')
      .where('uv.user_id = :userId', { userId: causer.id })
      .andWhere('v.deleted_at IS NULL');

    if (query.status) {
      groupQb.andWhere('uv.status = :status', { status: query.status });
    }
    if (query.discount_type) {
      groupQb.andWhere('v.discount_type = :discountType', {
        discountType: query.discount_type,
      });
    }
    if (query.search) {
      groupQb.andWhere(
        '(v.code ILIKE :search OR v.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    groupQb
      .addSelect(
        `MIN(CASE uv.status
           WHEN '${UserVoucherStatusEnum.AVAILABLE}' THEN 1
           WHEN '${UserVoucherStatusEnum.USED}' THEN 2
           WHEN '${UserVoucherStatusEnum.EXPIRED}' THEN 3
           ELSE 4
         END)`,
        'best_status',
      )
      .groupBy('v.code')
      .orderBy('best_status', 'ASC')
      .addOrderBy('v.code', 'ASC');

    const allGroups = await groupQb.getRawMany<{
      code: string;
      best_status: number;
    }>();
    const totalCount = allGroups.length;
    const paginatedCodes = allGroups
      .slice(skip, skip + take)
      .map((r) => r.code);

    if (paginatedCodes.length === 0) {
      return { data: [], totalCount, skip, take };
    }

    // Query 2: Fetch all UserVoucher rows for paginated codes
    const detailQb = this.userVoucherRepository
      .createQueryBuilder('userVoucher')
      .leftJoinAndSelect('userVoucher.voucher', 'voucher')
      .where('userVoucher.user_id = :userId', { userId: causer.id })
      .andWhere('voucher.code IN (:...codes)', { codes: paginatedCodes })
      .andWhere('voucher.deleted_at IS NULL');

    if (query.status) {
      detailQb.andWhere('userVoucher.status = :status', {
        status: query.status,
      });
    }

    detailQb
      .addSelect(
        `CASE "userVoucher"."status"
           WHEN '${UserVoucherStatusEnum.AVAILABLE}' THEN 1
           WHEN '${UserVoucherStatusEnum.USED}' THEN 2
           WHEN '${UserVoucherStatusEnum.EXPIRED}' THEN 3
           ELSE 4
         END`,
        'child_status_order',
      )
      .orderBy('child_status_order', 'ASC')
      .addOrderBy('userVoucher.expires_at', 'ASC', 'NULLS LAST');

    const entities = await detailQb.getMany();

    // Group in application code
    const groupMap = new Map<string, UserVoucherEntity[]>();
    for (const entity of entities) {
      const code = entity.voucher?.code ?? `unknown-${entity.voucher_id}`;
      if (!groupMap.has(code)) groupMap.set(code, []);
      groupMap.get(code)!.push(entity);
    }

    const data: GroupedUserVoucher[] = paginatedCodes
      .filter((code) => groupMap.has(code))
      .map((code) => {
        const children = groupMap.get(code)!;
        const mapped = children.map((e) => this.mapUserVoucherEntity(e));
        return {
          code,
          available_count: mapped.filter(
            (v) => v.status === UserVoucherStatusEnum.AVAILABLE,
          ).length,
          used_count: mapped.filter(
            (v) => v.status === UserVoucherStatusEnum.USED,
          ).length,
          expired_count: mapped.filter(
            (v) => v.status === UserVoucherStatusEnum.EXPIRED,
          ).length,
          vouchers: mapped,
        };
      });

    return { data, totalCount, skip, take };
  }
  /**
   * Returns user vouchers grouped by voucher type with available/used/expired counts.
   * Useful for displaying a wallet summary instead of raw individual rows.
   */
  public async findMyVouchersSummary(causer: User): Promise<
    Array<{
      voucher_id: number;
      voucher_code: string;
      voucher_description: string | null;
      available_count: number;
      used_count: number;
      expired_count: number;
    }>
  > {
    const rows: Array<{
      voucher_id: string;
      voucher_code: string;
      voucher_description: string | null;
      available_count: string;
      used_count: string;
      expired_count: string;
    }> = await this.userVoucherRepository
      .createQueryBuilder('uv')
      .innerJoin('uv.voucher', 'v')
      .select('uv.voucher_id', 'voucher_id')
      .addSelect('v.code', 'voucher_code')
      .addSelect('v.description', 'voucher_description')
      .addSelect(
        `SUM(CASE WHEN uv.status = 'available' THEN 1 ELSE 0 END)`,
        'available_count',
      )
      .addSelect(
        `SUM(CASE WHEN uv.status = 'used' THEN 1 ELSE 0 END)`,
        'used_count',
      )
      .addSelect(
        `SUM(CASE WHEN uv.status = 'expired' THEN 1 ELSE 0 END)`,
        'expired_count',
      )
      .where('uv.user_id = :userId', { userId: causer.id })
      .andWhere('v.deleted_at IS NULL')
      .groupBy('uv.voucher_id')
      .addGroupBy('v.code')
      .addGroupBy('v.description')
      .getRawMany();
    return rows.map((row) => ({
      voucher_id: Number(row.voucher_id),
      voucher_code: row.voucher_code,
      voucher_description: row.voucher_description ?? null,
      available_count: Number(row.available_count),
      used_count: Number(row.used_count),
      expired_count: Number(row.expired_count),
    }));
  }
  /**
   * Finds a specific user voucher by ID for the current customer.
   * Returns the user_voucher with the full voucher details including scope restriction links.
   */
  public async findMyVoucherById(
    userVoucherId: number,
    causer: User,
  ): Promise<UserVoucher> {
    const userVoucher: UserVoucherEntity | null =
      await this.userVoucherRepository.findOne({
        where: { id: userVoucherId },
        relations: ['voucher'],
      });
    if (!userVoucher) {
      throw new NotFoundException('Voucher not found');
    }
    if (userVoucher.user_id !== causer.id) {
      throw new ForbiddenException('This voucher does not belong to you');
    }
    // Load soft-deleted voucher if it was used but voucher is deleted
    if (
      !userVoucher.voucher &&
      userVoucher.status === UserVoucherStatusEnum.USED
    ) {
      const deletedVoucher: VoucherEntity | null =
        await this.voucherEntityRepository
          .createQueryBuilder('voucher')
          .withDeleted()
          .where('voucher.id = :id', { id: userVoucher.voucher_id })
          .getOne();
      if (deletedVoucher) {
        userVoucher.voucher = deletedVoucher;
      }
    }
    const mapped: UserVoucher = this.mapUserVoucherEntity(userVoucher);
    if (mapped.voucher) {
      mapped.voucher = await this.enrichVoucherWithRestrictionLinks(
        mapped.voucher,
      );
    }
    return mapped;
  }
  /**
   * Validates a voucher code against checkout context.
   */
  public async validateVoucher(
    input: ValidateVoucherDto,
    causer: User,
  ): Promise<VoucherValidationResult> {
    const checkoutContext: VoucherValidationCheckoutContext =
      await this.buildVoucherValidationCheckoutContext(input);
    const requestedVoucherIds: number[] = this.extractUniqueIds(input.vouchers);
    await this.ensureUserHasClaimedRequestedVouchers({
      voucherIds: requestedVoucherIds,
      userId: causer.id,
    });
    const normalizedCodes: string[] =
      await this.extractRequestedVoucherCodes(requestedVoucherIds);
    if (normalizedCodes.length === 0) {
      throw new BadRequestException('At least one voucher id is required');
    }
    const originalSubtotal: number = checkoutContext.applicableSubtotal;
    const originalShippingFee: number = checkoutContext.shippingFee;
    let remainingSubtotal: number = originalSubtotal;
    let remainingShippingFee: number = originalShippingFee;
    let itemDiscountAmount: number = 0;
    let shippingFeeDiscountAmount: number = 0;
    const appliedVouchers: AppliedVoucherValidation[] = [];
    let lastValidatedVoucher: Voucher | undefined;
    const pendingCodes: string[] = [...normalizedCodes];
    while (pendingCodes.length > 0) {
      if (remainingSubtotal <= 0 && remainingShippingFee <= 0) {
        break;
      }
      const prioritizedCandidateResult: {
        candidate?: PrioritizedVoucherValidationCandidate;
        invalidResult?: VoucherValidationResult;
      } = await this.findPrioritizedVoucherValidationCandidate({
        pendingCodes,
        userId: causer.id,
        remainingSubtotal,
        remainingShippingFee,
        checkoutContext,
      });
      if (!prioritizedCandidateResult.candidate) {
        if (!prioritizedCandidateResult.invalidResult) {
          break;
        }
        const totalDiscountAmount: number =
          originalSubtotal +
          originalShippingFee -
          (remainingSubtotal + remainingShippingFee);
        return {
          item_discount_amount: itemDiscountAmount,
          shipping_fee: originalShippingFee,
          shipping_fee_discount: shippingFeeDiscountAmount,
          discount_amount: itemDiscountAmount,
          original_subtotal: originalSubtotal,
          total_discount_amount: totalDiscountAmount,
          final_payable_amount: remainingSubtotal + remainingShippingFee,
          applied_vouchers: appliedVouchers,
        };
      }
      const prioritizedCandidate: PrioritizedVoucherValidationCandidate =
        prioritizedCandidateResult.candidate;
      if (
        prioritizedCandidate.voucher.discount_type ===
        VoucherDiscountTypeEnum.SHIPPING
      ) {
        remainingShippingFee -= prioritizedCandidate.discountAmount;
        shippingFeeDiscountAmount += prioritizedCandidate.discountAmount;
      } else {
        remainingSubtotal -= prioritizedCandidate.discountAmount;
        itemDiscountAmount += prioritizedCandidate.discountAmount;
      }
      lastValidatedVoucher = prioritizedCandidate.voucher;
      appliedVouchers.push({
        is_valid: true,
        voucher_id: prioritizedCandidate.voucher.id,
        voucher_code: prioritizedCandidate.voucher.code,
        discount_amount: prioritizedCandidate.discountAmount,
        remaining_subtotal: remainingSubtotal,
      });
      const prioritizedCodeIndex: number = pendingCodes.findIndex(
        (code: string) => code === prioritizedCandidate.code,
      );
      if (prioritizedCodeIndex >= 0) {
        pendingCodes.splice(prioritizedCodeIndex, 1);
      }
    }
    const totalDiscountAmount: number =
      originalSubtotal +
      originalShippingFee -
      (remainingSubtotal + remainingShippingFee);
    const validationResponse: VoucherValidationResult = {
      item_discount_amount: itemDiscountAmount,
      shipping_fee: originalShippingFee,
      shipping_fee_discount: shippingFeeDiscountAmount,
      discount_amount: itemDiscountAmount,
      original_subtotal: originalSubtotal,
      total_discount_amount: totalDiscountAmount,
      final_payable_amount: remainingSubtotal + remainingShippingFee,
      applied_vouchers: appliedVouchers,
    };
    if (appliedVouchers.length === 1 && lastValidatedVoucher) {
      validationResponse.voucher = lastValidatedVoucher;
    }
    return validationResponse;
  }
  /**
   * Evaluates all claimed vouchers for the user against checkout variants.
   */
  public async validateMyVouchers(
    causer: User,
  ): Promise<VoucherEligibilityResult[]> {
    const shoppingCart: ShoppingCartEntity | null =
      await this.shoppingCartRepository.findOne({
        where: { user_id: causer.id },
      });
    if (!shoppingCart) {
      return [];
    }
    const selectedCartItems: ShoppingCartItemEntity[] =
      await this.shoppingCartItemRepository.find({
        where: {
          shopping_cart_id: shoppingCart.id,
          is_selected: true,
        },
      });
    const checkoutVariants: Array<{ variant_id: number; quantity: number }> =
      selectedCartItems
        .filter(
          (item: ShoppingCartItemEntity) =>
            item.variant_id !== null && item.variant_id !== undefined,
        )
        .map((item: ShoppingCartItemEntity) => ({
          variant_id: item.variant_id as number,
          quantity: item.quantity,
        }));
    if (checkoutVariants.length === 0) {
      return [];
    }
    const checkoutInput: ValidateVoucherDto = {
      vouchers: [1],
      shipping_fee: 0,
      variants: checkoutVariants,
    };
    const checkoutContext: VoucherValidationCheckoutContext =
      await this.buildVoucherValidationCheckoutContext(checkoutInput);
    const checkoutSubtotal: number = checkoutContext.applicableSubtotal;
    const userVoucherEntities: UserVoucherEntity[] =
      await this.userVoucherRepository.find({
        where: {
          user_id: causer.id,
          status: UserVoucherStatusEnum.AVAILABLE,
        },
        relations: ['voucher'],
        order: { collected_at: 'DESC' },
      });
    const eligibilityResults: VoucherEligibilityResult[] = [];
    for (const userVoucherEntity of userVoucherEntities) {
      if (!userVoucherEntity.voucher) {
        continue;
      }
      const validationResult: VoucherValidationResult =
        await this.validateVoucherForUser(
          {
            code: userVoucherEntity.voucher.code,
            applicable_subtotal: checkoutSubtotal,
            shipping_fee: 0,
            seller_id: checkoutContext.sellerId,
            category_ids: checkoutContext.categoryIds,
            product_ids: checkoutContext.productIds,
            service_category_ids: checkoutContext.serviceCategoryIds,
            service_ids: checkoutContext.serviceIds,
            checkout_variants: checkoutContext.checkoutVariants,
          },
          causer.id,
        );
      const voucherData: Voucher = this.mapVoucherEntity(
        userVoucherEntity.voucher,
      );
      eligibilityResults.push({
        is_elligible: validationResult.is_valid === true,
        voucher_id: voucherData.id,
        message: validationResult.message ?? 'Voucher validation completed',
        voucher: voucherData,
      });
    }
    return eligibilityResults;
  }
  /**
   * Applies voucher logic and returns final discount payload.
   */
  public async applyVoucherDiscount(input: ApplyVoucherDiscountInput): Promise<{
    voucherId: number;
    voucherCode: string;
    discountAmount: number;
  }> {
    const stackedResult: {
      totalDiscountAmount: number;
      appliedVouchers: AppliedVoucherDiscount[];
    } = await this.applyStackedVoucherDiscounts({
      codes: [input.code],
      userId: input.userId,
      applicableSubtotal: input.applicableSubtotal,
      sellerId: input.sellerId,
      categoryIds: input.categoryIds,
      productIds: input.productIds,
      serviceCategoryIds: input.serviceCategoryIds,
      serviceIds: input.serviceIds,
    });
    const firstAppliedVoucher: AppliedVoucherDiscount | undefined =
      stackedResult.appliedVouchers[0];
    if (!firstAppliedVoucher) {
      throw new BadRequestException('Voucher is invalid');
    }
    return {
      voucherId: firstAppliedVoucher.voucherId,
      voucherCode: firstAppliedVoucher.voucherCode,
      discountAmount: firstAppliedVoucher.discountAmount,
    };
  }
  /**
   * Applies a stack of voucher codes to a single checkout context.
   */
  public async applyStackedVoucherDiscounts(
    input: ApplyStackedVoucherDiscountsInput,
  ): Promise<{
    totalDiscountAmount: number;
    appliedVouchers: AppliedVoucherDiscount[];
  }> {
    const normalizedCodes: string[] = this.extractNormalizedVoucherCodes(
      input.codes,
      { allowDuplicates: input.allowDuplicateCodes === true },
    );
    if (normalizedCodes.length === 0) {
      throw new BadRequestException('At least one voucher code is required');
    }
    let remainingSubtotal: number = input.applicableSubtotal;
    const appliedVouchers: AppliedVoucherDiscount[] = [];
    for (const code of normalizedCodes) {
      if (remainingSubtotal <= 0) {
        break;
      }
      const validationResult: VoucherValidationResult =
        await this.validateVoucherForUser(
          {
            code,
            applicable_subtotal: remainingSubtotal,
            original_subtotal: input.applicableSubtotal,
            num_slots: input.numSlots,
            shipping_fee: 0,
            seller_id: input.sellerId,
            category_ids: input.categoryIds,
            product_ids: input.productIds,
            service_category_ids: input.serviceCategoryIds,
            service_ids: input.serviceIds,
            service_type: input.serviceType,
            addons_total: input.addons_total,
          },
          input.userId,
        );
      if (!validationResult.is_valid || !validationResult.voucher) {
        throw new BadRequestException(
          validationResult.message ?? `Voucher ${code} is invalid`,
        );
      }
      const discountAmount: number = Math.min(
        validationResult.discount_amount ?? 0,
        remainingSubtotal,
      );
      if (discountAmount <= 0) {
        continue;
      }
      appliedVouchers.push({
        voucherId: validationResult.voucher.id,
        voucherCode: validationResult.voucher.code,
        discountAmount,
        includeAddons: validationResult.include_addons_flag ?? false,
      });
      remainingSubtotal -= discountAmount;
    }
    const totalDiscountAmount: number = appliedVouchers.reduce(
      (sum: number, item: AppliedVoucherDiscount) => sum + item.discountAmount,
      0,
    );
    return {
      totalDiscountAmount,
      appliedVouchers,
    };
  }
  /**
   * Records voucher redemption and increments usage count.
   */
  public async recordVoucherRedemption(
    input: RecordVoucherRedemptionInput,
  ): Promise<VoucherRedemption> {
    // Resolve user_voucher_id if not provided
    let userVoucherId: number;
    if (input.userVoucherId) {
      userVoucherId = input.userVoucherId;
    } else {
      const userVoucher: UserVoucherEntity | null =
        await this.userVoucherRepository.findOne({
          where: {
            user_id: input.userId,
            voucher_id: input.voucherId,
            status: UserVoucherStatusEnum.AVAILABLE,
          },
        });
      if (!userVoucher) {
        throw new BadRequestException(
          'No available user voucher found for this voucher and user',
        );
      }
      userVoucherId = userVoucher.id;
    }

    // §10.4 — Pessimistic-lock redemption gate.
    // All redemption checkpoints route through this helper, so gating here
    // covers every path (sales-order, web-booking, guest-venue, POS).
    const redemptionEntity: VoucherRedemptionEntity =
      await this.voucherEntityRepository.manager.transaction(
        async (manager) => {
          // 1. Lock the voucher row to serialise concurrent redemptions
          const voucher = await manager.getRepository(VoucherEntity).findOne({
            where: { id: input.voucherId },
            lock: { mode: 'pessimistic_write' },
          });
          if (!voucher) {
            throw new NotFoundException('Voucher not found');
          }

          // 2. Total-limit gate: used_count must be below total_limit
          if (
            voucher.total_limit !== null &&
            voucher.used_count >= voucher.total_limit
          ) {
            throw new BadRequestException('Voucher redemption limit reached');
          }

          // 3. Per-user-limit gate: count of voucher_redemptions for this user
          //    on this voucher must be below per_user_limit
          if (voucher.per_user_limit !== null) {
            const perUserRedeemed = await manager
              .getRepository(VoucherRedemptionEntity)
              .createQueryBuilder('r')
              .innerJoin('r.user_voucher', 'uv')
              .where('uv.voucher_id = :voucherId', {
                voucherId: input.voucherId,
              })
              .andWhere('r.user_id = :userId', { userId: input.userId })
              .getCount();
            if (perUserRedeemed >= voucher.per_user_limit) {
              throw new BadRequestException(
                'Per-user redemption limit reached',
              );
            }
          }

          // 4. Save VoucherRedemptionEntity
          const txRedemptionRepo = manager.getRepository(
            VoucherRedemptionEntity,
          );
          const saved = await txRedemptionRepo.save(
            txRedemptionRepo.create({
              user_voucher_id: userVoucherId,
              user_id: input.userId,
              sales_order_id: input.salesOrderId ?? null,
              booking_id: input.bookingId ?? null,
              seller_id: input.sellerId ?? null,
              discount_amount: input.discountAmount,
              order_subtotal: input.orderSubtotal,
            }),
          );

          // 5. Upsert SalesOrderVoucherEntity if sales order context
          if (input.salesOrderId) {
            const voucherCode: string = input.voucherCode ?? voucher.code;
            await manager.getRepository(SalesOrderVoucherEntity).upsert(
              {
                sales_order_id: input.salesOrderId,
                user_voucher_id: userVoucherId,
                voucher_code: voucherCode,
                voucher_discount: input.discountAmount,
              },
              ['sales_order_id', 'user_voucher_id'],
            );
          }

          // 6. Increment used_count (still inside the pessimistic lock)
          await manager
            .getRepository(VoucherEntity)
            .increment({ id: input.voucherId }, 'used_count', 1);

          // 7. Mark the user_voucher as USED
          const redemptionNow: Date = new Date();
          const txUserVoucherRepo = manager.getRepository(UserVoucherEntity);
          const availableUserVoucher: UserVoucherEntity | null =
            await txUserVoucherRepo
              .createQueryBuilder('uv')
              .where('uv.user_id = :userId', { userId: input.userId })
              .andWhere('uv.voucher_id = :voucherId', {
                voucherId: input.voucherId,
              })
              .andWhere('uv.status = :status', {
                status: UserVoucherStatusEnum.AVAILABLE,
              })
              .andWhere('(uv.expires_at IS NULL OR uv.expires_at > :now)', {
                now: redemptionNow,
              })
              .orderBy('uv.collected_at', 'ASC')
              .getOne();
          if (!availableUserVoucher) {
            throw new BadRequestException('No available voucher to redeem');
          }
          await txUserVoucherRepo.update(availableUserVoucher.id, {
            status: UserVoucherStatusEnum.USED,
            used_at: redemptionNow,
          });

          return saved;
        },
      );

    return this.mapVoucherRedemptionEntity(redemptionEntity);
  }
  /**
   * Records all voucher redemptions applied on a single sales order.
   */
  public async recordStackedVoucherRedemptions(
    input: RecordStackedVoucherRedemptionsInput,
  ): Promise<VoucherRedemption[]> {
    if (input.salesOrderId == null && input.bookingId == null) {
      throw new BadRequestException(
        'Either salesOrderId or bookingId is required',
      );
    }
    const createdRedemptions: VoucherRedemption[] = [];
    for (const voucher of input.vouchers) {
      const createdRedemption: VoucherRedemption =
        await this.recordVoucherRedemption({
          voucherId: voucher.voucherId,
          userId: input.userId,
          orderSubtotal: voucher.orderSubtotal,
          discountAmount: voucher.discountAmount,
          voucherCode: voucher.voucherCode,
          salesOrderId: input.salesOrderId ?? null,
          bookingId: input.bookingId ?? null,
        });
      createdRedemptions.push(createdRedemption);
    }
    return createdRedemptions;
  }
  public async recordStackedVoucherRedemptionsForBooking(
    bookingId: number,
    userId: number,
    appliedVouchers: Array<{
      voucherId: number;
      voucherCode: string;
      discountAmount: number;
    }>,
    orderSubtotal: number,
    salesOrderId?: number,
  ): Promise<VoucherRedemption[]> {
    return this.recordStackedVoucherRedemptions({
      userId,
      bookingId,
      salesOrderId,
      vouchers: appliedVouchers.map((v) => ({
        voucherId: v.voucherId,
        voucherCode: v.voucherCode,
        orderSubtotal,
        discountAmount: v.discountAmount,
      })),
    });
  }

  /**
   * Restores voucher usage when a booking is cancelled (decrement used_count, set user_voucher back to AVAILABLE).
   */
  public async restoreVouchersForCancelledBooking(
    bookingId: number,
    salesOrderId?: number,
  ): Promise<void> {
    const redemptions: VoucherRedemptionEntity[] =
      await this.voucherRedemptionRepository.find({
        where: { booking_id: bookingId },
        relations: ['user_voucher'],
      });
    for (const r of redemptions) {
      const voucherId = r.user_voucher?.voucher_id;
      if (voucherId) {
        await this.voucherRepository.decrementUsedCount(voucherId);
      }
      await this.userVoucherRepository.update(r.user_voucher_id, {
        status: UserVoucherStatusEnum.AVAILABLE,
        used_at: null,
      });
    }
    if (redemptions.length > 0) {
      await this.voucherRedemptionRepository.delete({
        booking_id: bookingId,
      });
    }
    if (salesOrderId != null) {
      const orderRedemptions: VoucherRedemptionEntity[] =
        await this.voucherRedemptionRepository.find({
          where: { sales_order_id: salesOrderId },
          relations: ['user_voucher'],
        });
      for (const r of orderRedemptions) {
        const voucherId = r.user_voucher?.voucher_id;
        if (voucherId) {
          await this.voucherRepository.decrementUsedCount(voucherId);
        }
        await this.userVoucherRepository.update(r.user_voucher_id, {
          status: UserVoucherStatusEnum.AVAILABLE,
          used_at: null,
        });
      }
      if (orderRedemptions.length > 0) {
        await this.voucherRedemptionRepository.delete({
          sales_order_id: salesOrderId,
        });
      }
    }
  }

  /**
   * Ensures the user has claimed (collected) each of the given voucher codes; throws if any are not claimed.
   */
  public async ensureUserHasClaimedVoucherCodes(
    codes: string[],
    userId: number,
    options?: { allowDuplicateCodes?: boolean },
  ): Promise<void> {
    const normalizedCodes: string[] = this.extractNormalizedVoucherCodes(
      codes,
      { allowDuplicates: options?.allowDuplicateCodes === true },
    );
    if (normalizedCodes.length === 0) {
      return;
    }
    const requestedCodeCounts: Map<string, number> = new Map();
    for (const code of normalizedCodes) {
      requestedCodeCounts.set(code, (requestedCodeCounts.get(code) ?? 0) + 1);
    }
    const voucherIds: number[] = [];
    const requestedVoucherCounts: Map<number, number> = new Map();
    for (const [code, count] of requestedCodeCounts.entries()) {
      const voucher: Voucher | null =
        await this.voucherRepository.findByCode(code);
      if (!voucher) {
        continue;
      }
      voucherIds.push(voucher.id);
      requestedVoucherCounts.set(
        voucher.id,
        (requestedVoucherCounts.get(voucher.id) ?? 0) + count,
      );
    }
    if (requestedVoucherCounts.size === 0) {
      return;
    }
    if (options?.allowDuplicateCodes !== true) {
      await this.ensureUserHasClaimedRequestedVouchers({
        voucherIds,
        userId,
      });
      return;
    }
    const voucherIdList: number[] = Array.from(requestedVoucherCounts.keys());
    const availableCounts = await this.userVoucherRepository
      .createQueryBuilder('userVoucher')
      .select('userVoucher.voucher_id', 'voucher_id')
      .addSelect('COUNT(userVoucher.id)', 'count')
      .where('userVoucher.user_id = :userId', { userId })
      .andWhere('userVoucher.status = :status', {
        status: UserVoucherStatusEnum.AVAILABLE,
      })
      .andWhere('userVoucher.voucher_id IN (:...voucherIds)', {
        voucherIds: voucherIdList,
      })
      .groupBy('userVoucher.voucher_id')
      .getRawMany<{ voucher_id: number; count: string }>();
    const availableCountByVoucherId: Map<number, number> = new Map(
      availableCounts.map((row) => [Number(row.voucher_id), Number(row.count)]),
    );
    for (const [
      voucherId,
      requestedCount,
    ] of requestedVoucherCounts.entries()) {
      const availableCount = availableCountByVoucherId.get(voucherId) ?? 0;
      if (availableCount < requestedCount) {
        throw new BadRequestException(
          'You have not claimed enough vouchers for this request',
        );
      }
    }
  }

  /**
   * Returns all owned available vouchers for a booking context (service + subtotal).
   * Each item carries `disabled_reason` (null = selectable, string = why it cannot be used)
   * and `selection_policy` so the mobile modal can render the correct UX without guessing.
   *
   * Vouchers are silently hidden only when they should never be surfaced to the user at all
   * (inactive status, globally expired, not-yet-started, or gift-restricted to other users).
   * Every other failure reason is surfaced as a `disabled_reason` so the modal can show it.
   */
  public async getApplicableVouchersForBooking(
    serviceId: number,
    subtotal: number,
    userId: number,
    numSlots?: number,
  ): Promise<
    Array<{
      user_voucher_id: number;
      code: string;
      description: string | null;
      discount_type: string;
      discount_value: number;
      discount_amount: number;
      include_addons_flag: boolean;
      disabled_reason: string | null;
      selection_policy: 'single_per_booking' | 'stack_by_booking_units';
      voucher: Voucher;
    }>
  > {
    const now: Date = new Date();

    const serviceEntity: ServiceEntity | null =
      await this.serviceEntityRepository.findOne({
        where: { id: serviceId },
        select: [
          'id',
          'seller_id',
          'category_id',
          'service_type',
          'hourly_rate',
        ],
      });
    const serviceType: string | undefined = serviceEntity?.service_type;
    const serviceSellerId: number | undefined = serviceEntity?.seller_id;
    const serviceCategoryIds: number[] =
      serviceEntity?.category_id != null ? [serviceEntity.category_id] : [];
    const serviceHourlyRate: number = serviceEntity?.hourly_rate
      ? Number(serviceEntity.hourly_rate)
      : 0;

    const userVouchers: UserVoucherEntity[] = await this.userVoucherRepository
      .createQueryBuilder('uv')
      .innerJoinAndSelect('uv.voucher', 'voucher', 'voucher.deleted_at IS NULL')
      .where('uv.user_id = :userId', { userId })
      .andWhere('uv.status = :status', {
        status: UserVoucherStatusEnum.AVAILABLE,
      })
      .andWhere('(uv.expires_at IS NULL OR uv.expires_at > :now)', { now })
      .andWhere('voucher.status = :voucherStatus', {
        voucherStatus: VoucherStatusEnum.ACTIVE,
      })
      .andWhere('(voucher.starts_at IS NULL OR voucher.starts_at <= :now)', {
        now,
      })
      .andWhere('(voucher.expires_at IS NULL OR voucher.expires_at >= :now)', {
        now,
      })
      .orderBy('voucher.code', 'ASC')
      .addOrderBy('uv.id', 'ASC')
      .getMany();

    if (userVouchers.length === 0) {
      return [];
    }

    const voucherIds: number[] = Array.from(
      new Set(
        userVouchers
          .map((userVoucher) => userVoucher.voucher_id)
          .filter((voucherId): voucherId is number =>
            Number.isInteger(voucherId),
          ),
      ),
    );
    const [userUsageCountByVoucherId, restrictionIds] = await Promise.all([
      this.getUserVoucherUsageCountsByVoucherId(voucherIds, userId),
      this.loadVoucherRestrictionIdSets(voucherIds),
    ]);

    const results: Array<{
      user_voucher_id: number;
      code: string;
      description: string | null;
      discount_type: string;
      discount_value: number;
      discount_amount: number;
      include_addons_flag: boolean;
      disabled_reason: string | null;
      selection_policy: 'single_per_booking' | 'stack_by_booking_units';
      voucher: Voucher;
    }> = [];
    for (const uv of userVouchers) {
      const v = uv.voucher;
      if (!v) continue;
      const voucherDomain: Voucher = this.mapVoucherEntity(v as VoucherEntity);
      const validation: VoucherValidationResult =
        this.validateApplicableBookingVoucher({
          voucher: voucherDomain,
          subtotal,
          numSlots,
          serviceId,
          serviceSellerId,
          serviceCategoryIds,
          serviceType,
          serviceHourlyRate,
          userUsageCountByVoucherId,
          restrictionIds,
        });

      if (!validation.is_valid || !validation.voucher) {
        continue;
      }

      const selectionPolicy = this.resolveVoucherSelectionPolicy(voucherDomain);
      const discountAmount: number =
        validation.discount_amount != null
          ? Math.min(validation.discount_amount, subtotal)
          : 0;

      if (discountAmount <= 0) {
        continue;
      }

      results.push({
        user_voucher_id: uv.id,
        code: voucherDomain.code,
        description: voucherDomain.description ?? null,
        discount_type: voucherDomain.discount_type,
        discount_value: Number(voucherDomain.discount_value),
        discount_amount: discountAmount,
        include_addons_flag: voucherDomain.include_addons_flag ?? false,
        disabled_reason: null,
        selection_policy: selectionPolicy,
        voucher: voucherDomain,
      });
    }
    return results;
  }

  private async getUserVoucherUsageCountsByVoucherId(
    voucherIds: number[],
    userId: number,
  ): Promise<Map<number, number>> {
    if (voucherIds.length === 0) {
      return new Map();
    }

    const rows = await this.voucherRedemptionRepository
      .createQueryBuilder('redemption')
      .innerJoin('redemption.user_voucher', 'userVoucher')
      .select('userVoucher.voucher_id', 'voucher_id')
      .addSelect('COUNT(*)', 'count')
      .where('redemption.user_id = :userId', { userId })
      .andWhere('userVoucher.voucher_id IN (:...voucherIds)', {
        voucherIds,
      })
      .groupBy('userVoucher.voucher_id')
      .getRawMany<{ voucher_id: string; count: string }>();

    return new Map(
      rows.map((row) => [Number(row.voucher_id), Number(row.count)]),
    );
  }

  private async loadVoucherRestrictionIdSets(
    voucherIds: number[],
  ): Promise<VoucherRestrictionIdSets> {
    if (voucherIds.length === 0) {
      return {
        categoryIdsByVoucherId: new Map(),
        productIdsByVoucherId: new Map(),
        serviceCategoryIdsByVoucherId: new Map(),
        serviceIdsByVoucherId: new Map(),
      };
    }

    const [
      categoryRestrictions,
      productRestrictions,
      serviceCategoryRestrictions,
      serviceRestrictions,
    ] = await Promise.all([
      this.voucherCategoryRepository.find({
        where: { voucher_id: In(voucherIds) },
      }),
      this.voucherProductRepository.find({
        where: { voucher_id: In(voucherIds) },
      }),
      this.voucherServiceCategoryRepository.find({
        where: { voucher_id: In(voucherIds) },
      }),
      this.voucherServiceRepository.find({
        where: { voucher_id: In(voucherIds) },
      }),
    ]);

    return {
      categoryIdsByVoucherId: this.buildVoucherRestrictionIdMap(
        categoryRestrictions,
        (row) => row.category_id,
      ),
      productIdsByVoucherId: this.buildVoucherRestrictionIdMap(
        productRestrictions,
        (row) => row.product_id,
      ),
      serviceCategoryIdsByVoucherId: this.buildVoucherRestrictionIdMap(
        serviceCategoryRestrictions,
        (row) => row.service_category_id,
      ),
      serviceIdsByVoucherId: this.buildVoucherRestrictionIdMap(
        serviceRestrictions,
        (row) => row.service_id,
      ),
    };
  }

  private buildVoucherRestrictionIdMap<
    T extends { voucher_id: number | null | undefined },
  >(
    rows: T[],
    getRestrictedId: (row: T) => number | null | undefined,
  ): Map<number, Set<number>> {
    const map = new Map<number, Set<number>>();

    for (const row of rows) {
      if (!row.voucher_id) {
        continue;
      }

      const restrictedId = getRestrictedId(row);
      if (!restrictedId) {
        continue;
      }

      const existing = map.get(row.voucher_id) ?? new Set<number>();
      existing.add(restrictedId);
      map.set(row.voucher_id, existing);
    }

    return map;
  }

  private validateApplicableBookingVoucher(input: {
    voucher: Voucher;
    subtotal: number;
    numSlots?: number;
    serviceId: number;
    serviceSellerId?: number;
    serviceCategoryIds: number[];
    serviceType?: string;
    serviceHourlyRate: number;
    userUsageCountByVoucherId: Map<number, number>;
    restrictionIds: VoucherRestrictionIdSets;
  }): VoucherValidationResult {
    const { voucher } = input;

    if (voucher.discount_type === VoucherDiscountTypeEnum.SHIPPING) {
      return {
        is_valid: false,
        message: 'Voucher is not valid for this booking',
      };
    }

    if (
      voucher.seller_id !== null &&
      voucher.seller_id !== undefined &&
      input.serviceSellerId !== undefined &&
      voucher.seller_id !== input.serviceSellerId
    ) {
      return {
        is_valid: false,
        message: 'Voucher is not valid for this seller',
      };
    }

    if (input.subtotal < voucher.min_order_amount) {
      return {
        is_valid: false,
        message: `Minimum order of ${voucher.min_order_amount} required`,
      };
    }

    if (
      voucher.total_limit !== null &&
      voucher.total_limit !== undefined &&
      (voucher.used_count ?? 0) >= voucher.total_limit
    ) {
      return {
        is_valid: false,
        message: 'This voucher is no longer available',
      };
    }

    const userUsageCount = input.userUsageCountByVoucherId.get(voucher.id) ?? 0;
    if (
      voucher.per_user_limit !== null &&
      voucher.per_user_limit !== undefined &&
      userUsageCount >= voucher.per_user_limit
    ) {
      return {
        is_valid: false,
        message: 'You have already used this voucher',
      };
    }

    const restrictionResult = this.validateApplicableBookingVoucherRestrictions(
      {
        voucher,
        serviceId: input.serviceId,
        serviceCategoryIds: input.serviceCategoryIds,
        restrictionIds: input.restrictionIds,
      },
    );
    if (!restrictionResult.is_valid) {
      return restrictionResult;
    }

    if (voucher.discount_type === VoucherDiscountTypeEnum.PER_HOURS) {
      if (input.serviceType !== 'venue') {
        return {
          is_valid: false,
          message: 'Only available for venue-type court services',
        };
      }
    }

    const discountBaseAmount =
      voucher.discount_type === VoucherDiscountTypeEnum.PER_HOURS
        ? Math.min(
            input.serviceHourlyRate * Number(voucher.discount_value),
            input.subtotal,
          )
        : input.subtotal;
    const discountAmount = this.calculateDiscountAmount(
      voucher,
      discountBaseAmount,
      0,
      input.numSlots,
      input.subtotal,
    );

    if (discountAmount <= 0) {
      return {
        is_valid: false,
        message: 'Not applicable for this booking',
      };
    }

    return {
      is_valid: true,
      message: 'Voucher is valid',
      discount_amount: discountAmount,
      voucher,
    };
  }

  private validateApplicableBookingVoucherRestrictions(input: {
    voucher: Voucher;
    serviceId: number;
    serviceCategoryIds: number[];
    restrictionIds: VoucherRestrictionIdSets;
  }): VoucherValidationResult {
    const categoryRestrictions =
      input.restrictionIds.categoryIdsByVoucherId.get(input.voucher.id);
    if (categoryRestrictions && categoryRestrictions.size > 0) {
      return {
        is_valid: false,
        message: 'Voucher is not valid for selected categories',
      };
    }

    const productRestrictions = input.restrictionIds.productIdsByVoucherId.get(
      input.voucher.id,
    );
    if (productRestrictions && productRestrictions.size > 0) {
      return {
        is_valid: false,
        message: 'Voucher is not valid for selected products',
      };
    }

    const serviceCategoryRestrictions =
      input.restrictionIds.serviceCategoryIdsByVoucherId.get(input.voucher.id);
    if (
      serviceCategoryRestrictions &&
      serviceCategoryRestrictions.size > 0 &&
      !input.serviceCategoryIds.some((serviceCategoryId) =>
        serviceCategoryRestrictions.has(serviceCategoryId),
      )
    ) {
      return {
        is_valid: false,
        message: 'Voucher is not valid for selected service categories',
      };
    }

    const serviceRestrictions = input.restrictionIds.serviceIdsByVoucherId.get(
      input.voucher.id,
    );
    if (serviceRestrictions && serviceRestrictions.size > 0) {
      if (!serviceRestrictions.has(input.serviceId)) {
        return {
          is_valid: false,
          message: 'Voucher is not valid for selected services',
        };
      }
      return { is_valid: true };
    }

    if (
      input.voucher.service_id !== null &&
      input.voucher.service_id !== undefined
    ) {
      if (input.voucher.service_id === input.serviceId) {
        return { is_valid: true };
      }
      return {
        is_valid: false,
        message: 'Voucher is not valid for this service',
      };
    }

    if (input.voucher.scope === VoucherScopeEnum.SERVICES) {
      return {
        is_valid: false,
        message: 'Voucher is not configured for any eligible service',
      };
    }

    return { is_valid: true };
  }

  /**
   * Derives the selection policy for a voucher so the mobile modal knows how to
   * handle multi-select stacking without relying on code-prefix heuristics on the client.
   */
  private resolveVoucherSelectionPolicy(
    voucher: Voucher,
  ): 'single_per_booking' | 'stack_by_booking_units' {
    if (voucher.discount_type === VoucherDiscountTypeEnum.PER_HOURS) {
      return 'stack_by_booking_units';
    }
    return 'single_per_booking';
  }

  /**
   * Previews total discount for given voucher codes on a booking (no redemption).
   */
  public async previewBookingDiscount(
    voucher_codes: string[],
    service_id: number,
    subtotal: number,
    userId: number,
    num_slots?: number,
    addons_total?: number,
  ): Promise<{
    total_discount: number;
    breakdown: Array<{ code: string; discount: number; include_addons_flag: boolean }>;
    new_total: number;
  }> {
    const serviceEntity: ServiceEntity | null =
      await this.serviceEntityRepository.findOne({
        where: { id: service_id },
        select: ['id', 'service_type'],
      });
    const stacked = await this.applyStackedVoucherDiscounts({
      codes: voucher_codes,
      userId,
      applicableSubtotal: subtotal,
      addons_total: addons_total,
      numSlots: num_slots,
      serviceIds: [service_id],
      serviceType: serviceEntity?.service_type ?? undefined,
      allowDuplicateCodes: true,
    });
    const total_discount = stacked.totalDiscountAmount;
    const breakdown = stacked.appliedVouchers.map((v) => ({
      code: v.voucherCode,
      discount: v.discountAmount,
      include_addons_flag: v.includeAddons,
    }));
    const new_total = Math.max(0, subtotal - total_discount);
    return { total_discount, breakdown, new_total };
  }

  private async validateVoucherForUser(
    input: ValidateSingleVoucherInput,
    userId: number,
  ): Promise<VoucherValidationResult> {
    const normalizedCode: string = this.normalizeCode(input.code);
    const voucher: Voucher | null =
      await this.voucherRepository.findByCode(normalizedCode);
    if (!voucher) {
      return { is_valid: false, message: 'Invalid voucher code' };
    }
    if (voucher.status !== VoucherStatusEnum.ACTIVE) {
      return { is_valid: false, message: 'Voucher is inactive' };
    }
    const now: Date = new Date();
    if (voucher.starts_at && voucher.starts_at > now) {
      return {
        is_valid: false,
        message: 'Voucher is not yet active',
      };
    }
    if (voucher.expires_at && voucher.expires_at < now) {
      return { is_valid: false, message: 'This voucher has expired' };
    }
    if (
      voucher.seller_id !== null &&
      voucher.seller_id !== undefined &&
      input.seller_id !== undefined &&
      voucher.seller_id !== input.seller_id
    ) {
      return {
        is_valid: false,
        message: 'Voucher is not valid for this seller',
      };
    }
    // Resolve the subtotal that this voucher's discount should act on.
    // When include_addons_flag is false (default), add-on charges are excluded
    // from the discount base and the customer pays them in full.
    const addonsTotal = input.addons_total ?? 0;
    const effectiveSubtotal =
      voucher.include_addons_flag || addonsTotal === 0
        ? input.applicable_subtotal
        : Math.max(0, input.applicable_subtotal - addonsTotal);
    const resolvedInput: ValidateSingleVoucherInput =
      effectiveSubtotal !== input.applicable_subtotal
        ? { ...input, applicable_subtotal: effectiveSubtotal }
        : input;

    if (resolvedInput.applicable_subtotal < voucher.min_order_amount) {
      return {
        is_valid: false,
        message: `Minimum order of ${voucher.min_order_amount} required`,
      };
    }
    // total_limit and per_user_limit are enforced at redemption time inside
    // recordVoucherRedemption (§10). Validation only checks basic eligibility;
    // the pessimistic-lock gate in the redemption helper handles concurrency-safe
    // cap enforcement.
    // per_hours vouchers are valid for ANY venue-type service.
    // They bypass the voucher_services pivot table and instead rely solely on
    // the service_type check so new court venues are covered automatically.
    if (voucher.discount_type === VoucherDiscountTypeEnum.PER_HOURS) {
      if (input.service_type !== 'venue') {
        return {
          is_valid: false,
          message: 'Only available for venue-type court services',
        };
      }
      // Venue service confirmed — skip pivot restriction check and compute discount.
      const discountAmount: number = this.calculateDiscountAmount(
        voucher,
        await this.resolveDiscountBaseAmount(voucher, resolvedInput),
        resolvedInput.shipping_fee ?? 0,
        resolvedInput.num_slots,
        resolvedInput.original_subtotal,
      );
      return {
        is_valid: true,
        message: 'Voucher is valid',
        discount_amount: discountAmount,
        include_addons_flag: voucher.include_addons_flag ?? false,
        voucher,
      };
    }

    const restrictionResult: VoucherValidationResult =
      await this.validateVoucherRestrictions(
        voucher.id,
        voucher.scope,
        resolvedInput,
        voucher.service_id,
      );
    if (!restrictionResult.is_valid) {
      return restrictionResult;
    }
    const discountAmount: number = this.calculateDiscountAmount(
      voucher,
      await this.resolveDiscountBaseAmount(voucher, resolvedInput),
      resolvedInput.shipping_fee ?? 0,
      resolvedInput.num_slots,
      resolvedInput.original_subtotal,
    );
    return {
      is_valid: true,
      message: 'Voucher is valid',
      discount_amount: discountAmount,
      include_addons_flag: voucher.include_addons_flag ?? false,
      voucher,
    };
  }
  private async validateVoucherRestrictions(
    voucherId: number,
    voucherScope: VoucherScopeEnum,
    input: ValidateSingleVoucherInput,
    legacyServiceId?: number | null,
  ): Promise<VoucherValidationResult> {
    const categoryRestrictions: VoucherCategoryEntity[] =
      await this.voucherCategoryRepository.find({
        where: { voucher_id: voucherId },
      });
    if (categoryRestrictions.length > 0) {
      const inputCategoryIds: number[] = input.category_ids ?? [];
      const restrictedCategoryIds: number[] = categoryRestrictions.map(
        (item: VoucherCategoryEntity) => item.category_id,
      );
      const hasCategoryMatch: boolean = inputCategoryIds.some(
        (categoryId: number) => restrictedCategoryIds.includes(categoryId),
      );
      if (!hasCategoryMatch) {
        return {
          is_valid: false,
          message: 'Voucher is not valid for selected categories',
        };
      }
    }
    const productRestrictions: VoucherProductEntity[] =
      await this.voucherProductRepository.find({
        where: { voucher_id: voucherId },
      });
    if (productRestrictions.length > 0) {
      const inputProductIds: number[] = input.product_ids ?? [];
      const restrictedProductIds: number[] = productRestrictions.map(
        (item: VoucherProductEntity) => item.product_id,
      );
      const hasProductMatch: boolean = inputProductIds.some(
        (productId: number) => restrictedProductIds.includes(productId),
      );
      if (!hasProductMatch) {
        return {
          is_valid: false,
          message: 'Voucher is not valid for selected products',
        };
      }
    }
    const serviceCategoryRestrictions: VoucherServiceCategoryEntity[] =
      await this.voucherServiceCategoryRepository.find({
        where: { voucher_id: voucherId },
      });
    if (serviceCategoryRestrictions.length > 0) {
      const inputServiceCategoryIds: number[] =
        input.service_category_ids ?? [];
      const restrictedServiceCategoryIds: number[] =
        serviceCategoryRestrictions.map(
          (item: VoucherServiceCategoryEntity) => item.service_category_id,
        );
      const hasServiceCategoryMatch: boolean = inputServiceCategoryIds.some(
        (serviceCategoryId: number) =>
          restrictedServiceCategoryIds.includes(serviceCategoryId),
      );
      if (!hasServiceCategoryMatch) {
        return {
          is_valid: false,
          message: 'Voucher is not valid for selected service categories',
        };
      }
    }
    const serviceRestrictions: VoucherServiceEntity[] =
      await this.voucherServiceRepository.find({
        where: { voucher_id: voucherId },
      });
    if (serviceRestrictions.length > 0) {
      const inputServiceIds: number[] = input.service_ids ?? [];
      const restrictedServiceIds: number[] = serviceRestrictions.map(
        (item: VoucherServiceEntity) => item.service_id,
      );
      const hasServiceMatch: boolean = inputServiceIds.some(
        (serviceId: number) => restrictedServiceIds.includes(serviceId),
      );
      if (!hasServiceMatch) {
        return {
          is_valid: false,
          message: 'Voucher is not valid for selected services',
        };
      }
    } else if (legacyServiceId != null) {
      // Legacy fallback: voucher has service_id set directly but no rows in voucher_services.
      // Treat the single service_id column as the sole service restriction.
      const inputServiceIds: number[] = input.service_ids ?? [];
      if (!inputServiceIds.includes(legacyServiceId)) {
        return {
          is_valid: false,
          message: 'Voucher is not valid for this service',
        };
      }
    } else if (voucherScope === VoucherScopeEnum.SERVICES) {
      // Safety guard: service-scoped vouchers must be linked to at least one
      // service (or legacy service_id). Otherwise they could apply broadly.
      return {
        is_valid: false,
        message: 'Voucher is not configured for any eligible service',
      };
    }
    return { is_valid: true };
  }
  private async resolveDiscountBaseAmount(
    voucher: Voucher,
    input: ValidateSingleVoucherInput,
  ): Promise<number> {
    if (voucher.discount_type === VoucherDiscountTypeEnum.SHIPPING) {
      return input.applicable_subtotal;
    }
    if (voucher.discount_type === VoucherDiscountTypeEnum.PER_HOURS) {
      const serviceIds: number[] = input.service_ids ?? [];
      const firstServiceId = serviceIds[0];
      if (firstServiceId) {
        const service = await this.serviceEntityRepository.findOne({
          where: { id: firstServiceId },
          select: ['id', 'hourly_rate'],
        });
        const hourlyRate = service?.hourly_rate
          ? Number(service.hourly_rate)
          : 0;
        const computed = hourlyRate * Number(voucher.discount_value);
        return Math.min(computed, input.applicable_subtotal);
      }
      return input.applicable_subtotal;
    }
    if (
      voucher.scope !== VoucherScopeEnum.PRODUCTS &&
      voucher.scope !== VoucherScopeEnum.CATEGORIES
    ) {
      return input.applicable_subtotal;
    }
    const checkoutVariants: VoucherValidationCheckoutVariantContext[] =
      input.checkout_variants ?? [];
    if (checkoutVariants.length === 0) {
      return input.applicable_subtotal;
    }
    if (voucher.scope === VoucherScopeEnum.PRODUCTS) {
      const voucherProducts: VoucherProductEntity[] =
        await this.voucherProductRepository.find({
          where: { voucher_id: voucher.id },
        });
      if (voucherProducts.length === 0) {
        return input.applicable_subtotal;
      }
      const restrictedProductIds: Set<number> = new Set(
        voucherProducts.map((item: VoucherProductEntity) => item.product_id),
      );
      const eligibleVariants: VoucherValidationCheckoutVariantContext[] =
        checkoutVariants.filter(
          (variant: VoucherValidationCheckoutVariantContext) =>
            restrictedProductIds.has(variant.product_id),
        );
      return this.calculateEligibleSubtotal(eligibleVariants);
    }
    const voucherCategories: VoucherCategoryEntity[] =
      await this.voucherCategoryRepository.find({
        where: { voucher_id: voucher.id },
      });
    if (voucherCategories.length === 0) {
      return input.applicable_subtotal;
    }
    const restrictedCategoryIds: Set<number> = new Set(
      voucherCategories.map((item: VoucherCategoryEntity) => item.category_id),
    );
    const eligibleVariants: VoucherValidationCheckoutVariantContext[] =
      checkoutVariants.filter(
        (variant: VoucherValidationCheckoutVariantContext) =>
          variant.category_ids.some((categoryId: number) =>
            restrictedCategoryIds.has(categoryId),
          ),
      );
    return this.calculateEligibleSubtotal(eligibleVariants);
  }
  private async findPrioritizedVoucherValidationCandidate(input: {
    pendingCodes: string[];
    userId: number;
    remainingSubtotal: number;
    remainingShippingFee: number;
    checkoutContext: VoucherValidationCheckoutContext;
  }): Promise<{
    candidate?: PrioritizedVoucherValidationCandidate;
    invalidResult?: VoucherValidationResult;
  }> {
    let prioritizedCandidate: PrioritizedVoucherValidationCandidate | undefined;
    let invalidResult: VoucherValidationResult | undefined;
    for (const code of input.pendingCodes) {
      const validationInput: ValidateSingleVoucherInput = {
        code,
        applicable_subtotal: input.remainingSubtotal,
        shipping_fee: input.remainingShippingFee,
        seller_id: input.checkoutContext.sellerId,
        category_ids: input.checkoutContext.categoryIds,
        product_ids: input.checkoutContext.productIds,
        service_category_ids: input.checkoutContext.serviceCategoryIds,
        service_ids: input.checkoutContext.serviceIds,
        checkout_variants: input.checkoutContext.checkoutVariants,
      };
      const validationResult: VoucherValidationResult =
        await this.validateVoucherForUser(validationInput, input.userId);
      if (!validationResult.is_valid || !validationResult.voucher) {
        if (!invalidResult) {
          invalidResult = validationResult;
        }
        continue;
      }
      const maxApplicableAmount: number =
        validationResult.voucher.discount_type ===
        VoucherDiscountTypeEnum.SHIPPING
          ? input.remainingShippingFee
          : input.remainingSubtotal;
      const discountAmount: number = Math.min(
        validationResult.discount_amount ?? 0,
        maxApplicableAmount,
      );
      if (discountAmount <= 0) {
        continue;
      }
      const currentCandidate: PrioritizedVoucherValidationCandidate = {
        code,
        voucher: validationResult.voucher,
        discountAmount,
      };
      if (
        !prioritizedCandidate ||
        this.shouldPrioritizeVoucherCandidate({
          currentCandidate,
          prioritizedCandidate,
        })
      ) {
        prioritizedCandidate = currentCandidate;
      }
    }
    return { candidate: prioritizedCandidate, invalidResult };
  }
  private shouldPrioritizeVoucherCandidate(input: {
    currentCandidate: PrioritizedVoucherValidationCandidate;
    prioritizedCandidate: PrioritizedVoucherValidationCandidate;
  }): boolean {
    if (
      input.currentCandidate.discountAmount >
      input.prioritizedCandidate.discountAmount
    ) {
      return true;
    }
    if (
      input.currentCandidate.discountAmount <
      input.prioritizedCandidate.discountAmount
    ) {
      return false;
    }
    if (
      input.currentCandidate.voucher.discount_type !==
        VoucherDiscountTypeEnum.SHIPPING &&
      input.prioritizedCandidate.voucher.discount_type ===
        VoucherDiscountTypeEnum.SHIPPING
    ) {
      return true;
    }
    if (
      input.currentCandidate.voucher.discount_type ===
        VoucherDiscountTypeEnum.SHIPPING &&
      input.prioritizedCandidate.voucher.discount_type !==
        VoucherDiscountTypeEnum.SHIPPING
    ) {
      return false;
    }
    return (
      input.currentCandidate.code.localeCompare(
        input.prioritizedCandidate.code,
      ) < 0
    );
  }
  private extractLeastSellingPrice(
    variants: VoucherValidationCheckoutVariantContext[],
  ): number {
    if (variants.length === 0) {
      return 0;
    }
    return variants.reduce(
      (leastPrice: number, variant: VoucherValidationCheckoutVariantContext) =>
        Math.min(leastPrice, variant.selling_price),
      variants[0].selling_price,
    );
  }
  private calculateEligibleSubtotal(
    variants: VoucherValidationCheckoutVariantContext[],
  ): number {
    if (variants.length === 0) {
      return 0;
    }
    return variants.reduce(
      (sum: number, variant: VoucherValidationCheckoutVariantContext) =>
        sum + variant.selling_price * variant.quantity,
      0,
    );
  }
  private calculateDiscountAmount(
    voucher: Voucher,
    applicableSubtotal: number,
    shippingFee: number,
    _numSlots?: number,
    _originalSubtotal?: number,
  ): number {
    void _numSlots;
    void _originalSubtotal;

    if (applicableSubtotal <= 0 && shippingFee <= 0) {
      return 0;
    }
    if (voucher.discount_type === VoucherDiscountTypeEnum.SHIPPING) {
      return Math.min(voucher.discount_value, shippingFee);
    }
    if (
      voucher.discount_type === VoucherDiscountTypeEnum.FIXED ||
      voucher.discount_type === VoucherDiscountTypeEnum.B1T1
    ) {
      return Math.min(voucher.discount_value, applicableSubtotal);
    }
    if (voucher.discount_type === VoucherDiscountTypeEnum.PER_HOURS) {
      // resolveDiscountBaseAmount already computed hourlyRate × hours, capped at booking subtotal
      return applicableSubtotal;
    }
    const rawPercentageDiscount: number =
      (voucher.discount_value / 100) * applicableSubtotal;
    const cappedDiscount: number = Math.min(
      rawPercentageDiscount,
      voucher.max_discount_cap ?? rawPercentageDiscount,
    );
    return Math.min(cappedDiscount, applicableSubtotal);
  }
  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }
  private extractNormalizedVoucherCodes(
    codes: string[],
    options?: { allowDuplicates?: boolean },
  ): string[] {
    const normalizedCodes: string[] = codes
      .map((code: string) => this.normalizeCode(code))
      .filter((code: string) => code.length > 0);
    if (options?.allowDuplicates) {
      return normalizedCodes;
    }
    return Array.from(new Set(normalizedCodes));
  }
  private async extractRequestedVoucherCodes(
    voucherIds: number[],
  ): Promise<string[]> {
    const uniqueVoucherIds: number[] = this.extractUniqueIds(voucherIds);
    const vouchers: Array<Voucher | null> = await Promise.all(
      uniqueVoucherIds.map((voucherId: number) =>
        this.voucherRepository.findById(voucherId),
      ),
    );
    const missingVoucherIds: number[] = uniqueVoucherIds.filter(
      (_voucherId: number, index: number) => !vouchers[index],
    );
    if (missingVoucherIds.length > 0) {
      throw new BadRequestException({
        message: 'Some vouchers are invalid',
        vouchers: missingVoucherIds,
      });
    }
    const requestedCodes: string[] = vouchers
      .filter((voucher: Voucher | null): voucher is Voucher => voucher !== null)
      .map((voucher: Voucher) => voucher.code);
    return this.extractNormalizedVoucherCodes(requestedCodes);
  }
  private async ensureUserHasClaimedRequestedVouchers(input: {
    voucherIds: number[];
    userId: number;
  }): Promise<void> {
    const claimedUserVouchers: UserVoucherEntity[] =
      input.voucherIds.length > 0
        ? await this.userVoucherRepository.find({
            where: {
              user_id: input.userId,
              voucher_id: In(input.voucherIds),
              status: UserVoucherStatusEnum.AVAILABLE,
            },
            select: ['voucher_id'],
          })
        : [];
    const claimedVoucherIds: Set<number> = new Set(
      claimedUserVouchers.map(
        (userVoucher: UserVoucherEntity) => userVoucher.voucher_id,
      ),
    );
    const unclaimedVoucherIds: number[] = input.voucherIds.filter(
      (voucherId: number) => !claimedVoucherIds.has(voucherId),
    );
    if (unclaimedVoucherIds.length === 0) {
      return;
    }
    throw new BadRequestException({
      message: 'Some vouchers are not yet claimed by the user',
      vouchers: unclaimedVoucherIds,
    });
  }
  private async buildVoucherValidationCheckoutContext(
    input: ValidateVoucherDto,
  ): Promise<VoucherValidationCheckoutContext> {
    const normalizedVariants: VoucherValidationCheckoutVariant[] =
      this.mergeVariantQuantities(input.variants ?? []);
    const requestedServiceIds: number[] = this.extractUniqueIds(
      input.service_ids ?? [],
    );
    if (normalizedVariants.length === 0 && requestedServiceIds.length === 0) {
      throw new BadRequestException(
        'Either variants or service_ids must be provided',
      );
    }
    const variantIds: number[] = normalizedVariants.map(
      (variant: VoucherValidationCheckoutVariant) => variant.variant_id,
    );
    const variantEntities: ProductVariantEntity[] =
      variantIds.length > 0
        ? await this.productVariantRepository.find({
            where: { id: In(variantIds) },
            select: ['id', 'product_id', 'selling_price'],
          })
        : [];
    const validVariantIds: number[] = variantEntities.map(
      (variant: ProductVariantEntity) => variant.id,
    );
    this.ensureAllIdsAreValid({
      requestedIds: variantIds,
      validIds: validVariantIds,
      fieldName: 'variants',
      message: 'Some variants are invalid',
    });
    const variantEntityMap: Map<number, ProductVariantEntity> = new Map(
      variantEntities.map((variant: ProductVariantEntity) => [
        variant.id,
        variant,
      ]),
    );
    const applicableSubtotal: number = normalizedVariants.reduce(
      (sum: number, item: VoucherValidationCheckoutVariant) => {
        const variantEntity: ProductVariantEntity = variantEntityMap.get(
          item.variant_id,
        ) as ProductVariantEntity;
        return sum + Number(variantEntity.selling_price) * item.quantity;
      },
      0,
    );
    const productIds: number[] = this.extractUniqueIds(
      normalizedVariants.map(
        (item: VoucherValidationCheckoutVariant) =>
          (variantEntityMap.get(item.variant_id) as ProductVariantEntity)
            .product_id,
      ),
    );
    const productEntities: ProductEntity[] =
      productIds.length > 0
        ? await this.productRepository.find({
            where: { id: In(productIds) },
            select: ['id', 'seller_id'],
          })
        : [];
    this.ensureAllIdsAreValid({
      requestedIds: productIds,
      validIds: productEntities.map((entity: ProductEntity) => entity.id),
      fieldName: 'variants',
      message: 'Some variants reference missing products',
    });
    const productCategoryEntities: ProductCategoryEntity[] =
      productIds.length > 0
        ? await this.productCategoryRepository.find({
            where: { product_id: In(productIds) },
            select: ['product_id', 'category_id'],
          })
        : [];
    const productCategoryMap: Map<number, number[]> = new Map<
      number,
      number[]
    >();
    for (const productCategory of productCategoryEntities) {
      const currentCategoryIds: number[] =
        productCategoryMap.get(productCategory.product_id) ?? [];
      currentCategoryIds.push(productCategory.category_id);
      productCategoryMap.set(productCategory.product_id, currentCategoryIds);
    }
    const categoryIds: number[] = this.extractUniqueIds(
      productCategoryEntities.map(
        (entity: ProductCategoryEntity) => entity.category_id,
      ),
    );
    const serviceEntities: ServiceEntity[] =
      requestedServiceIds.length > 0
        ? await this.serviceEntityRepository.find({
            where: { id: In(requestedServiceIds) },
            select: ['id', 'seller_id', 'category_id'],
          })
        : [];
    this.ensureAllIdsAreValid({
      requestedIds: requestedServiceIds,
      validIds: serviceEntities.map((entity: ServiceEntity) => entity.id),
      fieldName: 'service_ids',
      message: 'Some service_ids are invalid',
    });
    const serviceCategoryIds: number[] = this.extractUniqueIds(
      serviceEntities
        .filter(
          (entity: ServiceEntity) =>
            entity.category_id !== null && entity.category_id !== undefined,
        )
        .map((entity: ServiceEntity) => entity.category_id as number),
    );
    const sellerIds: number[] = this.extractUniqueIds([
      ...productEntities.map((entity: ProductEntity) => entity.seller_id),
      ...serviceEntities.map((entity: ServiceEntity) => entity.seller_id),
    ]);
    if (sellerIds.length > 1) {
      throw new BadRequestException(
        'Checkout items must belong to a single seller for voucher validation',
      );
    }
    const checkoutVariants: VoucherValidationCheckoutVariantContext[] =
      normalizedVariants.map((item: VoucherValidationCheckoutVariant) => {
        const variantEntity: ProductVariantEntity = variantEntityMap.get(
          item.variant_id,
        ) as ProductVariantEntity;
        return {
          variant_id: item.variant_id,
          product_id: variantEntity.product_id,
          quantity: item.quantity,
          selling_price: Number(variantEntity.selling_price),
          category_ids: this.extractUniqueIds(
            productCategoryMap.get(variantEntity.product_id) ?? [],
          ),
        };
      });
    return {
      applicableSubtotal: Math.round(applicableSubtotal * 100) / 100,
      shippingFee: input.shipping_fee,
      productIds,
      categoryIds,
      sellerId: sellerIds[0],
      serviceCategoryIds,
      serviceIds: requestedServiceIds,
      checkoutVariants,
    };
  }
  private mergeVariantQuantities(
    variants: VoucherValidationCheckoutVariant[],
  ): VoucherValidationCheckoutVariant[] {
    const variantQuantityMap: Map<number, number> = new Map<number, number>();
    for (const variant of variants) {
      const currentQuantity: number =
        variantQuantityMap.get(variant.variant_id) ?? 0;
      variantQuantityMap.set(
        variant.variant_id,
        currentQuantity + variant.quantity,
      );
    }
    return Array.from(variantQuantityMap.entries()).map(
      ([variantId, quantity]: [number, number]) => ({
        variant_id: variantId,
        quantity,
      }),
    );
  }
  private ensureVoucherDatesAreValid(
    startsAt?: string | null,
    expiresAt?: string | null,
  ): void {
    if (!startsAt && !expiresAt) return;
    if ((startsAt && !expiresAt) || (!startsAt && expiresAt)) {
      throw new BadRequestException(
        'Both start date and end date must be set together, or both must be empty',
      );
    }
    const startsDate: Date = new Date(startsAt!);
    const expiresDate: Date = new Date(expiresAt!);
    if (startsDate.getTime() > expiresDate.getTime()) {
      throw new BadRequestException('End date must be after start date');
    }
  }
  private ensureVoucherDiscountShapeIsValid(
    discountType: VoucherDiscountTypeEnum,
    maxDiscountCap?: number | null,
  ): void {
    if (
      discountType === VoucherDiscountTypeEnum.PERCENTAGE &&
      (maxDiscountCap === undefined || maxDiscountCap === null)
    ) {
      throw new BadRequestException(
        'Percentage vouchers require max_discount_cap',
      );
    }
    if (
      discountType !== VoucherDiscountTypeEnum.PERCENTAGE &&
      maxDiscountCap !== undefined &&
      maxDiscountCap !== null
    ) {
      throw new BadRequestException(
        'Only percentage vouchers can define max_discount_cap',
      );
    }
  }

  private ensureIncludeAddonsFlagIsValid(
    scope: VoucherScopeEnum | undefined,
    includeAddonsFlag?: boolean | null,
  ): void {
    if (includeAddonsFlag !== true) return;
    if (
      scope !== VoucherScopeEnum.SERVICES &&
      scope !== VoucherScopeEnum.SERVICE_CATEGORIES
    ) {
      throw new BadRequestException(
        'include_addons_flag can only be true when scope is services or service_categories',
      );
    }
  }

  private resolveIncludeAddonsFlag(
    scope: VoucherScopeEnum | undefined,
    includeAddonsFlag?: boolean | null,
  ): boolean {
    if (
      scope !== VoucherScopeEnum.SERVICES &&
      scope !== VoucherScopeEnum.SERVICE_CATEGORIES
    ) {
      return false;
    }
    return includeAddonsFlag ?? false;
  }

  private async hasClaimedUserVouchers(voucherId: number): Promise<boolean> {
    const count: number = await this.userVoucherRepository.count({
      where: { voucher_id: voucherId },
    });
    return count > 0;
  }

  private extractCurrentScopeIds(voucher: Voucher): number[] {
    switch (voucher.scope) {
      case VoucherScopeEnum.CATEGORIES:
        return (voucher.voucher_categories ?? []).map((r) => r.category_id);
      case VoucherScopeEnum.PRODUCTS:
        return (voucher.voucher_products ?? []).map((r) => r.product_id);
      case VoucherScopeEnum.SERVICES:
        return (voucher.voucher_services ?? []).map((r) => r.service_id);
      case VoucherScopeEnum.SERVICE_CATEGORIES:
        return (voucher.voucher_service_categories ?? []).map(
          (r) => r.service_category_id,
        );
      default:
        return [];
    }
  }

  private extractPatchScopeIds(
    scope: VoucherScopeEnum,
    input: UpdateAdminVoucherDto | UpdateSellerVoucherDto,
  ): { field: string; ids: number[] } | null {
    switch (scope) {
      case VoucherScopeEnum.CATEGORIES:
        return input.category_ids !== undefined
          ? { field: 'category_ids', ids: input.category_ids }
          : null;
      case VoucherScopeEnum.PRODUCTS:
        return input.product_ids !== undefined
          ? { field: 'product_ids', ids: input.product_ids }
          : null;
      case VoucherScopeEnum.SERVICES:
        return input.service_ids !== undefined
          ? { field: 'service_ids', ids: input.service_ids }
          : null;
      case VoucherScopeEnum.SERVICE_CATEGORIES:
        return input.service_category_ids !== undefined
          ? {
              field: 'service_category_ids',
              ids: input.service_category_ids,
            }
          : null;
      default:
        return null;
    }
  }

  private async validateAndComputeScopeDiff(
    currentVoucher: Voucher,
    input: UpdateAdminVoucherDto | UpdateSellerVoucherDto,
  ): Promise<{
    field: string;
    added: number[];
    removed: number[];
  } | null> {
    const patch = this.extractPatchScopeIds(currentVoucher.scope, input);
    if (!patch) return null;
    const currentIds: number[] = this.extractCurrentScopeIds(currentVoucher);
    const patchSet: Set<number> = new Set(patch.ids);
    const currentSet: Set<number> = new Set(currentIds);
    const added: number[] = [...patchSet].filter((x) => !currentSet.has(x));
    const removed: number[] = [...currentSet].filter((x) => !patchSet.has(x));
    if (added.length === 0 && removed.length === 0) return null;
    if (removed.length > 0) {
      const hasClaims: boolean = await this.hasClaimedUserVouchers(
        currentVoucher.id,
      );
      if (hasClaims) {
        throw new BadRequestException({
          message: 'Voucher eligible items cannot be removed after a claim',
          errors: [
            {
              field: patch.field,
              reason: 'append_only_after_claim',
              detail: `Cannot remove ${removed.length} existing ${patch.field}: voucher has already been claimed by at least one user. New items may still be added.`,
              removed_ids: removed,
            },
          ],
        });
      }
    }
    return { field: patch.field, added, removed };
  }

  private async applyScopeDiff(
    voucherId: number,
    currentVoucher: Voucher,
    diff: { added: number[]; removed: number[] },
    manager: EntityManager,
  ): Promise<void> {
    const { added, removed } = diff;
    const sellerId: number | null = currentVoucher.seller_id ?? null;
    const isSellerVoucher: boolean = sellerId !== null;
    const categoryRepo = manager.getRepository(VoucherCategoryEntity);
    const productRepo = manager.getRepository(VoucherProductEntity);
    const serviceRepo = manager.getRepository(VoucherServiceEntity);
    const serviceCategoryRepo = manager.getRepository(VoucherServiceCategoryEntity);
    switch (currentVoucher.scope) {
      case VoucherScopeEnum.CATEGORIES: {
        if (removed.length > 0) {
          await categoryRepo.delete({
            voucher_id: voucherId,
            category_id: In(removed),
          });
        }
        if (added.length > 0) {
          const validIds: number[] = isSellerVoucher
            ? await this.findValidSellerCategoryIds({
                sellerId: sellerId as number,
                categoryIds: added,
              })
            : await this.findValidAdminCategoryIds(added);
          if (validIds.length > 0) {
            await categoryRepo.save(
              validIds.map((categoryId: number) =>
                categoryRepo.create({
                  voucher_id: voucherId,
                  category_id: categoryId,
                }),
              ),
            );
          }
        }
        return;
      }
      case VoucherScopeEnum.PRODUCTS: {
        if (removed.length > 0) {
          await productRepo.delete({
            voucher_id: voucherId,
            product_id: In(removed),
          });
        }
        if (added.length > 0) {
          const validIds: number[] = isSellerVoucher
            ? await this.findValidSellerProductIds({
                sellerId: sellerId as number,
                productIds: added,
              })
            : await this.findValidAdminProductIds(added);
          if (validIds.length > 0) {
            await productRepo.save(
              validIds.map((productId: number) =>
                productRepo.create({
                  voucher_id: voucherId,
                  product_id: productId,
                }),
              ),
            );
          }
        }
        return;
      }
      case VoucherScopeEnum.SERVICES: {
        if (removed.length > 0) {
          await serviceRepo.delete({
            voucher_id: voucherId,
            service_id: In(removed),
          });
        }
        if (added.length > 0) {
          const validIds: number[] = isSellerVoucher
            ? await this.findValidSellerServiceIds({
                sellerId: sellerId as number,
                serviceIds: added,
              })
            : await this.findValidAdminServiceIds(added);
          if (validIds.length > 0) {
            await serviceRepo.save(
              validIds.map((serviceId: number) =>
                serviceRepo.create({
                  voucher_id: voucherId,
                  service_id: serviceId,
                }),
              ),
            );
          }
        }
        return;
      }
      case VoucherScopeEnum.SERVICE_CATEGORIES: {
        // SERVICE_CATEGORIES is platform-admin only — seller vouchers must not
        // reach this branch. Guard here as defence-in-depth.
        if (isSellerVoucher) {
          throw new BadRequestException(
            'SERVICE_CATEGORIES scope is not available for seller vouchers.',
          );
        }
        if (removed.length > 0) {
          await serviceCategoryRepo.delete({
            voucher_id: voucherId,
            service_category_id: In(removed),
          });
        }
        if (added.length > 0) {
          const validIds: number[] = isSellerVoucher
            ? await this.findValidSellerServiceCategoryIds({
                sellerId: sellerId as number,
                serviceCategoryIds: added,
              })
            : await this.findValidAdminServiceCategoryIds(added);
          if (validIds.length > 0) {
            await serviceCategoryRepo.save(
              validIds.map((serviceCategoryId: number) =>
                serviceCategoryRepo.create({
                  voucher_id: voucherId,
                  service_category_id: serviceCategoryId,
                }),
              ),
            );
          }
        }
        return;
      }
    }
  }

  private async ensurePerHoursVoucherIsValid(
    discountType: VoucherDiscountTypeEnum,
    scope: string | undefined,
    serviceIds: number[] | undefined,
  ): Promise<void> {
    if (discountType !== VoucherDiscountTypeEnum.PER_HOURS) return;

    if (scope !== VoucherScopeEnum.SERVICES) {
      throw new BadRequestException(
        'Per-hour vouchers can only be created with services scope',
      );
    }

    if (!serviceIds || serviceIds.length === 0) {
      throw new BadRequestException(
        'Per-hour vouchers require at least one eligible service',
      );
    }

    const services: ServiceEntity[] = await this.serviceEntityRepository.find({
      where: { id: In(serviceIds) },
      select: ['id', 'hourly_rate'],
    });

    const missingRate = services.filter(
      (s) => s.hourly_rate === null || s.hourly_rate === undefined,
    );
    if (missingRate.length > 0) {
      throw new BadRequestException(
        'Some of the selected services do not support per-hour pricing. Please select only booking services with an hourly rate.',
      );
    }
  }
  private ensureAdminRestrictionPayloadIsValid(
    input: CreateAdminVoucherDto,
  ): void {
    const scope = input.scope ?? VoucherScopeEnum.CATEGORIES;
    this.ensureAdminScopeIsAllowed(scope);
    if (scope === VoucherScopeEnum.CATEGORIES) {
      if (!input.category_ids || input.category_ids.length === 0) {
        throw new BadRequestException(
          'category_ids is required when scope is categories',
        );
      }
      return;
    }
    if (scope === VoucherScopeEnum.PRODUCTS) {
      if (!input.product_ids || input.product_ids.length === 0) {
        throw new BadRequestException(
          'product_ids is required when scope is products',
        );
      }
      return;
    }
    if (scope === VoucherScopeEnum.SERVICES) {
      if (
        input.service_id == null &&
        (!input.service_ids || input.service_ids.length === 0)
      ) {
        throw new BadRequestException(
          'service_ids is required when scope is services',
        );
      }
      return;
    }
    if (scope === VoucherScopeEnum.SERVICE_CATEGORIES) {
      if (
        !input.service_category_ids ||
        input.service_category_ids.length === 0
      ) {
        throw new BadRequestException(
          'service_category_ids is required when scope is service-categories',
        );
      }
      return;
    }
  }
  private ensureSellerRestrictionPayloadIsValid(
    input: CreateSellerVoucherDto,
  ): void {
    if (input.scope === VoucherScopeEnum.PRODUCTS) {
      if (!input.product_ids || input.product_ids.length === 0) {
        throw new BadRequestException(
          'product_ids is required when scope is products',
        );
      }
      if (input.category_ids && input.category_ids.length > 0) {
        throw new BadRequestException(
          'category_ids is not allowed when scope is products',
        );
      }
      return;
    }
    if (input.scope === VoucherScopeEnum.CATEGORIES) {
      if (!input.category_ids || input.category_ids.length === 0) {
        throw new BadRequestException(
          'category_ids is required when scope is categories',
        );
      }
      if (input.product_ids && input.product_ids.length > 0) {
        throw new BadRequestException(
          'product_ids is not allowed when scope is categories',
        );
      }
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICES) {
      const hasServiceId = input.service_id != null;
      const hasServiceIds =
        input.service_ids != null && input.service_ids.length > 0;
      if (!hasServiceId && !hasServiceIds) {
        throw new BadRequestException(
          'service_id or service_ids is required when scope is services',
        );
      }
      if (input.category_ids?.length || input.product_ids?.length) {
        throw new BadRequestException(
          'category_ids and product_ids are not allowed when scope is services',
        );
      }
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICE_CATEGORIES) {
      if (
        !input.service_category_ids ||
        input.service_category_ids.length === 0
      ) {
        throw new BadRequestException(
          'service_category_ids is required when scope is service-categories',
        );
      }
      if (
        input.category_ids?.length ||
        input.product_ids?.length ||
        input.service_id != null ||
        (input.service_ids?.length ?? 0) > 0
      ) {
        throw new BadRequestException(
          'category_ids, product_ids, service_id and service_ids are not allowed when scope is service-categories',
        );
      }
      return;
    }
  }
  private async createSellerVoucherRestrictionLinks(
    input: CreateSellerVoucherRestrictionLinksInput,
  ): Promise<void> {
    if (input.scope === VoucherScopeEnum.PRODUCTS) {
      const validProductIds: number[] = await this.findValidSellerProductIds({
        sellerId: input.sellerId,
        productIds: input.productIds ?? [],
      });
      await this.voucherProductRepository.save(
        validProductIds.map((productId: number) =>
          this.voucherProductRepository.create({
            voucher_id: input.voucherId,
            product_id: productId,
          }),
        ),
      );
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICES) {
      const validServiceIds: number[] = await this.findValidSellerServiceIds({
        sellerId: input.sellerId,
        serviceIds: input.serviceIds ?? [],
      });
      await this.voucherServiceRepository.save(
        validServiceIds.map((serviceId: number) =>
          this.voucherServiceRepository.create({
            voucher_id: input.voucherId,
            service_id: serviceId,
          }),
        ),
      );
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICE_CATEGORIES) {
      const validServiceCategoryIds: number[] =
        await this.findValidSellerServiceCategoryIds({
          sellerId: input.sellerId,
          serviceCategoryIds: input.serviceCategoryIds ?? [],
        });
      await this.voucherServiceCategoryRepository.save(
        validServiceCategoryIds.map((serviceCategoryId: number) =>
          this.voucherServiceCategoryRepository.create({
            voucher_id: input.voucherId,
            service_category_id: serviceCategoryId,
          }),
        ),
      );
      return;
    }
    const validCategoryIds: number[] = await this.findValidSellerCategoryIds({
      sellerId: input.sellerId,
      categoryIds: input.categoryIds ?? [],
    });
    await this.voucherCategoryRepository.save(
      validCategoryIds.map((categoryId: number) =>
        this.voucherCategoryRepository.create({
          voucher_id: input.voucherId,
          category_id: categoryId,
        }),
      ),
    );
  }
  private async createAdminVoucherRestrictionLinks(input: {
    voucherId: number;
    scope: VoucherScopeEnum;
    categoryIds?: number[];
    productIds?: number[];
    serviceIds?: number[];
    serviceCategoryIds?: number[];
  }): Promise<void> {
    if (input.scope === VoucherScopeEnum.CATEGORIES) {
      const validCategoryIds: number[] = await this.findValidAdminCategoryIds(
        input.categoryIds ?? [],
      );
      await this.voucherCategoryRepository.save(
        validCategoryIds.map((categoryId: number) =>
          this.voucherCategoryRepository.create({
            voucher_id: input.voucherId,
            category_id: categoryId,
          }),
        ),
      );
      return;
    }
    if (input.scope === VoucherScopeEnum.PRODUCTS) {
      const validProductIds: number[] = await this.findValidAdminProductIds(
        input.productIds ?? [],
      );
      await this.voucherProductRepository.save(
        validProductIds.map((productId: number) =>
          this.voucherProductRepository.create({
            voucher_id: input.voucherId,
            product_id: productId,
          }),
        ),
      );
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICES) {
      const validServiceIds: number[] = await this.findValidAdminServiceIds(
        input.serviceIds ?? [],
      );
      await this.voucherServiceRepository.save(
        validServiceIds.map((serviceId: number) =>
          this.voucherServiceRepository.create({
            voucher_id: input.voucherId,
            service_id: serviceId,
          }),
        ),
      );
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICE_CATEGORIES) {
      const validServiceCategoryIds: number[] =
        await this.findValidAdminServiceCategoryIds(
          input.serviceCategoryIds ?? [],
        );
      await this.voucherServiceCategoryRepository.save(
        validServiceCategoryIds.map((serviceCategoryId: number) =>
          this.voucherServiceCategoryRepository.create({
            voucher_id: input.voucherId,
            service_category_id: serviceCategoryId,
          }),
        ),
      );
      return;
    }
  }
  private async replaceSellerVoucherRestrictionLinks(
    input: UpdateSellerVoucherRestrictionLinksInput,
  ): Promise<void> {
    this.ensureSellerUpdateRestrictionPayloadIsValid(input);
    const shouldUpdateRestrictions: boolean =
      input.hasScopeInInput ||
      input.hasProductIdsInInput ||
      input.hasCategoryIdsInInput ||
      input.hasServiceIdsInInput ||
      input.hasServiceCategoryIdsInInput;
    if (!shouldUpdateRestrictions) {
      return;
    }
    if (input.scope === VoucherScopeEnum.PRODUCTS) {
      const validProductIds: number[] = await this.findValidSellerProductIds({
        sellerId: input.sellerId,
        productIds: input.productIds ?? [],
      });
      await this.voucherCategoryRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherServiceRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherServiceCategoryRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.syncVoucherProductLinks({
        voucherId: input.voucherId,
        nextProductIds: validProductIds,
      });
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICES) {
      const validServiceIds: number[] = await this.findValidSellerServiceIds({
        sellerId: input.sellerId,
        serviceIds: input.serviceIds ?? [],
      });
      await this.voucherCategoryRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherProductRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherServiceCategoryRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.syncVoucherServiceLinks({
        voucherId: input.voucherId,
        nextServiceIds: validServiceIds,
      });
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICE_CATEGORIES) {
      const validServiceCategoryIds: number[] =
        await this.findValidSellerServiceCategoryIds({
          sellerId: input.sellerId,
          serviceCategoryIds: input.serviceCategoryIds ?? [],
        });
      await this.voucherCategoryRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherProductRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherServiceRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.syncVoucherServiceCategoryLinks({
        voucherId: input.voucherId,
        nextServiceCategoryIds: validServiceCategoryIds,
      });
      return;
    }
    const validCategoryIds: number[] = await this.findValidSellerCategoryIds({
      sellerId: input.sellerId,
      categoryIds: input.categoryIds ?? [],
    });
    await this.voucherProductRepository.delete({ voucher_id: input.voucherId });
    await this.voucherServiceRepository.delete({
      voucher_id: input.voucherId,
    });
    await this.voucherServiceCategoryRepository.delete({
      voucher_id: input.voucherId,
    });
    await this.syncVoucherCategoryLinks({
      voucherId: input.voucherId,
      nextCategoryIds: validCategoryIds,
    });
  }
  private async replaceAdminVoucherRestrictionLinks(
    input: UpdateAdminVoucherRestrictionLinksInput,
  ): Promise<void> {
    this.ensureAdminUpdateRestrictionPayloadIsValid(input);
    const shouldUpdateRestrictions: boolean =
      input.hasScopeInInput ||
      input.hasCategoryIdsInInput ||
      input.hasProductIdsInInput ||
      input.hasServiceIdsInInput ||
      input.hasServiceCategoryIdsInInput;
    if (!shouldUpdateRestrictions) {
      return;
    }
    if (input.scope === VoucherScopeEnum.CATEGORIES) {
      const validCategoryIds: number[] = await this.findValidAdminCategoryIds(
        input.categoryIds ?? [],
      );
      await this.voucherProductRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherServiceRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherServiceCategoryRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.syncVoucherCategoryLinks({
        voucherId: input.voucherId,
        nextCategoryIds: validCategoryIds,
      });
      return;
    }
    if (input.scope === VoucherScopeEnum.PRODUCTS) {
      const validProductIds: number[] = await this.findValidAdminProductIds(
        input.productIds ?? [],
      );
      await this.voucherCategoryRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherServiceRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherServiceCategoryRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.syncVoucherProductLinks({
        voucherId: input.voucherId,
        nextProductIds: validProductIds,
      });
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICES) {
      const validServiceIds: number[] = await this.findValidAdminServiceIds(
        input.serviceIds ?? [],
      );
      await this.voucherCategoryRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherProductRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherServiceCategoryRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.syncVoucherServiceLinks({
        voucherId: input.voucherId,
        nextServiceIds: validServiceIds,
      });
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICE_CATEGORIES) {
      const validServiceCategoryIds: number[] =
        await this.findValidAdminServiceCategoryIds(
          input.serviceCategoryIds ?? [],
        );
      await this.voucherCategoryRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherProductRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.voucherServiceRepository.delete({
        voucher_id: input.voucherId,
      });
      await this.syncVoucherServiceCategoryLinks({
        voucherId: input.voucherId,
        nextServiceCategoryIds: validServiceCategoryIds,
      });
      return;
    }
  }
  private async syncVoucherCategoryLinks(input: {
    voucherId: number;
    nextCategoryIds: number[];
  }): Promise<void> {
    const existingLinks: VoucherCategoryEntity[] =
      await this.voucherCategoryRepository.find({
        where: { voucher_id: input.voucherId },
      });
    const existingCategoryIdSet: Set<number> = new Set(
      existingLinks.map((link: VoucherCategoryEntity) => link.category_id),
    );
    const nextCategoryIdSet: Set<number> = new Set(input.nextCategoryIds);
    const linkIdsToDelete: number[] = existingLinks
      .filter(
        (link: VoucherCategoryEntity) =>
          !nextCategoryIdSet.has(link.category_id),
      )
      .map((link: VoucherCategoryEntity) => link.id);
    if (linkIdsToDelete.length > 0) {
      await this.voucherCategoryRepository.delete({ id: In(linkIdsToDelete) });
    }
    const categoryIdsToCreate: number[] = input.nextCategoryIds.filter(
      (categoryId: number) => !existingCategoryIdSet.has(categoryId),
    );
    if (categoryIdsToCreate.length === 0) {
      return;
    }
    await this.voucherCategoryRepository.save(
      categoryIdsToCreate.map((categoryId: number) =>
        this.voucherCategoryRepository.create({
          voucher_id: input.voucherId,
          category_id: categoryId,
        }),
      ),
    );
  }
  private async syncVoucherProductLinks(input: {
    voucherId: number;
    nextProductIds: number[];
  }): Promise<void> {
    const existingLinks: VoucherProductEntity[] =
      await this.voucherProductRepository.find({
        where: { voucher_id: input.voucherId },
      });
    const existingProductIdSet: Set<number> = new Set(
      existingLinks.map((link: VoucherProductEntity) => link.product_id),
    );
    const nextProductIdSet: Set<number> = new Set(input.nextProductIds);
    const linkIdsToDelete: number[] = existingLinks
      .filter(
        (link: VoucherProductEntity) => !nextProductIdSet.has(link.product_id),
      )
      .map((link: VoucherProductEntity) => link.id);
    if (linkIdsToDelete.length > 0) {
      await this.voucherProductRepository.delete({ id: In(linkIdsToDelete) });
    }
    const productIdsToCreate: number[] = input.nextProductIds.filter(
      (productId: number) => !existingProductIdSet.has(productId),
    );
    if (productIdsToCreate.length === 0) {
      return;
    }
    await this.voucherProductRepository.save(
      productIdsToCreate.map((productId: number) =>
        this.voucherProductRepository.create({
          voucher_id: input.voucherId,
          product_id: productId,
        }),
      ),
    );
  }
  private async syncVoucherServiceLinks(input: {
    voucherId: number;
    nextServiceIds: number[];
  }): Promise<void> {
    const existingLinks: VoucherServiceEntity[] =
      await this.voucherServiceRepository.find({
        where: { voucher_id: input.voucherId },
      });
    const existingServiceIdSet: Set<number> = new Set(
      existingLinks.map((link: VoucherServiceEntity) => link.service_id),
    );
    const nextServiceIdSet: Set<number> = new Set(input.nextServiceIds);
    const linkIdsToDelete: number[] = existingLinks
      .filter(
        (link: VoucherServiceEntity) => !nextServiceIdSet.has(link.service_id),
      )
      .map((link: VoucherServiceEntity) => link.id);
    if (linkIdsToDelete.length > 0) {
      await this.voucherServiceRepository.delete({
        id: In(linkIdsToDelete),
      });
    }
    const serviceIdsToCreate: number[] = input.nextServiceIds.filter(
      (serviceId: number) => !existingServiceIdSet.has(serviceId),
    );
    if (serviceIdsToCreate.length === 0) {
      return;
    }
    await this.voucherServiceRepository.save(
      serviceIdsToCreate.map((serviceId: number) =>
        this.voucherServiceRepository.create({
          voucher_id: input.voucherId,
          service_id: serviceId,
        }),
      ),
    );
  }
  private async syncVoucherServiceCategoryLinks(input: {
    voucherId: number;
    nextServiceCategoryIds: number[];
  }): Promise<void> {
    const existingLinks: VoucherServiceCategoryEntity[] =
      await this.voucherServiceCategoryRepository.find({
        where: { voucher_id: input.voucherId },
      });
    const existingIdSet: Set<number> = new Set(
      existingLinks.map(
        (link: VoucherServiceCategoryEntity) => link.service_category_id,
      ),
    );
    const nextIdSet: Set<number> = new Set(input.nextServiceCategoryIds);
    const linkIdsToDelete: number[] = existingLinks
      .filter(
        (link: VoucherServiceCategoryEntity) =>
          !nextIdSet.has(link.service_category_id),
      )
      .map((link: VoucherServiceCategoryEntity) => link.id);
    if (linkIdsToDelete.length > 0) {
      await this.voucherServiceCategoryRepository.delete({
        id: In(linkIdsToDelete),
      });
    }
    const idsToCreate: number[] = input.nextServiceCategoryIds.filter(
      (id: number) => !existingIdSet.has(id),
    );
    if (idsToCreate.length === 0) {
      return;
    }
    await this.voucherServiceCategoryRepository.save(
      idsToCreate.map((serviceCategoryId: number) =>
        this.voucherServiceCategoryRepository.create({
          voucher_id: input.voucherId,
          service_category_id: serviceCategoryId,
        }),
      ),
    );
  }
  private async findValidAdminServiceCategoryIds(
    serviceCategoryIds: number[],
  ): Promise<number[]> {
    const uniqueIds: number[] = this.extractUniqueIds(serviceCategoryIds);
    const entities: ServiceCategoryEntity[] =
      await this.serviceCategoryEntityRepository.find({
        where: { id: In(uniqueIds) },
        select: ['id'],
      });
    const validIds: number[] = entities.map((e: ServiceCategoryEntity) => e.id);
    this.ensureAllIdsAreValid({
      requestedIds: uniqueIds,
      validIds,
      fieldName: 'service_category_ids',
      message: 'Some service_category_ids are invalid',
    });
    return validIds;
  }
  private async findValidAdminProductIds(
    productIds: number[],
  ): Promise<number[]> {
    const uniqueIds: number[] = this.extractUniqueIds(productIds);
    const entities: ProductEntity[] = await this.productRepository.find({
      where: { id: In(uniqueIds) },
      select: ['id'],
    });
    const validIds: number[] = entities.map((e: ProductEntity) => e.id);
    this.ensureAllIdsAreValid({
      requestedIds: uniqueIds,
      validIds,
      fieldName: 'product_ids',
      message: 'Some product_ids are invalid',
    });
    return validIds;
  }
  private async findValidAdminServiceIds(
    serviceIds: number[],
  ): Promise<number[]> {
    const uniqueIds: number[] = this.extractUniqueIds(serviceIds);
    const entities: ServiceEntity[] = await this.serviceEntityRepository.find({
      where: { id: In(uniqueIds) },
      select: ['id'],
    });
    const validIds: number[] = entities.map((e: ServiceEntity) => e.id);
    this.ensureAllIdsAreValid({
      requestedIds: uniqueIds,
      validIds,
      fieldName: 'service_ids',
      message: 'Some service_ids are invalid',
    });
    return validIds;
  }
  private async deleteAvailableUserVouchersByVoucherId(
    voucherId: number,
  ): Promise<void> {
    await this.userVoucherRepository.delete({
      voucher_id: voucherId,
      status: UserVoucherStatusEnum.AVAILABLE,
    });
  }
  private async deleteVoucherRestrictionLinksByVoucherId(
    voucherId: number,
  ): Promise<void> {
    await Promise.all([
      this.voucherCategoryRepository.delete({ voucher_id: voucherId }),
      this.voucherProductRepository.delete({ voucher_id: voucherId }),
      this.voucherServiceCategoryRepository.delete({ voucher_id: voucherId }),
      this.voucherServiceRepository.delete({ voucher_id: voucherId }),
    ]);
  }
  private ensureSellerUpdateRestrictionPayloadIsValid(
    input: UpdateSellerVoucherRestrictionLinksInput,
  ): void {
    if (input.scope === VoucherScopeEnum.PRODUCTS) {
      if (
        input.hasCategoryIdsInInput ||
        input.hasServiceIdsInInput ||
        input.hasServiceCategoryIdsInInput
      ) {
        throw new BadRequestException(
          'category_ids, service_ids and service_category_ids are not allowed when scope is products',
        );
      }
      if (
        input.hasScopeInInput &&
        (!input.productIds || input.productIds.length === 0)
      ) {
        throw new BadRequestException(
          'product_ids is required when scope is products',
        );
      }
      if (input.hasProductIdsInInput && (input.productIds?.length ?? 0) === 0) {
        throw new BadRequestException('product_ids must not be empty');
      }
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICES) {
      if (
        input.hasCategoryIdsInInput ||
        input.hasProductIdsInInput ||
        input.hasServiceCategoryIdsInInput
      ) {
        throw new BadRequestException(
          'category_ids, product_ids and service_category_ids are not allowed when scope is services',
        );
      }
      const hasServiceIds = (input.serviceIds?.length ?? 0) > 0;
      if (input.hasScopeInInput && !hasServiceIds) {
        throw new BadRequestException(
          'service_id or service_ids is required when scope is services',
        );
      }
      if (input.hasServiceIdsInInput && !hasServiceIds) {
        throw new BadRequestException(
          'service_id or service_ids must not be empty when scope is services',
        );
      }
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICE_CATEGORIES) {
      if (
        input.hasCategoryIdsInInput ||
        input.hasProductIdsInInput ||
        input.hasServiceIdsInInput
      ) {
        throw new BadRequestException(
          'category_ids, product_ids and service_ids are not allowed when scope is service-categories',
        );
      }
      if (
        input.hasScopeInInput &&
        (!input.serviceCategoryIds || input.serviceCategoryIds.length === 0)
      ) {
        throw new BadRequestException(
          'service_category_ids is required when scope is service-categories',
        );
      }
      if (
        input.hasServiceCategoryIdsInInput &&
        (input.serviceCategoryIds?.length ?? 0) === 0
      ) {
        throw new BadRequestException(
          'service_category_ids must not be empty when scope is service-categories',
        );
      }
      return;
    }
    if (
      input.hasProductIdsInInput ||
      input.hasServiceIdsInInput ||
      input.hasServiceCategoryIdsInInput
    ) {
      throw new BadRequestException(
        'product_ids, service_ids and service_category_ids are not allowed when scope is categories',
      );
    }
    if (
      input.hasScopeInInput &&
      (!input.categoryIds || input.categoryIds.length === 0)
    ) {
      throw new BadRequestException(
        'category_ids is required when scope is categories',
      );
    }
    if (input.hasCategoryIdsInInput && (input.categoryIds?.length ?? 0) === 0) {
      throw new BadRequestException('category_ids must not be empty');
    }
  }
  private ensureAdminUpdateRestrictionPayloadIsValid(
    input: UpdateAdminVoucherRestrictionLinksInput,
  ): void {
    this.ensureAdminScopeIsAllowed(input.scope);
    if (input.scope === VoucherScopeEnum.CATEGORIES) {
      if (
        input.hasScopeInInput &&
        (!input.categoryIds || input.categoryIds.length === 0)
      ) {
        throw new BadRequestException(
          'category_ids is required when scope is categories',
        );
      }
      if (
        input.hasCategoryIdsInInput &&
        (input.categoryIds?.length ?? 0) === 0
      ) {
        throw new BadRequestException('category_ids must not be empty');
      }
      return;
    }
    if (input.scope === VoucherScopeEnum.PRODUCTS) {
      if (
        input.hasScopeInInput &&
        (!input.productIds || input.productIds.length === 0)
      ) {
        throw new BadRequestException(
          'product_ids is required when scope is products',
        );
      }
      if (input.hasProductIdsInInput && (input.productIds?.length ?? 0) === 0) {
        throw new BadRequestException('product_ids must not be empty');
      }
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICES) {
      if (
        input.hasScopeInInput &&
        (!input.serviceIds || input.serviceIds.length === 0)
      ) {
        throw new BadRequestException(
          'service_ids is required when scope is services',
        );
      }
      if (input.hasServiceIdsInInput && (input.serviceIds?.length ?? 0) === 0) {
        throw new BadRequestException('service_ids must not be empty');
      }
      return;
    }
    if (input.scope === VoucherScopeEnum.SERVICE_CATEGORIES) {
      if (
        input.hasScopeInInput &&
        (!input.serviceCategoryIds || input.serviceCategoryIds.length === 0)
      ) {
        throw new BadRequestException(
          'service_category_ids is required when scope is service-categories',
        );
      }
      if (
        input.hasServiceCategoryIdsInInput &&
        (input.serviceCategoryIds?.length ?? 0) === 0
      ) {
        throw new BadRequestException('service_category_ids must not be empty');
      }
      return;
    }
  }
  private async findValidSellerProductIds(input: {
    sellerId: number;
    productIds: number[];
  }): Promise<number[]> {
    const uniqueProductIds: number[] = this.extractUniqueIds(input.productIds);
    const products: ProductEntity[] = await this.productRepository.find({
      where: {
        id: In(uniqueProductIds),
        seller_id: input.sellerId,
      },
      select: ['id'],
    });
    const validProductIds: number[] = products.map(
      (product: ProductEntity) => product.id,
    );
    this.ensureAllIdsAreValid({
      requestedIds: uniqueProductIds,
      validIds: validProductIds,
      fieldName: 'product_ids',
      message: 'Some product_ids are invalid or not owned by this seller',
    });
    return validProductIds;
  }
  private async findValidSellerCategoryIds(input: {
    sellerId: number;
    categoryIds: number[];
  }): Promise<number[]> {
    const uniqueCategoryIds: number[] = this.extractUniqueIds(
      input.categoryIds,
    );
    const categories: CategoryEntity[] = await this.categoryRepository.find({
      where: [
        {
          id: In(uniqueCategoryIds),
          seller_id: IsNull(),
        },
        {
          id: In(uniqueCategoryIds),
          seller_id: input.sellerId,
        },
      ],
      select: ['id'],
    });
    const validCategoryIds: number[] = categories.map(
      (category: CategoryEntity) => category.id,
    );
    this.ensureAllIdsAreValid({
      requestedIds: uniqueCategoryIds,
      validIds: validCategoryIds,
      fieldName: 'category_ids',
      message:
        'Some category_ids are invalid or belong to another seller. Only global and your own categories are allowed',
    });
    return validCategoryIds;
  }
  private async findValidSellerServiceIds(input: {
    sellerId: number;
    serviceIds: number[];
  }): Promise<number[]> {
    const uniqueServiceIds: number[] = this.extractUniqueIds(input.serviceIds);
    const services: ServiceEntity[] = await this.serviceEntityRepository.find({
      where: {
        id: In(uniqueServiceIds),
        seller_id: input.sellerId,
      },
      select: ['id'],
    });
    const validServiceIds: number[] = services.map((s: ServiceEntity) => s.id);
    this.ensureAllIdsAreValid({
      requestedIds: uniqueServiceIds,
      validIds: validServiceIds,
      fieldName: 'service_ids',
      message: 'Some service_ids are invalid or not owned by this seller',
    });
    return validServiceIds;
  }
  private async findValidSellerServiceCategoryIds(input: {
    sellerId: number;
    serviceCategoryIds: number[];
  }): Promise<number[]> {
    const uniqueIds: number[] = this.extractUniqueIds(input.serviceCategoryIds);
    const services: ServiceEntity[] = await this.serviceEntityRepository.find({
      where: {
        seller_id: input.sellerId,
        category_id: In(uniqueIds),
      },
      select: ['category_id'],
    });
    const validIds: number[] = this.extractUniqueIds(
      services
        .map((s: ServiceEntity) => s.category_id)
        .filter((id): id is number => id !== null),
    );
    const validIdSet: Set<number> = new Set(validIds);
    const invalidIds: number[] = uniqueIds.filter(
      (id: number) => !validIdSet.has(id),
    );
    if (invalidIds.length > 0) {
      const singular: boolean = invalidIds.length === 1;
      throw new BadRequestException({
        message: singular
          ? 'No listed services fall under this service category'
          : 'No listed services fall under these service categories',
        service_category_ids: invalidIds,
      });
    }
    return validIds;
  }

  private async findValidAdminCategoryIds(
    categoryIds: number[],
  ): Promise<number[]> {
    const uniqueCategoryIds: number[] = this.extractUniqueIds(categoryIds);
    const categories: CategoryEntity[] = await this.categoryRepository.find({
      where: {
        id: In(uniqueCategoryIds),
        seller_id: IsNull(),
      },
      select: ['id'],
    });
    const validCategoryIds: number[] = categories.map(
      (category: CategoryEntity) => category.id,
    );
    this.ensureAllIdsAreValid({
      requestedIds: uniqueCategoryIds,
      validIds: validCategoryIds,
      fieldName: 'category_ids',
      message:
        'Some category_ids are invalid. Admin vouchers only allow global admin categories',
    });
    return validCategoryIds;
  }
  private extractUniqueIds(ids: number[]): number[] {
    return Array.from(new Set(ids));
  }
  private ensureAllIdsAreValid(input: {
    requestedIds: number[];
    validIds: number[];
    fieldName: string;
    message: string;
  }): void {
    const validIdSet: Set<number> = new Set(input.validIds);
    const invalidIds: number[] = input.requestedIds.filter(
      (id: number) => !validIdSet.has(id),
    );
    if (invalidIds.length === 0) {
      return;
    }
    throw new BadRequestException({
      message: input.message,
      [input.fieldName]: invalidIds,
    });
  }
  private isSellerScopeAllowed(scope: VoucherScopeEnum): boolean {
    return (
      scope === VoucherScopeEnum.CATEGORIES ||
      scope === VoucherScopeEnum.PRODUCTS ||
      scope === VoucherScopeEnum.SERVICE_CATEGORIES ||
      scope === VoucherScopeEnum.SERVICES
    );
  }
  private isAdminScopeAllowed(scope: VoucherScopeEnum): boolean {
    return (
      scope === VoucherScopeEnum.CATEGORIES ||
      scope === VoucherScopeEnum.PRODUCTS ||
      scope === VoucherScopeEnum.SERVICES ||
      scope === VoucherScopeEnum.SERVICE_CATEGORIES
    );
  }
  private ensureAdminScopeIsAllowed(scope: VoucherScopeEnum): void {
    if (this.isAdminScopeAllowed(scope)) {
      return;
    }
    throw new BadRequestException(
      'Admin vouchers must use scope categories, products, services, or service-categories',
    );
  }
  private async ensureVoucherCodeIsUnique(
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const existingVoucher: Voucher | null =
      await this.voucherRepository.findByCode(code);
    if (existingVoucher && existingVoucher.id !== excludeId) {
      throw new ConflictException('Voucher code already exists');
    }
  }
  private ensureVoucherOwnership(voucher: Voucher, causer: User): void {
    if (causer.system_admin) {
      return;
    }
    if (
      voucher.seller_id !== null &&
      voucher.seller_id !== undefined &&
      voucher.seller_id === causer.seller_id
    ) {
      return;
    }
    throw new ForbiddenException('You are not allowed to modify this voucher');
  }
  private mapVoucherEntity(entity: VoucherEntity): Voucher {
    return {
      id: entity.id,
      code: entity.code,
      scope: entity.scope,
      seller_id: entity.seller_id,
      service_id: entity.service_id ?? undefined,
      discount_type: entity.discount_type,
      discount_value: Number(entity.discount_value),
      max_discount_cap:
        entity.max_discount_cap !== null &&
        entity.max_discount_cap !== undefined
          ? Number(entity.max_discount_cap)
          : null,
      min_order_amount: Number(entity.min_order_amount),
      total_limit: entity.total_limit,
      per_user_limit: entity.per_user_limit,
      used_count: entity.used_count,
      starts_at: entity.starts_at,
      expires_at: entity.expires_at,
      status: entity.status,
      is_claimable: entity.is_claimable,
      include_addons_flag: entity.include_addons_flag ?? false,
      description: entity.description,
      terms_and_conditions: entity.terms_and_conditions,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
    } as Voucher;
  }
  // ==============================
  // QR Token — Generation, Scan, Redeem
  // ==============================

  /**
   * Generates a short-lived signed QR token for onsite redemption.
   * Invalidates any previously issued active token for the same user_voucher.
   */
  public async generateQrToken(
    userVoucherId: number,
    currentUser: User,
  ): Promise<GenerateQrTokenResponseDto> {
    const userVoucher: UserVoucherEntity | null =
      await this.userVoucherRepository.findOne({
        where: { id: userVoucherId, user_id: currentUser.id },
        relations: ['voucher'],
      });
    if (!userVoucher) {
      throw new NotFoundException('User voucher not found');
    }
    if (userVoucher.status === UserVoucherStatusEnum.USED) {
      throw new BadRequestException('This voucher has already been used');
    }
    if (userVoucher.status === UserVoucherStatusEnum.EXPIRED) {
      throw new BadRequestException('This voucher has expired');
    }
    if (
      userVoucher.voucher?.expires_at &&
      userVoucher.voucher.expires_at < new Date()
    ) {
      throw new BadRequestException('This voucher has expired');
    }
    if (userVoucher.voucher?.status !== VoucherStatusEnum.ACTIVE) {
      throw new BadRequestException('This voucher is no longer active');
    }

    // Invalidate any previously issued active tokens for this user_voucher
    await this.voucherQrTokenRepository.update(
      {
        user_voucher_id: userVoucherId,
        used_at: IsNull(),
      },
      { expires_at: new Date() },
    );

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const payload = {
      sub: userVoucherId,
      uid: currentUser.id,
      vid: userVoucher.voucher_id,
      purpose: 'voucher-qr',
    };

    const token: string = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow('auth.secret', { infer: true }),
      expiresIn: '5m',
    });

    const tokenHash: string = createHash('sha256').update(token).digest('hex');

    const shortCode: string = await this.generateUniqueShortCode();

    const qrToken: VoucherQrTokenEntity = this.voucherQrTokenRepository.create({
      user_voucher_id: userVoucherId,
      user_id: currentUser.id,
      voucher_id: userVoucher.voucher_id,
      token_hash: tokenHash,
      short_code: shortCode,
      expires_at: expiresAt,
    });
    await this.voucherQrTokenRepository.save(qrToken);

    return {
      token,
      short_code: shortCode,
      expires_at: expiresAt,
    };
  }

  /**
   * Validates a scanned QR token or manually entered short_code.
   * Returns full user_voucher details (same shape as GET /my-vouchers/:id)
   * including the nested voucher with restriction links and the owning user.
   */
  public async scanVoucherQr(
    input: ScanVoucherDto,
    seller: User,
  ): Promise<UserVoucher> {
    if (!seller.seller_id) {
      throw new ForbiddenException('Only sellers can scan voucher QR codes');
    }
    if (!input.token && !input.short_code) {
      throw new BadRequestException(
        'Either token or short_code must be provided',
      );
    }

    const qrToken: VoucherQrTokenEntity = await this.resolveQrToken(input);

    const userVoucher: UserVoucherEntity | null =
      await this.userVoucherRepository.findOne({
        where: { id: qrToken.user_voucher_id },
        relations: ['voucher', 'user', 'user.details'],
      });
    if (!userVoucher || !userVoucher.voucher) {
      throw new NotFoundException('Associated voucher not found');
    }

    // Check if seller is eligible to scan this voucher based on eligible services
    const isEligible = await this.isSellerEligibleForVoucher(
      userVoucher.voucher,
      seller.seller_id,
    );
    if (!isEligible) {
      throw new ForbiddenException(
        'This voucher is not applicable to your services or products',
      );
    }

    const mapped: UserVoucher = this.mapUserVoucherEntity(userVoucher);

    // Include customer info
    if (userVoucher.user) {
      const user = userVoucher.user as any;
      mapped.user = {
        id: user.id,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        email: user.email ?? null,
        profile_picture: user.details?.profile_picture ?? null,
      };
    }

    // Enrich voucher with restriction links (categories, products, services, etc.)
    if (mapped.voucher) {
      mapped.voucher = await this.enrichVoucherWithRestrictionLinks(
        mapped.voucher,
      );
    }

    return mapped;
  }

  /**
   * Confirms onsite voucher redemption after merchant scan.
   * Idempotent — safe to call twice for the same voucher.
   */
  public async redeemOnsiteVoucher(
    input: RedeemOnsiteDto,
    seller: User,
  ): Promise<{ message: string }> {
    if (!seller.seller_id) {
      throw new ForbiddenException('Only sellers can redeem vouchers onsite');
    }
    if (!input.token && !input.short_code) {
      throw new BadRequestException(
        'Either token or short_code must be provided',
      );
    }

    const qrToken: VoucherQrTokenEntity = await this.resolveQrToken(input);

    const userVoucher: UserVoucherEntity | null =
      await this.userVoucherRepository.findOne({
        where: { id: qrToken.user_voucher_id },
        relations: ['voucher'],
      });
    if (!userVoucher || !userVoucher.voucher) {
      throw new NotFoundException('Associated voucher not found');
    }

    // Check if seller is eligible to redeem this voucher based on eligible services
    const isEligible = await this.isSellerEligibleForVoucher(
      userVoucher.voucher,
      seller.seller_id,
    );
    if (!isEligible) {
      throw new ForbiddenException(
        'This voucher is not applicable to your services or products',
      );
    }

    // Idempotency: already used → return success
    if (userVoucher.status === UserVoucherStatusEnum.USED) {
      return { message: 'Voucher already redeemed' };
    }

    if (userVoucher.voucher.status !== VoucherStatusEnum.ACTIVE) {
      throw new BadRequestException('This voucher is no longer active');
    }
    if (
      userVoucher.voucher.expires_at &&
      userVoucher.voucher.expires_at < new Date()
    ) {
      throw new BadRequestException('This voucher has expired');
    }

    // Mark QR token as used
    const now = new Date();
    await this.voucherQrTokenRepository.update(qrToken.id, {
      used_at: now,
    });

    // Route through the gated recordVoucherRedemption (§10.4).
    // This enforces total_limit and per_user_limit via pessimistic lock,
    // saves VoucherRedemptionEntity, increments used_count, and marks
    // user_voucher as USED — all atomically.
    await this.recordVoucherRedemption({
      voucherId: userVoucher.voucher.id,
      userId: userVoucher.user_id,
      orderSubtotal: 0,
      discountAmount: 0,
      salesOrderId: null,
      bookingId: null,
      userVoucherId: userVoucher.id,
    });

    return { message: 'Voucher redeemed successfully' };
  }

  /**
   * Validates a guest voucher short_code against a service and calculates the discount.
   * Does NOT consume the voucher — only previews eligibility and discount.
   */
  public async validateVenueVoucher(input: {
    code: string;
    service_ids: number[];
    total_amount: number;
    user_id: number;
    exclude_user_voucher_ids?: number[];
  }): Promise<{
    valid: boolean;
    is_elligible: boolean;
    message: string;
    voucher_id?: number;
    user_voucher_id?: number;
    voucher_code?: string;
    discount_type?: string;
    discount_value?: number;
    eligible_service_ids?: number[];
    hourly_rate?: number;
    discount_amount?: number;
    final_amount?: number;
  }> {
    const fail = (message: string) => ({
      valid: false,
      is_elligible: false,
      message,
    });
    // 1. Look up voucher by code
    const normalizedCode = input.code.trim().toUpperCase();
    const voucherEntity = await this.voucherEntityRepository.findOne({
      where: { code: normalizedCode, deleted_at: IsNull() },
    });
    if (!voucherEntity) {
      return fail('Voucher not found');
    }

    // 2. Find all user_voucher records for this user + voucher, pick one not excluded
    const allUserVouchers = await this.userVoucherRepository.find({
      where: { user_id: input.user_id, voucher_id: voucherEntity.id },
    });
    const excludeIds = new Set(input.exclude_user_voucher_ids ?? []);
    const userVoucher = allUserVouchers.find(
      (uv) =>
        !excludeIds.has(uv.id) && uv.status !== UserVoucherStatusEnum.USED,
    );
    if (!userVoucher) {
      if (allUserVouchers.length === 0) {
        return fail('You do not have this voucher. Collect it first.');
      }
      return fail('All your instances of this voucher are already in use.');
    }

    if (voucherEntity.status !== VoucherStatusEnum.ACTIVE) {
      return fail('This voucher is no longer active');
    }
    if (voucherEntity.expires_at && voucherEntity.expires_at < new Date()) {
      return fail('This voucher has expired');
    }

    // 3. Only per_hours vouchers are supported for venue bookings
    if (voucherEntity.discount_type !== VoucherDiscountTypeEnum.PER_HOURS) {
      return fail('Only per-hour vouchers are supported for venue bookings');
    }

    // 4. Check service eligibility — collect all eligible service IDs
    const scope = voucherEntity.scope;
    let eligibleServiceIds: number[] = [];

    if (
      scope === VoucherScopeEnum.PRODUCTS ||
      scope === VoucherScopeEnum.CATEGORIES
    ) {
      return fail('This voucher is not applicable to services');
    }

    if (scope === VoucherScopeEnum.SERVICES) {
      const serviceLinks = await this.voucherServiceRepository.find({
        where: { voucher_id: voucherEntity.id },
      });
      eligibleServiceIds = serviceLinks.map((s) => s.service_id);
      const hasMatch = input.service_ids.some((id) =>
        eligibleServiceIds.includes(id),
      );
      if (!hasMatch) {
        return fail('This voucher is not valid for the selected services');
      }
    }

    if (scope === VoucherScopeEnum.SERVICE_CATEGORIES) {
      const scLinks = await this.voucherServiceCategoryRepository.find({
        where: { voucher_id: voucherEntity.id },
      });
      const eligibleCategoryIds = scLinks.map((sc) => sc.service_category_id);
      const services = await this.serviceEntityRepository.find({
        where: { id: In(input.service_ids) },
        select: ['id', 'category_id'],
      });
      eligibleServiceIds = services
        .filter(
          (s) => s.category_id && eligibleCategoryIds.includes(s.category_id),
        )
        .map((s) => s.id);
      if (eligibleServiceIds.length === 0) {
        return fail(
          'This voucher is not valid for the selected service categories',
        );
      }
    }

    // 5. Get hourly_rate from first eligible service for reference pricing
    const discountValue = Number(voucherEntity.discount_value);
    const firstEligibleId = eligibleServiceIds[0] ?? input.service_ids[0];
    const serviceForRate = await this.serviceEntityRepository.findOne({
      where: { id: firstEligibleId },
      select: ['id', 'hourly_rate'],
    });
    const hourlyRate = serviceForRate?.hourly_rate
      ? Number(serviceForRate.hourly_rate)
      : 0;
    let discountAmount = Math.min(
      hourlyRate * discountValue,
      input.total_amount,
    );

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalAmount =
      Math.round((input.total_amount - discountAmount) * 100) / 100;

    return {
      valid: true,
      is_elligible: true,
      message: 'Voucher applied',
      voucher_id: voucherEntity.id,
      user_voucher_id: userVoucher.id,
      voucher_code: voucherEntity.code,
      discount_type: voucherEntity.discount_type,
      discount_value: discountValue,
      eligible_service_ids: eligibleServiceIds,
      hourly_rate: hourlyRate,
      discount_amount: discountAmount,
      final_amount: Math.max(finalAmount, 0),
    };
  }

  /**
   * Look up a user_voucher by ID with its voucher relation loaded.
   * Used by the booking creation flow to validate vouchers by user_voucher_id.
   */
  public async findUserVoucherById(userVoucherId: number) {
    return this.userVoucherRepository.findOne({
      where: { id: userVoucherId },
      relations: ['voucher'],
    });
  }

  /**
   * Consumes a guest voucher: marks QR token as used, marks user_voucher as USED,
   * increments voucher used_count, and creates a voucher_redemption record.
   */
  public async consumeGuestVoucher(input: {
    user_voucher_id: number;
    user_id: number;
    /** One entry per booking where this voucher was applied */
    redemptions: Array<{
      sales_order_id: number;
      seller_id: number | null;
      discount_amount: number;
      order_subtotal: number;
    }>;
  }): Promise<void> {
    const userVoucher = await this.userVoucherRepository.findOne({
      where: { id: input.user_voucher_id },
      relations: ['voucher'],
    });
    if (!userVoucher || !userVoucher.voucher) {
      throw new NotFoundException('Associated voucher not found');
    }

    // Route through the gated recordVoucherRedemption (§10.4) for the first
    // redemption entry. This enforces total_limit and per_user_limit via
    // pessimistic lock, saves VoucherRedemptionEntity, increments used_count,
    // and marks user_voucher as USED — all atomically.
    // Additional redemption entries (if any) are recorded afterward without
    // re-incrementing used_count since the voucher is consumed once.
    if (input.redemptions.length > 0) {
      const firstEntry = input.redemptions[0];
      await this.recordVoucherRedemption({
        voucherId: userVoucher.voucher.id,
        userId: input.user_id,
        orderSubtotal: firstEntry.order_subtotal,
        discountAmount: firstEntry.discount_amount,
        salesOrderId: firstEntry.sales_order_id,
        bookingId: null,
        userVoucherId: userVoucher.id,
      });

      // Record additional redemption entries (subsequent bookings) without
      // re-incrementing used_count — the voucher is already consumed.
      for (let i = 1; i < input.redemptions.length; i++) {
        const entry = input.redemptions[i];
        await this.voucherRedemptionRepository.save(
          this.voucherRedemptionRepository.create({
            user_voucher_id: userVoucher.id,
            user_id: input.user_id,
            sales_order_id: entry.sales_order_id,
            booking_id: null,
            seller_id: entry.seller_id,
            discount_amount: entry.discount_amount,
            order_subtotal: entry.order_subtotal,
          }),
        );
      }
    }
  }

  /**
   * Resolves a QR token row from either a signed token string or a short_code.
   * Validates expiration and used status.
   */
  private async resolveQrToken(
    input: Pick<ScanVoucherDto, 'token' | 'short_code'>,
  ): Promise<VoucherQrTokenEntity> {
    let qrToken: VoucherQrTokenEntity | null = null;

    if (input.token) {
      // Verify JWT signature first
      try {
        await this.jwtService.verifyAsync(input.token, {
          secret: this.configService.getOrThrow('auth.secret', {
            infer: true,
          }),
        });
      } catch {
        throw new BadRequestException('Invalid QR code');
      }
      const tokenHash: string = createHash('sha256')
        .update(input.token)
        .digest('hex');
      qrToken = await this.voucherQrTokenRepository.findOne({
        where: { token_hash: tokenHash },
      });
    } else if (input.short_code) {
      const normalized = input.short_code.trim().toUpperCase();
      qrToken = await this.voucherQrTokenRepository.findOne({
        where: { short_code: normalized },
      });
    }

    if (!qrToken) {
      throw new NotFoundException('QR token not found');
    }
    if (qrToken.used_at) {
      throw new BadRequestException('This voucher has already been redeemed');
    }
    if (qrToken.expires_at < new Date()) {
      throw new BadRequestException(
        'QR code has expired — ask the customer to regenerate',
      );
    }

    return qrToken;
  }

  /**
   * Generates a unique short_code in VCH-XXXX-X format.
   */
  private async generateUniqueShortCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 10; attempt++) {
      let digits = '';
      for (let i = 0; i < 4; i++) {
        digits += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const suffix = chars.charAt(Math.floor(Math.random() * chars.length));
      const code = `VCH-${digits}-${suffix}`;
      const existing = await this.voucherQrTokenRepository.findOne({
        where: { short_code: code },
      });
      if (!existing) {
        return code;
      }
    }
    throw new BadRequestException('Failed to generate unique short code');
  }

  private mapUserVoucherEntity(entity: UserVoucherEntity): UserVoucher {
    const userVoucher: UserVoucher = {
      id: entity.id,
      user_id: entity.user_id,
      voucher_id: entity.voucher_id,
      collected_at: entity.collected_at,
      status: entity.status,
      used_at: entity.used_at,
      expired_at: entity.expired_at,
      expires_at: entity.expires_at,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
    if (entity.voucher) {
      userVoucher.voucher = this.mapVoucherEntity(entity.voucher);
    }
    return userVoucher;
  }
  private mapVoucherRedemptionEntity(
    entity: VoucherRedemptionEntity,
  ): VoucherRedemption {
    return {
      id: entity.id,
      user_voucher_id: entity.user_voucher_id,
      user_id: entity.user_id,
      sales_order_id: entity.sales_order_id,
      booking_id: entity.booking_id,
      discount_amount: Number(entity.discount_amount),
      order_subtotal: Number(entity.order_subtotal),
      redeemed_at: entity.redeemed_at,
      created_at: entity.created_at,
    };
  }

  /**
   * Checks if a seller is eligible to scan a voucher based on its eligible services/products/categories.
   * Optimized by only querying the relevant junction table based on voucher scope.
   *
   * @param voucher - The voucher entity to check
   * @param sellerId - The seller's ID
   * @returns Promise<boolean> - True if seller is eligible, false otherwise
   */
  private async isSellerEligibleForVoucher(
    voucher: VoucherEntity,
    sellerId: number,
  ): Promise<boolean> {
    switch (voucher.scope) {
      case VoucherScopeEnum.SERVICES: {
        const match = await this.voucherServiceRepository
          .createQueryBuilder('vs')
          .innerJoin('services', 's', 's.id = vs.service_id')
          .where('vs.voucher_id = :voucherId', { voucherId: voucher.id })
          .andWhere('s.seller_id = :sellerId', { sellerId })
          .select('1')
          .limit(1)
          .getRawOne();
        return !!match;
      }
      case VoucherScopeEnum.SERVICE_CATEGORIES: {
        const match = await this.voucherServiceCategoryRepository
          .createQueryBuilder('vsc')
          .innerJoin('services', 's', 's.category_id = vsc.service_category_id')
          .where('vsc.voucher_id = :voucherId', { voucherId: voucher.id })
          .andWhere('s.seller_id = :sellerId', { sellerId })
          .select('1')
          .limit(1)
          .getRawOne();
        return !!match;
      }
      case VoucherScopeEnum.PRODUCTS: {
        const match = await this.voucherProductRepository
          .createQueryBuilder('vp')
          .innerJoin('products', 'p', 'p.id = vp.product_id')
          .where('vp.voucher_id = :voucherId', { voucherId: voucher.id })
          .andWhere('p.seller_id = :sellerId', { sellerId })
          .select('1')
          .limit(1)
          .getRawOne();
        return !!match;
      }
      case VoucherScopeEnum.CATEGORIES: {
        const match = await this.voucherCategoryRepository
          .createQueryBuilder('vc')
          .innerJoin(
            'product_categories',
            'pc',
            'pc.category_id = vc.category_id',
          )
          .innerJoin('products', 'p', 'p.id = pc.product_id')
          .where('vc.voucher_id = :voucherId', { voucherId: voucher.id })
          .andWhere('p.seller_id = :sellerId', { sellerId })
          .select('1')
          .limit(1)
          .getRawOne();
        return !!match;
      }
      default:
        return false;
    }
  }
}
