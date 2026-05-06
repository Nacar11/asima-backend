import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VouchersService } from '@/vouchers/vouchers.service';
import { BaseVoucherRepository } from '@/vouchers/persistence/base-voucher.repository';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { VoucherQrTokenEntity } from '@/vouchers/persistence/entities/voucher-qr-token.entity';
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { VoucherRedemptionEntity } from '@/voucher-redemptions/persistence/entities/voucher-redemption.entity';
import { VoucherCategoryEntity } from '@/voucher-categories/persistence/entities/voucher-category.entity';
import { VoucherProductEntity } from '@/voucher-products/persistence/entities/voucher-product.entity';
import { VoucherServiceCategoryEntity } from '@/voucher-service-categories/persistence/entities/voucher-service-category.entity';
import { VoucherServiceEntity } from '@/voucher-services/persistence/entities/voucher-service.entity';
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
import { Voucher } from '@/vouchers/domain/voucher';
import { VoucherDiscountTypeEnum } from '@/vouchers/enums/voucher-discount-type.enum';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';
import { VoucherStatusEnum } from '@/vouchers/enums/voucher-status.enum';
import { UserVoucherStatusEnum } from '@/vouchers/enums/user-voucher-status.enum';
import { ValidateVoucherDto } from '@/vouchers/dto/validate-voucher.dto';
import { User } from '@/users/domain/user';

describe('VouchersService', () => {
  let module: TestingModule;
  let vouchersService: VouchersService;
  let voucherRepository: jest.Mocked<BaseVoucherRepository>;
  let userVoucherRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let voucherRedemptionRepository: {
    count: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let voucherCategoryRepository: { find: jest.Mock };
  let voucherProductRepository: { find: jest.Mock };
  let voucherServiceCategoryRepository: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let voucherServiceRepository: { find: jest.Mock };
  let productVariantRepository: { find: jest.Mock };
  let productRepository: { find: jest.Mock };
  let productCategoryRepository: { find: jest.Mock };
  let serviceEntityRepository: { find: jest.Mock };

  const now: Date = new Date();
  const sampleUser: User = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
  } as User;

  const baseVoucherFields: Omit<
    Voucher,
    'id' | 'code' | 'discount_type' | 'discount_value'
  > = {
    scope: VoucherScopeEnum.CATEGORIES,
    seller_id: null,
    max_discount_cap: null,
    min_order_amount: 0,
    total_limit: null,
    per_user_limit: 1,
    used_count: 0,
    starts_at: new Date(now.getTime() - 1000 * 60 * 60),
    expires_at: new Date(now.getTime() + 1000 * 60 * 60),
    status: VoucherStatusEnum.ACTIVE,
    is_claimable: true,
    description: null,
    terms_and_conditions: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  } as Omit<Voucher, 'id' | 'code' | 'discount_type' | 'discount_value'>;

  const voucherBreadDiscount: Voucher = {
    ...baseVoucherFields,
    id: 10,
    code: 'BREADBIGDISCOUNT100',
    discount_type: VoucherDiscountTypeEnum.FIXED,
    discount_value: 100,
  };

  const voucherCakeDiscount: Voucher = {
    ...baseVoucherFields,
    id: 9,
    code: 'CAKESDISCOUNT50',
    discount_type: VoucherDiscountTypeEnum.FIXED,
    discount_value: 50,
  };

  const voucherShippingDiscount: Voucher = {
    ...baseVoucherFields,
    id: 4,
    code: 'ADMNSHIP50',
    discount_type: VoucherDiscountTypeEnum.SHIPPING,
    discount_value: 50,
  };

  beforeEach(async () => {
    const mockVoucherRepository: jest.Mocked<BaseVoucherRepository> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      incrementUsedCount: jest.fn(),
      decrementUsedCount: jest.fn(),
    };

    const mockVoucherEntityRepository: Partial<Repository<VoucherEntity>> = {
      createQueryBuilder: jest.fn(),
      manager: {
        transaction: jest.fn(),
      } as unknown as Repository<VoucherEntity>['manager'],
    };

    const defaultUserVoucherQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
      getCount: jest.fn().mockResolvedValue(0),
    };
    const mockUserVoucherRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(defaultUserVoucherQb),
      update: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockVoucherRedemptionRepository = {
      count: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      }),
    };

    const mockVoucherCategoryRepository = { find: jest.fn() };
    const mockVoucherProductRepository = { find: jest.fn() };
    const mockVoucherServiceCategoryRepository = {
      find: jest.fn(),
      create: jest.fn().mockImplementation((p) => p),
      save: jest.fn().mockResolvedValue([]),
    };
    const mockVoucherServiceRepository = { find: jest.fn() };
    const mockSalesOrderVoucherRepository = { upsert: jest.fn() };
    const mockProductRepository = { find: jest.fn() };
    const mockCategoryRepository = { find: jest.fn() };
    const mockProductVariantRepository = { find: jest.fn() };
    const mockProductCategoryRepository = { find: jest.fn() };
    const mockServiceEntityRepository = { find: jest.fn() };
    const mockServiceCategoryEntityRepository = { find: jest.fn() };
    const mockShoppingCartRepository = { findOne: jest.fn() };
    const mockShoppingCartItemRepository = { find: jest.fn() };

    module = await Test.createTestingModule({
      providers: [
        VouchersService,
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn() },
        },
        {
          provide: getRepositoryToken(VoucherQrTokenEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: BaseVoucherRepository,
          useValue: mockVoucherRepository,
        },
        {
          provide: getRepositoryToken(VoucherEntity),
          useValue: mockVoucherEntityRepository,
        },
        {
          provide: getRepositoryToken(UserVoucherEntity),
          useValue: mockUserVoucherRepository,
        },
        {
          provide: getRepositoryToken(VoucherRedemptionEntity),
          useValue: mockVoucherRedemptionRepository,
        },
        {
          provide: getRepositoryToken(VoucherCategoryEntity),
          useValue: mockVoucherCategoryRepository,
        },
        {
          provide: getRepositoryToken(VoucherProductEntity),
          useValue: mockVoucherProductRepository,
        },
        {
          provide: getRepositoryToken(VoucherServiceCategoryEntity),
          useValue: mockVoucherServiceCategoryRepository,
        },
        {
          provide: getRepositoryToken(VoucherServiceEntity),
          useValue: mockVoucherServiceRepository,
        },
        {
          provide: getRepositoryToken(SalesOrderVoucherEntity),
          useValue: mockSalesOrderVoucherRepository,
        },
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: mockCategoryRepository,
        },
        {
          provide: getRepositoryToken(ProductVariantEntity),
          useValue: mockProductVariantRepository,
        },
        {
          provide: getRepositoryToken(ProductCategoryEntity),
          useValue: mockProductCategoryRepository,
        },
        {
          provide: getRepositoryToken(ServiceEntity),
          useValue: mockServiceEntityRepository,
        },
        {
          provide: getRepositoryToken(ServiceCategoryEntity),
          useValue: mockServiceCategoryEntityRepository,
        },
        {
          provide: getRepositoryToken(ShoppingCartEntity),
          useValue: mockShoppingCartRepository,
        },
        {
          provide: getRepositoryToken(ShoppingCartItemEntity),
          useValue: mockShoppingCartItemRepository,
        },
        {
          provide: getRepositoryToken(VoucherGiftLogEntity),
          useValue: { create: jest.fn(), save: jest.fn() },
        },
      ],
    }).compile();

    vouchersService = module.get<VouchersService>(VouchersService);
    voucherRepository = module.get(BaseVoucherRepository);
    userVoucherRepository = module.get(getRepositoryToken(UserVoucherEntity));
    voucherRedemptionRepository = module.get(
      getRepositoryToken(VoucherRedemptionEntity),
    );
    voucherCategoryRepository = module.get(
      getRepositoryToken(VoucherCategoryEntity),
    );
    voucherProductRepository = module.get(
      getRepositoryToken(VoucherProductEntity),
    );
    voucherServiceCategoryRepository = module.get(
      getRepositoryToken(VoucherServiceCategoryEntity),
    );
    voucherServiceRepository = module.get(
      getRepositoryToken(VoucherServiceEntity),
    );
    productVariantRepository = module.get(
      getRepositoryToken(ProductVariantEntity),
    );
    productRepository = module.get(getRepositoryToken(ProductEntity));
    productCategoryRepository = module.get(
      getRepositoryToken(ProductCategoryEntity),
    );
    serviceEntityRepository = module.get(getRepositoryToken(ServiceEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return multi-voucher payload without voucher field and with correct totals formula', async () => {
    const inputPayload: ValidateVoucherDto = {
      vouchers: [9, 10, 4],
      shipping_fee: 1000,
      variants: [
        { variant_id: 84, quantity: 1 },
        { variant_id: 85, quantity: 1 },
      ],
    };

    productVariantRepository.find.mockResolvedValue([
      { id: 84, product_id: 1001, selling_price: 1000 },
      { id: 85, product_id: 1002, selling_price: 470 },
    ]);
    productRepository.find.mockResolvedValue([
      { id: 1001, seller_id: 5 },
      { id: 1002, seller_id: 5 },
    ]);
    productCategoryRepository.find.mockResolvedValue([]);
    serviceEntityRepository.find.mockResolvedValue([]);
    userVoucherRepository.find.mockResolvedValue([
      {
        voucher_id: 9,
        user_id: sampleUser.id,
        status: UserVoucherStatusEnum.AVAILABLE,
      },
      {
        voucher_id: 10,
        user_id: sampleUser.id,
        status: UserVoucherStatusEnum.AVAILABLE,
      },
      {
        voucher_id: 4,
        user_id: sampleUser.id,
        status: UserVoucherStatusEnum.AVAILABLE,
      },
    ]);

    voucherRepository.findById.mockImplementation(
      (id: number): Promise<Voucher | null> => {
        const vouchersById: Record<number, Voucher> = {
          4: voucherShippingDiscount,
          9: voucherCakeDiscount,
          10: voucherBreadDiscount,
        };
        return Promise.resolve(vouchersById[id] ?? null);
      },
    );

    voucherRepository.findByCode.mockImplementation(
      (code: string): Promise<Voucher | null> => {
        const vouchersByCode: Record<string, Voucher> = {
          ADMNSHIP50: voucherShippingDiscount,
          BREADBIGDISCOUNT100: voucherBreadDiscount,
          CAKESDISCOUNT50: voucherCakeDiscount,
        };
        return Promise.resolve(vouchersByCode[code] ?? null);
      },
    );

    voucherRedemptionRepository.count.mockResolvedValue(0);
    voucherCategoryRepository.find.mockResolvedValue([]);
    voucherProductRepository.find.mockResolvedValue([]);
    voucherServiceCategoryRepository.find.mockResolvedValue([]);
    voucherServiceRepository.find.mockResolvedValue([]);

    const actualResult = await vouchersService.validateVoucher(
      inputPayload,
      sampleUser,
    );

    expect(Object.prototype.hasOwnProperty.call(actualResult, 'voucher')).toBe(
      false,
    );
    expect(actualResult.discount_amount).toBe(
      actualResult.item_discount_amount,
    );
    expect(actualResult.final_payable_amount).toBe(
      (actualResult.original_subtotal ?? 0) -
        (actualResult.item_discount_amount ?? 0) +
        (actualResult.shipping_fee ?? 0) -
        (actualResult.shipping_fee_discount ?? 0),
    );
    expect(actualResult.applied_vouchers).toHaveLength(3);
  });

  it('should allow duplicate voucher codes when sufficient user vouchers exist', async () => {
    const voucher: Voucher = {
      ...baseVoucherFields,
      id: 55,
      code: 'MEM-LIFESTYLE-1X',
      discount_type: VoucherDiscountTypeEnum.FIXED,
      discount_value: 100,
      per_user_limit: 9999,
    };
    voucherRepository.findByCode.mockResolvedValue(voucher);
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ voucher_id: 55, count: '2' }]),
    };
    userVoucherRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as Repository<UserVoucherEntity>,
    );

    await expect(
      vouchersService.ensureUserHasClaimedVoucherCodes(
        ['MEM-LIFESTYLE-1X', 'MEM-LIFESTYLE-1X'],
        sampleUser.id,
        { allowDuplicateCodes: true },
      ),
    ).resolves.toBeUndefined();
  });

  describe('recordVoucherRedemption', () => {
    const voucherId = 10;
    const userId = sampleUser.id;
    const userVoucherId = 77;

    const savedRedemption = {
      id: 101,
      user_voucher_id: userVoucherId,
      user_id: userId,
      sales_order_id: null,
      booking_id: 900,
      seller_id: null,
      discount_amount: 100,
      order_subtotal: 500,
    };

    const availableUserVoucher = {
      id: userVoucherId,
      user_id: userId,
      voucher_id: voucherId,
      status: UserVoucherStatusEnum.AVAILABLE,
      collected_at: new Date(),
    };

    const lockedVoucher = {
      id: voucherId,
      code: 'BREADBIGDISCOUNT100',
      total_limit: null,
      per_user_limit: null,
      used_count: 0,
    };

    let mockManager: {
      getRepository: jest.Mock;
    };

    let txVoucherRepo: { findOne: jest.Mock; increment: jest.Mock };
    let txRedemptionRepo: {
      create: jest.Mock;
      save: jest.Mock;
      createQueryBuilder: jest.Mock;
    };
    let txUserVoucherRepo: { createQueryBuilder: jest.Mock; update: jest.Mock };

    beforeEach(() => {
      txVoucherRepo = {
        findOne: jest.fn().mockResolvedValue(lockedVoucher),
        increment: jest.fn().mockResolvedValue(undefined),
      };
      txRedemptionRepo = {
        create: jest.fn().mockImplementation((p) => p),
        save: jest.fn().mockResolvedValue(savedRedemption),
        createQueryBuilder: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
        }),
      };
      txUserVoucherRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(availableUserVoucher),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockManager = {
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === VoucherEntity) return txVoucherRepo;
          if (entity === VoucherRedemptionEntity) return txRedemptionRepo;
          if (entity === UserVoucherEntity) return txUserVoucherRepo;
          return {};
        }),
      };

      // Wire transaction to invoke the callback with mockManager
      const voucherEntityRepository = module.get(
        getRepositoryToken(VoucherEntity),
      ) as any;
      voucherEntityRepository.manager = {
        transaction: jest
          .fn()
          .mockImplementation((cb: (m: any) => Promise<any>) =>
            cb(mockManager),
          ),
      };

      // userVoucherRepository.findOne used to resolve userVoucherId
      userVoucherRepository.findOne.mockResolvedValue(availableUserVoucher);
    });

    it('runs the pessimistic-lock gate and saves the redemption entity', async () => {
      await vouchersService.recordVoucherRedemption({
        voucherId,
        userId,
        orderSubtotal: 500,
        discountAmount: 100,
        bookingId: 900,
        voucherCode: 'BREADBIGDISCOUNT100',
      });

      expect(txVoucherRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: voucherId },
          lock: { mode: 'pessimistic_write' },
        }),
      );
      expect(txRedemptionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: userId, discount_amount: 100 }),
      );
      expect(txVoucherRepo.increment).toHaveBeenCalledWith(
        { id: voucherId },
        'used_count',
        1,
      );
      expect(txUserVoucherRepo.update).toHaveBeenCalledWith(
        userVoucherId,
        expect.objectContaining({ status: UserVoucherStatusEnum.USED }),
      );
    });

    it('includes seller_id in the saved redemption when provided', async () => {
      await vouchersService.recordVoucherRedemption({
        voucherId,
        userId,
        orderSubtotal: 500,
        discountAmount: 100,
        sellerId: 42,
      });

      expect(txRedemptionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ seller_id: 42 }),
      );
    });

    it('throws BadRequestException when total_limit is reached', async () => {
      txVoucherRepo.findOne.mockResolvedValue({
        ...lockedVoucher,
        total_limit: 5,
        used_count: 5,
      });

      await expect(
        vouchersService.recordVoucherRedemption({
          voucherId,
          userId,
          orderSubtotal: 500,
          discountAmount: 100,
        }),
      ).rejects.toThrow('Voucher redemption limit reached');
    });

    it('throws BadRequestException when per_user_limit is reached', async () => {
      txVoucherRepo.findOne.mockResolvedValue({
        ...lockedVoucher,
        per_user_limit: 1,
      });
      txRedemptionRepo.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      });

      await expect(
        vouchersService.recordVoucherRedemption({
          voucherId,
          userId,
          orderSubtotal: 500,
          discountAmount: 100,
        }),
      ).rejects.toThrow('Per-user redemption limit reached');
    });
  });

  describe('createSellerVoucher — SERVICE_CATEGORIES scope', () => {
    const sellerUser: User = { ...sampleUser, seller_id: 42 } as User;
    const baseInput = {
      code: 'WELLNESS-SELLER',
      scope: VoucherScopeEnum.SERVICE_CATEGORIES,
      discount_type: VoucherDiscountTypeEnum.FIXED,
      discount_value: 50,
      service_category_ids: [10, 20],
    };

    beforeEach(() => {
      voucherRepository.findByCode.mockResolvedValue(null);
      voucherRepository.create.mockResolvedValue({
        ...baseVoucherFields,
        id: 99,
        code: 'WELLNESS-SELLER',
        discount_type: VoucherDiscountTypeEnum.FIXED,
        discount_value: 50,
      } as Voucher);
    });

    it('queries serviceEntityRepository filtered by seller_id to derive eligible service categories', async () => {
      serviceEntityRepository.find.mockResolvedValue([
        { category_id: 10 },
        { category_id: 20 },
      ]);

      await vouchersService.createSellerVoucher(baseInput as any, sellerUser);

      expect(serviceEntityRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ seller_id: 42 }),
        }),
      );
    });

    it('saves pivot rows only for service categories where the seller owns at least one service', async () => {
      serviceEntityRepository.find.mockResolvedValue([
        { category_id: 10 },
        { category_id: 20 },
      ]);

      await vouchersService.createSellerVoucher(baseInput as any, sellerUser);

      expect(voucherServiceCategoryRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ service_category_id: 10 }),
          expect.objectContaining({ service_category_id: 20 }),
        ]),
      );
    });

    it('throws BadRequestException when seller owns no services in any requested service category', async () => {
      serviceEntityRepository.find.mockResolvedValue([]);

      await expect(
        vouchersService.createSellerVoucher(baseInput as any, sellerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('does not create the voucher row when service category validation fails', async () => {
      serviceEntityRepository.find.mockResolvedValue([]);

      await expect(
        vouchersService.createSellerVoucher(baseInput as any, sellerUser),
      ).rejects.toThrow(BadRequestException);

      expect(voucherRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('user_vouchers.expires_at propagation', () => {
    let txUserVoucherRepo: {
      create: jest.Mock;
      save: jest.Mock;
      findOne: jest.Mock;
    };
    let mockManager: { getRepository: jest.Mock };

    const wireTransaction = (): void => {
      txUserVoucherRepo = {
        create: jest.fn().mockImplementation((p) => p),
        save: jest
          .fn()
          .mockImplementation((p) => Promise.resolve({ id: 1, ...p })),
        findOne: jest.fn().mockResolvedValue(null),
      };
      mockManager = {
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === UserVoucherEntity) return txUserVoucherRepo;
          return {};
        }),
      };
      const voucherEntityRepository = module.get(
        getRepositoryToken(VoucherEntity),
      ) as any;
      voucherEntityRepository.manager = {
        transaction: jest
          .fn()
          .mockImplementation((cb: (m: any) => Promise<any>) =>
            cb(mockManager),
          ),
        getRepository: jest.fn().mockReturnValue({
          find: jest.fn().mockResolvedValue([]),
          findOne: jest.fn().mockResolvedValue(null),
        }),
      };
    };

    const stubEnrichDependencies = (): void => {
      voucherCategoryRepository.find.mockResolvedValue([]);
      voucherProductRepository.find.mockResolvedValue([]);
      voucherServiceRepository.find.mockResolvedValue([]);
      voucherServiceCategoryRepository.find.mockResolvedValue([]);
      (userVoucherRepository as any).count = jest.fn().mockResolvedValue(0);
    };

    beforeEach(() => {
      stubEnrichDependencies();
      wireTransaction();
    });

    it('collectVoucher persists user_vouchers.expires_at from voucher.expires_at', async () => {
      const claimableExpiresAt: Date = new Date(
        now.getTime() + 1000 * 60 * 60 * 24,
      );
      const claimableVoucher: Voucher = {
        ...baseVoucherFields,
        id: 200,
        code: 'CLAIMABLE-WITH-EXPIRY',
        discount_type: VoucherDiscountTypeEnum.FIXED,
        discount_value: 10,
        expires_at: claimableExpiresAt,
      };
      voucherRepository.findById.mockResolvedValue(claimableVoucher);

      await vouchersService.collectVoucher(claimableVoucher.id, sampleUser);

      expect(txUserVoucherRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ expires_at: claimableExpiresAt }),
      );
    });

    it('collectVoucher persists user_vouchers.expires_at as null when voucher.expires_at is null', async () => {
      const evergreenVoucher: Voucher = {
        ...baseVoucherFields,
        id: 201,
        code: 'CLAIMABLE-NO-EXPIRY',
        discount_type: VoucherDiscountTypeEnum.FIXED,
        discount_value: 10,
        expires_at: null,
      };
      voucherRepository.findById.mockResolvedValue(evergreenVoucher);

      await vouchersService.collectVoucher(evergreenVoucher.id, sampleUser);

      expect(txUserVoucherRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ expires_at: null }),
      );
    });

    it('giftVoucherToUsers propagates voucher.expires_at to created user_vouchers', async () => {
      const sellerCauser: User = { ...sampleUser, seller_id: 42 } as User;
      const giftedExpiresAt: Date = new Date(
        now.getTime() + 1000 * 60 * 60 * 48,
      );
      const sellerVoucher: Voucher = {
        ...baseVoucherFields,
        id: 300,
        code: 'SELLER-GIFT',
        discount_type: VoucherDiscountTypeEnum.FIXED,
        discount_value: 25,
        seller_id: 42,
        expires_at: giftedExpiresAt,
      };
      voucherRepository.findById.mockResolvedValue(sellerVoucher);

      await vouchersService.giftVoucherToUsers(
        sellerVoucher.id,
        { user_ids: [sampleUser.id], quantity_per_user: 1 } as any,
        sellerCauser,
      );

      expect(txUserVoucherRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ expires_at: giftedExpiresAt }),
      );
    });

    it('giftAdminVoucherToUsers propagates voucher.expires_at to created user_vouchers', async () => {
      const adminCauser: User = { ...sampleUser, system_admin: true } as User;
      const adminGiftExpiresAt: Date = new Date(
        now.getTime() + 1000 * 60 * 60 * 72,
      );
      const adminVoucher: Voucher = {
        ...baseVoucherFields,
        id: 400,
        code: 'ADMIN-GIFT',
        discount_type: VoucherDiscountTypeEnum.FIXED,
        discount_value: 75,
        seller_id: null,
        expires_at: adminGiftExpiresAt,
      };
      voucherRepository.findById.mockResolvedValue(adminVoucher);

      await vouchersService.giftAdminVoucherToUsers(
        adminVoucher.id,
        { user_ids: [sampleUser.id], quantity_per_user: 1 } as any,
        adminCauser,
      );

      expect(txUserVoucherRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ expires_at: adminGiftExpiresAt }),
      );
    });
  });
});
