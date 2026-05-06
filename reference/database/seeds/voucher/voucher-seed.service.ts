import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { ISeedService } from '../seed.interface';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { VoucherCategoryEntity } from '@/voucher-categories/persistence/entities/voucher-category.entity';
import { VoucherProductEntity } from '@/voucher-products/persistence/entities/voucher-product.entity';
import { VoucherServiceEntity } from '@/voucher-services/persistence/entities/voucher-service.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { VoucherDiscountTypeEnum } from '@/vouchers/enums/voucher-discount-type.enum';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';
import { VoucherStatusEnum } from '@/vouchers/enums/voucher-status.enum';

type EnsureVoucherInput = {
  readonly code: string;
  readonly scope: VoucherScopeEnum;
  readonly seller_id: number | null;
  readonly discount_type: VoucherDiscountTypeEnum;
  readonly discount_value: number;
  readonly max_discount_cap: number | null;
  readonly total_limit?: number | null;
  readonly per_user_limit?: number | null;
  readonly is_claimable?: boolean;
  readonly description: string;
  readonly terms_and_conditions: string;
  /** Override the default 6-month expiry for this voucher. */
  readonly customExpiresAt?: Date;
};

type EnsureVoucherRestrictionsResult = {
  readonly insertedCategoryLinksCount: number;
  readonly insertedProductLinksCount: number;
};

@Injectable()
export class VoucherSeedService implements ISeedService {
  constructor(
    @InjectRepository(VoucherEntity)
    private voucherRepository: Repository<VoucherEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(VoucherCategoryEntity)
    private voucherCategoryRepository: Repository<VoucherCategoryEntity>,
    @InjectRepository(VoucherProductEntity)
    private voucherProductRepository: Repository<VoucherProductEntity>,
    @InjectRepository(VoucherServiceEntity)
    private voucherServiceRepository: Repository<VoucherServiceEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    @InjectRepository(ServiceEntity)
    private serviceRepository: Repository<ServiceEntity>,
  ) {}
  /**
   * Seeds voucher data and voucher restriction links.
   */
  public async run(): Promise<void> {
    const user: UserEntity | null = await this.userRepository.findOne({
      where: { id: 1 },
    });
    if (!user) {
      console.error('❌ No user found. Cannot proceed to seed vouchers.');
      return;
    }
    const now: Date = new Date();
    const startsAt: Date = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const expiresAt: Date = this.buildExpiresAtSixMonthsFromNow(now);
    // Membership vouchers need a long-lived expiry so annual/multi-year plans
    // don't hit the parent voucher's expires_at before members finish using them.
    const membershipVoucherExpiresAt: Date = new Date(now);
    membershipVoucherExpiresAt.setFullYear(
      membershipVoucherExpiresAt.getFullYear() + 3,
    );
    const sellerVoucherInputs: EnsureVoucherInput[] = [
      {
        code: 'SLR1FIX100',
        scope: VoucherScopeEnum.PRODUCTS,
        seller_id: 1,
        discount_type: VoucherDiscountTypeEnum.FIXED,
        discount_value: 100,
        max_discount_cap: null,
        description: 'Seller 1 fixed discount voucher',
        terms_and_conditions: 'Valid for seller 1 products only.',
      },
      {
        code: 'SLR1PCT10',
        scope: VoucherScopeEnum.PRODUCTS,
        seller_id: 1,
        discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
        discount_value: 10,
        max_discount_cap: 300,
        description: 'Seller 1 percentage discount voucher',
        terms_and_conditions: 'Valid for seller 1 products only.',
      },
      {
        code: 'SLR1B1T1',
        scope: VoucherScopeEnum.PRODUCTS,
        seller_id: 1,
        discount_type: VoucherDiscountTypeEnum.B1T1,
        discount_value: 1,
        max_discount_cap: null,
        description: 'Seller 1 buy-1-take-1 style voucher',
        terms_and_conditions: 'Valid for seller 1 products only.',
      },
    ];
    const adminVoucherInputs: EnsureVoucherInput[] = [
      {
        code: 'ADMNSHIP50',
        scope: VoucherScopeEnum.CATEGORIES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.SHIPPING,
        discount_value: 50,
        max_discount_cap: null,
        description: 'Admin shipping discount voucher',
        terms_and_conditions: 'Valid for platform-wide checkout.',
      },
      {
        code: 'ADMNFIX80',
        scope: VoucherScopeEnum.CATEGORIES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.FIXED,
        discount_value: 80,
        max_discount_cap: null,
        description: 'Admin fixed discount voucher',
        terms_and_conditions: 'Valid for platform-wide checkout.',
      },
      {
        code: 'ADMNPCT15',
        scope: VoucherScopeEnum.CATEGORIES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
        discount_value: 15,
        max_discount_cap: 500,
        description: 'Admin percentage discount voucher',
        terms_and_conditions: 'Valid for platform-wide checkout.',
      },
      {
        code: 'COFFEEPCT5',
        scope: VoucherScopeEnum.CATEGORIES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
        discount_value: 5,
        max_discount_cap: 100,
        description: 'Coffee category percentage discount voucher (5%)',
        terms_and_conditions: 'Valid for Coffee Beans category only.',
      },
      {
        code: 'COFFEEPCT10',
        scope: VoucherScopeEnum.CATEGORIES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
        discount_value: 10,
        max_discount_cap: 200,
        description: 'Coffee category percentage discount voucher (10%)',
        terms_and_conditions: 'Valid for Coffee Beans category only.',
      },
      {
        code: 'COFFEEPCT15',
        scope: VoucherScopeEnum.CATEGORIES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
        discount_value: 15,
        max_discount_cap: 300,
        description: 'Coffee category percentage discount voucher (15%)',
        terms_and_conditions: 'Valid for Coffee Beans category only.',
      },
      {
        code: 'COFFEEFIX20',
        scope: VoucherScopeEnum.CATEGORIES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.FIXED,
        discount_value: 20,
        max_discount_cap: null,
        description: 'Coffee category fixed discount voucher (PHP 20)',
        terms_and_conditions: 'Valid for Coffee Beans category only.',
      },
      {
        code: 'COFFEEFIX30',
        scope: VoucherScopeEnum.CATEGORIES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.FIXED,
        discount_value: 30,
        max_discount_cap: null,
        description: 'Coffee category fixed discount voucher (PHP 30)',
        terms_and_conditions: 'Valid for Coffee Beans category only.',
      },
      {
        code: 'COFFEEFIX50',
        scope: VoucherScopeEnum.CATEGORIES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.FIXED,
        discount_value: 50,
        max_discount_cap: null,
        description: 'Coffee category fixed discount voucher (PHP 50)',
        terms_and_conditions: 'Valid for Coffee Beans category only.',
      },
      {
        code: 'COFFEEB1T1',
        scope: VoucherScopeEnum.CATEGORIES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.B1T1,
        discount_value: 1,
        max_discount_cap: null,
        description: 'Coffee category buy-1-take-1 style voucher',
        terms_and_conditions: 'Valid for Coffee Beans category only.',
      },
    ];
    const membershipVoucherInputs: EnsureVoucherInput[] = [
      // Starter plan court voucher (kept for backward compatibility)
      {
        code: 'FREE-1HR-COURT-STARTER',
        scope: VoucherScopeEnum.SERVICES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.PER_HOURS,
        discount_value: 0, // not used — per_hours discount is derived from per-slot cost
        max_discount_cap: null,
        total_limit: null,
        per_user_limit: 9999,
        is_claimable: false,
        description: 'Membership court usage voucher (1 hour)',
        terms_and_conditions:
          'Valid for one hour of court usage at eligible Ulrak branches.',
        customExpiresAt: membershipVoucherExpiresAt,
      },
      // Core plan vouchers
      {
        code: 'FREE-1HR-COURT-CORE',
        scope: VoucherScopeEnum.SERVICES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.PER_HOURS,
        discount_value: 0, // not used — per_hours discount is derived from per-slot cost
        max_discount_cap: null,
        total_limit: null,
        per_user_limit: 9999,
        is_claimable: false,
        description: 'Core membership — 1 free court hour',
        terms_and_conditions:
          'Valid for one hour of court usage at eligible Ulrak branches.',
        customExpiresAt: membershipVoucherExpiresAt,
      },
      {
        code: 'FREE-LIFESTYLE-PERK-CORE-1X',
        scope: VoucherScopeEnum.SERVICES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
        discount_value: 100,
        max_discount_cap: 10000, // required by constraint; high enough to cover any lifestyle service
        total_limit: null,
        per_user_limit: 9999,
        is_claimable: false,
        description: 'Core membership — 1 free lifestyle perk service',
        terms_and_conditions:
          'Valid for one lifestyle service redemption (carwash, massage, barber, or nail spa).',
        customExpiresAt: membershipVoucherExpiresAt,
      },
      // Elite plan vouchers
      {
        code: 'FREE-1HR-COURT-ELITE',
        scope: VoucherScopeEnum.SERVICES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.PER_HOURS,
        discount_value: 0, // not used — per_hours discount is derived from per-slot cost
        max_discount_cap: null,
        total_limit: null,
        per_user_limit: 9999,
        is_claimable: false,
        description: 'Elite membership — 1 free court hour',
        terms_and_conditions:
          'Valid for one hour of court usage at eligible Ulrak branches.',
        customExpiresAt: membershipVoucherExpiresAt,
      },
      {
        code: 'FREE-LIFESTYLE-PERK-ELITE-1X',
        scope: VoucherScopeEnum.SERVICES,
        seller_id: null,
        discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
        discount_value: 100,
        max_discount_cap: 10000,
        total_limit: null,
        per_user_limit: 9999,
        is_claimable: false,
        description: 'Elite membership — 1 free lifestyle perk service',
        terms_and_conditions:
          'Valid for one lifestyle service redemption (carwash, massage, barber, or nail spa).',
        customExpiresAt: membershipVoucherExpiresAt,
      },
    ];
    const voucherInputs: EnsureVoucherInput[] = [
      ...sellerVoucherInputs,
      ...adminVoucherInputs,
      ...membershipVoucherInputs,
    ];
    const MEMBERSHIP_COURT_VOUCHER_CODES = new Set([
      'FREE-1HR-COURT-STARTER',
      'FREE-1HR-COURT-CORE',
      'FREE-1HR-COURT-ELITE',
    ]);
    let insertedCount: number = 0;
    let updatedCount: number = 0;
    const ensuredSellerVoucherIds: number[] = [];
    const ensuredCoffeeVoucherIds: number[] = [];
    const membershipCourtVoucherIds: number[] = [];
    for (const voucherInput of voucherInputs) {
      const existingVoucher: VoucherEntity | null =
        await this.voucherRepository.findOne({
          where: { code: voucherInput.code },
        });
      if (existingVoucher) {
        const totalLimit =
          voucherInput.total_limit !== undefined
            ? voucherInput.total_limit
            : 1000;
        const perUserLimit = voucherInput.per_user_limit ?? 1;
        const isClaimable =
          voucherInput.is_claimable !== undefined
            ? voucherInput.is_claimable
            : true;
        await this.voucherRepository.save({
          ...existingVoucher,
          scope: voucherInput.scope,
          seller_id: voucherInput.seller_id,
          discount_type: voucherInput.discount_type,
          discount_value: voucherInput.discount_value,
          max_discount_cap: voucherInput.max_discount_cap,
          min_order_amount: 0,
          total_limit: totalLimit,
          per_user_limit: perUserLimit,
          starts_at: startsAt,
          expires_at: voucherInput.customExpiresAt ?? expiresAt,
          status: VoucherStatusEnum.ACTIVE,
          is_claimable: isClaimable,
          description: voucherInput.description,
          terms_and_conditions: voucherInput.terms_and_conditions,
          updated_by: user,
        });
        if (voucherInput.seller_id === 1) {
          ensuredSellerVoucherIds.push(existingVoucher.id);
        }
        if (voucherInput.code.startsWith('COFFEE')) {
          ensuredCoffeeVoucherIds.push(existingVoucher.id);
        }
        if (MEMBERSHIP_COURT_VOUCHER_CODES.has(voucherInput.code)) {
          membershipCourtVoucherIds.push(existingVoucher.id);
        }
        updatedCount++;
        continue;
      }
      const createdVoucher: VoucherEntity = await this.voucherRepository.save(
        this.voucherRepository.create({
          code: voucherInput.code,
          scope: voucherInput.scope,
          seller_id: voucherInput.seller_id,
          discount_type: voucherInput.discount_type,
          discount_value: voucherInput.discount_value,
          max_discount_cap: voucherInput.max_discount_cap,
          min_order_amount: 0,
          total_limit:
            voucherInput.total_limit !== undefined
              ? voucherInput.total_limit
              : 1000,
          per_user_limit: voucherInput.per_user_limit ?? 1,
          used_count: 0,
          starts_at: startsAt,
          expires_at: voucherInput.customExpiresAt ?? expiresAt,
          status: VoucherStatusEnum.ACTIVE,
          is_claimable:
            voucherInput.is_claimable !== undefined
              ? voucherInput.is_claimable
              : true,
          description: voucherInput.description,
          terms_and_conditions: voucherInput.terms_and_conditions,
          created_by: user,
          updated_by: user,
        }),
      );
      if (voucherInput.seller_id === 1) {
        ensuredSellerVoucherIds.push(createdVoucher.id);
      }
      if (voucherInput.code.startsWith('COFFEE')) {
        ensuredCoffeeVoucherIds.push(createdVoucher.id);
      }
      if (MEMBERSHIP_COURT_VOUCHER_CODES.has(voucherInput.code)) {
        membershipCourtVoucherIds.push(createdVoucher.id);
      }
      insertedCount++;
    }
    const restrictionsResult: EnsureVoucherRestrictionsResult =
      await this.ensureSellerVoucherRestrictions(ensuredSellerVoucherIds);
    await this.ensureCoffeeVoucherRestrictions(ensuredCoffeeVoucherIds);
    let membershipRestrictionCount = 0;
    if (membershipCourtVoucherIds.length > 0) {
      const courtServiceCodes: string[] = [
        'ulrak-pickleball-court-1',
        'ulrak-pickleball-court-2',
        'ulrak-tambayan',
        ...Array.from(
          { length: 8 },
          (_value, index) => `tambayan-pickleball-court-${index + 1}`,
        ),
      ];
      for (const courtVoucherId of membershipCourtVoucherIds) {
        membershipRestrictionCount +=
          await this.ensureMembershipVoucherRestrictions(
            courtVoucherId,
            courtServiceCodes,
          );
      }
    }
    // Lifestyle voucher service links are handled by LifestyleServicesSeedService
    // so matching remains dynamic for any seller with eligible service titles.
    console.log(
      `✅ Vouchers seed completed (${insertedCount} inserted, ${updatedCount} updated, ${voucherInputs.length - insertedCount - updatedCount} unchanged, ${restrictionsResult.insertedCategoryLinksCount} category links inserted, ${restrictionsResult.insertedProductLinksCount} product links inserted, ${membershipRestrictionCount} membership service links inserted)`,
    );
  }
  private buildExpiresAtSixMonthsFromNow(now: Date): Date {
    const expiresAt: Date = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 6);
    return expiresAt;
  }
  private async ensureSellerVoucherRestrictions(
    sellerVoucherIds: number[],
  ): Promise<EnsureVoucherRestrictionsResult> {
    if (sellerVoucherIds.length === 0) {
      return {
        insertedCategoryLinksCount: 0,
        insertedProductLinksCount: 0,
      };
    }
    const sellerCategories: CategoryEntity[] =
      await this.categoryRepository.find({
        where: { seller_id: 1 },
        order: { id: 'ASC' },
        take: 2,
      });
    const globalCategories: CategoryEntity[] =
      await this.categoryRepository.find({
        where: { seller_id: IsNull() },
        order: { id: 'ASC' },
        take: 2,
      });
    const selectedCategoryIds: number[] =
      sellerCategories.length > 0
        ? sellerCategories.map((category: CategoryEntity) => category.id)
        : globalCategories.map((category: CategoryEntity) => category.id);
    const sellerProducts: ProductEntity[] = await this.productRepository.find({
      where: { seller_id: 1 },
      order: { id: 'ASC' },
      take: 3,
    });
    const selectedProductIds: number[] = sellerProducts.map(
      (product: ProductEntity) => product.id,
    );
    let insertedCategoryLinksCount: number = 0;
    let insertedProductLinksCount: number = 0;
    for (const voucherId of sellerVoucherIds) {
      for (const categoryId of selectedCategoryIds) {
        const existingCategoryLink: VoucherCategoryEntity | null =
          await this.voucherCategoryRepository.findOne({
            where: {
              voucher_id: voucherId,
              category_id: categoryId,
            },
          });
        if (existingCategoryLink) {
          continue;
        }
        await this.voucherCategoryRepository.save(
          this.voucherCategoryRepository.create({
            voucher_id: voucherId,
            category_id: categoryId,
          }),
        );
        insertedCategoryLinksCount++;
      }
      for (const productId of selectedProductIds) {
        const existingProductLink: VoucherProductEntity | null =
          await this.voucherProductRepository.findOne({
            where: {
              voucher_id: voucherId,
              product_id: productId,
            },
          });
        if (existingProductLink) {
          continue;
        }
        await this.voucherProductRepository.save(
          this.voucherProductRepository.create({
            voucher_id: voucherId,
            product_id: productId,
          }),
        );
        insertedProductLinksCount++;
      }
    }
    return {
      insertedCategoryLinksCount,
      insertedProductLinksCount,
    };
  }

  private async ensureCoffeeVoucherRestrictions(
    voucherIds: number[],
  ): Promise<void> {
    if (voucherIds.length === 0) {
      return;
    }
    const coffeeCategory: CategoryEntity | null =
      await this.categoryRepository.findOne({
        where: { slug: 'coffee-beans', seller_id: IsNull() },
      });
    if (!coffeeCategory) {
      return;
    }
    for (const voucherId of voucherIds) {
      const existingLink: VoucherCategoryEntity | null =
        await this.voucherCategoryRepository.findOne({
          where: {
            voucher_id: voucherId,
            category_id: coffeeCategory.id,
          },
        });
      if (existingLink) {
        continue;
      }
      await this.voucherCategoryRepository.save(
        this.voucherCategoryRepository.create({
          voucher_id: voucherId,
          category_id: coffeeCategory.id,
        }),
      );
    }
  }

  private async ensureMembershipVoucherRestrictions(
    voucherId: number,
    serviceCodes: string[],
  ): Promise<number> {
    if (serviceCodes.length === 0) {
      return 0;
    }
    const services: ServiceEntity[] = await this.serviceRepository.find({
      where: { code: In(serviceCodes) },
      select: ['id', 'code'],
    });
    if (services.length === 0) {
      return 0;
    }
    const serviceIds: number[] = services.map(
      (service: ServiceEntity) => service.id,
    );
    const existingLinks: VoucherServiceEntity[] =
      await this.voucherServiceRepository.find({
        where: { voucher_id: voucherId, service_id: In(serviceIds) },
      });
    const existingServiceIdSet: Set<number> = new Set(
      existingLinks.map((link: VoucherServiceEntity) => link.service_id),
    );
    let insertedCount = 0;
    for (const serviceId of serviceIds) {
      if (existingServiceIdSet.has(serviceId)) {
        continue;
      }
      await this.voucherServiceRepository.save(
        this.voucherServiceRepository.create({
          voucher_id: voucherId,
          service_id: serviceId,
        }),
      );
      insertedCount++;
    }
    return insertedCount;
  }
}
