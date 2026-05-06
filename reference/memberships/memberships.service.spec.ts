import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ParametersService } from '@/parameters/parameters.service';
import { MembershipsService } from '@/memberships/memberships.service';
import { BaseMembershipRepository } from '@/memberships/persistence/base-membership.repository';
import { BaseMembershipPaymentRepository } from '@/memberships/persistence/base-membership-payment.repository';
import { BaseMembershipVoucherGrantRepository } from '@/memberships/persistence/base-membership-voucher-grant.repository';
import { BaseMembershipVoucherConfigurationRepository } from '@/membership-voucher-configurations/persistence/base-membership-voucher-configuration.repository';
import { UserAssignmentsService } from '@/user-assignments/user-assignments.service';
import { UserGroupsService } from '@/user-groups/user-groups.service';
import { StorageService } from '@/storage/storage.service';
import { MembershipPaymentStatusEnum } from '@/memberships/enums/membership-payment-status.enum';
import { MembershipStatusEnum } from '@/memberships/enums/membership-status.enum';
import { Membership } from '@/memberships/domain/membership';
import { MembershipPayment } from '@/memberships/domain/membership-payment';
import { RenewMembershipDto } from '@/memberships/dto/renew-membership.dto';
import { ActivateMembershipDto } from '@/memberships/dto/activate-membership.dto';
import { SubmitMembershipPaymentDto } from '@/memberships/dto/submit-membership-payment.dto';
import { MembershipPlanEntity } from '@/memberships/persistence/entities/membership-plan.entity';
import { MembershipPlanBillingPeriodEntity } from '@/memberships/persistence/entities/membership-plan-billing-period.entity';
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { VoucherCategoryEntity } from '@/voucher-categories/persistence/entities/voucher-category.entity';
import { VoucherProductEntity } from '@/voucher-products/persistence/entities/voucher-product.entity';
import { ObjectLiteral, Repository } from 'typeorm';
import { User } from '@/users/domain/user';

type MockRepository<T extends ObjectLiteral> = Pick<
  Repository<T>,
  'findOne' | 'find' | 'count' | 'create' | 'save'
>;

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeUser = (id: number): User => ({ id }) as User;

const makeMembership = (overrides: Partial<Membership> = {}): Membership =>
  ({
    id: 10,
    user_id: 15,
    membership_plan_id: 1,
    membership_plan_billing_period_id: 1,
    status: MembershipStatusEnum.ACTIVE,
    starts_at: new Date('2026-01-01T00:00:00.000Z'),
    ends_at: new Date('2099-01-01T00:00:00.000Z'),
    grace_ends_at: null,
    is_auto_renew_enabled: false,
    cancelled_at: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }) as Membership;

const makePayment = (
  overrides: Partial<MembershipPayment> = {},
): MembershipPayment =>
  ({
    id: 25,
    membership_id: 10,
    user_id: 15,
    membership_plan_billing_period_id: 1,
    membership_plan_id: 1,
    membership_plan_code: 'starter',
    membership_plan_name: 'Starter',
    billing_period_code: 'monthly',
    billing_duration_months: 1,
    base_monthly_price: 1499,
    discount_percentage: 0,
    amount: 1499,
    currency: 'PHP',
    payment_status: MembershipPaymentStatusEnum.PENDING,
    provider: null,
    provider_reference: 'MOCK-MEM-ABCD1234',
    payment_method_code: 'gcash',
    payment_proof_url: null,
    payment_proof_key: null,
    expires_at: null,
    paid_at: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }) as MembershipPayment;

const makePlanBillingPeriod = (
  overrides: Partial<MembershipPlanBillingPeriodEntity> = {},
): MembershipPlanBillingPeriodEntity =>
  ({
    id: 1,
    membership_plan_id: 1,
    billing_period_id: 1,
    total_price: 1499,
    discount_percentage: 0,
    is_active: true,
    billing_period: {
      id: 1,
      period_code: 'monthly',
      period_name: '1 Month',
      duration_in_months: 1,
      duration_in_days: 30,
    },
    ...overrides,
  }) as MembershipPlanBillingPeriodEntity;

const makePlan = (
  overrides: Partial<MembershipPlanEntity> = {},
): MembershipPlanEntity =>
  ({
    id: 1,
    plan_code: 'starter',
    plan_name: 'Starter',
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    deleted_at: null,
    ...overrides,
  }) as MembershipPlanEntity;

const emptyGrantResult = () => ({
  data: [],
  totalCount: 0,
  skip: 0,
  take: 500,
});

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('MembershipsService', () => {
  let service: MembershipsService;
  let mockMembershipRepository: jest.Mocked<BaseMembershipRepository>;
  let mockMembershipPaymentRepository: jest.Mocked<BaseMembershipPaymentRepository>;
  let mockMembershipVoucherGrantRepository: jest.Mocked<BaseMembershipVoucherGrantRepository>;
  let mockMembershipVoucherConfigurationRepository: jest.Mocked<BaseMembershipVoucherConfigurationRepository>;
  let mockMembershipPlanRepository: jest.Mocked<
    MockRepository<MembershipPlanEntity>
  >;
  let mockPlanBillingPeriodRepository: jest.Mocked<
    MockRepository<MembershipPlanBillingPeriodEntity>
  >;
  let mockUserVoucherRepository: jest.Mocked<MockRepository<UserVoucherEntity>>;
  let mockVoucherRepository: jest.Mocked<MockRepository<VoucherEntity>>;
  let mockVoucherCategoryRepository: jest.Mocked<
    MockRepository<VoucherCategoryEntity>
  >;
  let mockVoucherProductRepository: jest.Mocked<
    MockRepository<VoucherProductEntity>
  >;
  let mockParametersService: jest.Mocked<ParametersService>;
  let mockUserAssignmentsService: jest.Mocked<UserAssignmentsService>;
  let mockUserGroupsService: jest.Mocked<UserGroupsService>;
  let mockStorageService: jest.Mocked<StorageService>;
  // Captures every `UserVoucherEntity` payload saved through the transactional
  // `manager.getRepository(UserVoucherEntity).save(...)` path. Lets tests
  // assert on `expires_at` without coupling to the concrete repo mock.
  let userVoucherSaves: Array<Partial<UserVoucherEntity>>;

  beforeEach(() => {
    userVoucherSaves = [];
    mockMembershipRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn().mockImplementation(async () => makeMembership()), // default: return a sensible membership
      findLatestByUserId: jest.fn(),
      findActiveByUserId: jest.fn(),
      findActiveOrGraceByUserId: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    mockMembershipPaymentRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByMembershipId: jest.fn().mockResolvedValue([]),
      findByProviderReference: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    mockMembershipVoucherGrantRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByMembershipId: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    mockMembershipVoucherConfigurationRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    mockMembershipPlanRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockPlanBillingPeriodRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockUserVoucherRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockVoucherRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockVoucherCategoryRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockVoucherProductRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockParametersService = {
      findByCode: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<ParametersService>;
    mockUserAssignmentsService = {
      findActiveByUserId: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<UserAssignmentsService>;
    mockUserGroupsService = {
      findCustomerGroup: jest.fn().mockResolvedValue({ id: 99 }),
    } as unknown as jest.Mocked<UserGroupsService>;
    mockStorageService = {
      put: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    service = new MembershipsService(
      mockMembershipRepository,
      mockMembershipPaymentRepository,
      mockMembershipVoucherGrantRepository,
      mockMembershipVoucherConfigurationRepository,
      mockParametersService,
      mockUserAssignmentsService,
      mockUserGroupsService,
      mockStorageService,
      mockMembershipPlanRepository as unknown as Repository<MembershipPlanEntity>,
      mockPlanBillingPeriodRepository as unknown as Repository<MembershipPlanBillingPeriodEntity>,
      mockUserVoucherRepository as unknown as Repository<UserVoucherEntity>,
      mockVoucherRepository as unknown as Repository<VoucherEntity>,
      mockVoucherCategoryRepository as unknown as Repository<VoucherCategoryEntity>,
      mockVoucherProductRepository as unknown as Repository<VoucherProductEntity>,
      {
        findById: jest.fn(),
        findByCode: jest.fn().mockResolvedValue(null),
      } as any, // customPaymentMethodRepository
      {
        sendMembershipPaymentConfirmed: jest.fn().mockResolvedValue({}),
        sendMembershipPaymentVoided: jest.fn().mockResolvedValue({}),
        sendMembershipPaymentSubmitted: jest.fn().mockResolvedValue({}),
        sendMembershipPaymentSubmittedAdmin: jest.fn().mockResolvedValue({}),
        sendMembershipPaymentConfirmedAdmin: jest.fn().mockResolvedValue({}),
        sendMembershipPaymentVoidedAdmin: jest.fn().mockResolvedValue({}),
        notify: jest.fn().mockResolvedValue({}),
      } as any, // notificationsService
      { findOne: jest.fn().mockResolvedValue(null) } as any, // userEntityRepository
      {
        transaction: jest.fn(async (fnOrIso: any, maybeFn?: any) => {
          const fn = typeof maybeFn === 'function' ? maybeFn : fnOrIso;
          // Provide a manager whose getRepository() mirrors the base-repo
          // mocks for the two entities that `activateMembership` + helpers
          // touch during the serializable transaction.
          const manager = {
            getRepository: (entity: any) => {
              const name: string =
                typeof entity === 'string' ? entity : (entity?.name ?? '');
              // Minimal shape sufficient for the transactional path:
              // - locked payment lookup → reuse base payment repo
              // - grants idempotency find → empty → proceeds to write path
              // - membership update → reuse base repo
              if (name.includes('MembershipPayment')) {
                return {
                  findOne: (args: any) =>
                    mockMembershipPaymentRepository.findById(args?.where?.id),
                  save: jest.fn(async (x: any) => x),
                  merge: (a: any, b: any) => ({ ...a, ...b }),
                  create: (x: any) => x,
                  update: jest.fn(),
                };
              }
              if (name.includes('MembershipVoucherGrant')) {
                return {
                  find: jest.fn().mockResolvedValue([]),
                  // Echo the saved entity so MembershipVoucherGrantMapper.toDomain
                  // (called inside createActivationVoucherGrants) does not crash
                  // on `undefined`.
                  save: jest.fn((x: any) => Promise.resolve(x)),
                  create: (x: any) => x,
                };
              }
              if (name.includes('Membership')) {
                return {
                  findOne: (args: any) =>
                    mockMembershipRepository.findById(args?.where?.id),
                  save: jest.fn(async (x: any) => x),
                  merge: (a: any, b: any) => ({ ...a, ...b }),
                  create: (x: any) => x,
                  update: jest.fn(),
                };
              }
              if (name.includes('UserVoucher')) {
                return {
                  findOne: jest.fn().mockResolvedValue(null),
                  find: jest.fn().mockResolvedValue([]),
                  save: jest.fn((x: any) => {
                    userVoucherSaves.push(x);
                    return Promise.resolve(x);
                  }),
                  merge: (a: any, b: any) => ({ ...a, ...b }),
                  create: (x: any) => x,
                  update: jest.fn(),
                  // No-op QueryBuilder for the renewal EXPIRED bulk update.
                  // Build a self-returning chain so any number of `.where()`/
                  // `.andWhere()`/`.set()` calls work, and `.execute()` is
                  // always available at the leaf.
                  createQueryBuilder: () => {
                    const qb: any = {
                      update: () => qb,
                      set: () => qb,
                      where: () => qb,
                      andWhere: () => qb,
                      execute: jest.fn().mockResolvedValue(undefined),
                    };
                    return qb;
                  },
                };
              }
              return {
                findOne: jest.fn().mockResolvedValue(null),
                find: jest.fn().mockResolvedValue([]),
                save: jest.fn(),
                merge: (a: any, b: any) => ({ ...a, ...b }),
                create: (x: any) => x,
                update: jest.fn(),
              };
            },
          };
          return await fn(manager);
        }),
      } as any, // dataSource
    );
  });

  // ─── registerMembership ─────────────────────────────────────────────────

  describe('registerMembership', () => {
    it('should create a new membership and payment for a first-time registrant', async () => {
      const causer = makeUser(15);
      const plan = makePlan();
      const period = makePlanBillingPeriod();
      const createdMembership = makeMembership({
        status: MembershipStatusEnum.PENDING,
        starts_at: null,
        ends_at: null,
      });
      const createdPayment = makePayment();

      mockMembershipRepository.findActiveOrGraceByUserId.mockResolvedValue(
        null,
      );
      mockMembershipPlanRepository.findOne.mockResolvedValue(plan);
      mockPlanBillingPeriodRepository.findOne.mockResolvedValue(period);
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(null);
      mockMembershipRepository.create.mockResolvedValue(createdMembership);
      mockMembershipPaymentRepository.create.mockResolvedValue(createdPayment);

      const result = await service.registerMembership(
        {
          membership_plan_id: 1,
          membership_plan_billing_period_id: 1,
          payment_method_code: 'gcash',
          ip_address: '127.0.0.1',
        },
        causer,
      );

      expect(mockMembershipRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 15,
          membership_plan_id: 1,
          status: MembershipStatusEnum.PENDING,
          starts_at: null,
          ends_at: null,
        }),
      );
      expect(mockMembershipPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          membership_id: 10,
          user_id: 15,
          payment_status: MembershipPaymentStatusEnum.PENDING,
          amount: 1499,
          currency: 'PHP',
        }),
      );
      expect(result.membership_id).toBe(10);
      expect(result.membership_payment_id).toBe(25);
      expect(result.payment_status).toBe(MembershipPaymentStatusEnum.PENDING);
      expect(result.already_pending).toBeFalsy();
    });

    it('should reuse an existing cancelled membership row', async () => {
      const causer = makeUser(15);
      const existingMembership = makeMembership({
        status: MembershipStatusEnum.CANCELLED,
        starts_at: null,
        ends_at: null,
      });
      const plan = makePlan();
      const period = makePlanBillingPeriod();
      const updatedMembership = {
        ...existingMembership,
        status: MembershipStatusEnum.PENDING,
      };
      const createdPayment = makePayment();

      mockMembershipRepository.findActiveOrGraceByUserId.mockResolvedValue(
        null,
      );
      mockMembershipPlanRepository.findOne.mockResolvedValue(plan);
      mockPlanBillingPeriodRepository.findOne.mockResolvedValue(period);
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(
        existingMembership,
      );
      mockMembershipRepository.update.mockResolvedValue(
        updatedMembership as Membership,
      );
      mockMembershipPaymentRepository.create.mockResolvedValue(createdPayment);

      const result = await service.registerMembership(
        {
          membership_plan_id: 1,
          membership_plan_billing_period_id: 1,
          payment_method_code: 'gcash',
          ip_address: '127.0.0.1',
        },
        causer,
      );

      expect(mockMembershipRepository.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ status: MembershipStatusEnum.PENDING }),
      );
      expect(mockMembershipRepository.create).not.toHaveBeenCalled();
      expect(result.membership_id).toBe(10);
    });

    it('should return already_pending if membership is already PENDING with an existing payment', async () => {
      const causer = makeUser(15);
      const pendingMembership = makeMembership({
        status: MembershipStatusEnum.PENDING,
        starts_at: null,
        ends_at: null,
      });
      const existingPayment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PENDING,
      });
      const plan = makePlan();
      const period = makePlanBillingPeriod();

      mockMembershipRepository.findActiveOrGraceByUserId.mockResolvedValue(
        null,
      );
      mockMembershipPlanRepository.findOne.mockResolvedValue(plan);
      mockPlanBillingPeriodRepository.findOne.mockResolvedValue(period);
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(
        pendingMembership,
      );
      mockMembershipPaymentRepository.findByMembershipId.mockResolvedValue([
        existingPayment,
      ]);

      const result = await service.registerMembership(
        {
          membership_plan_id: 1,
          membership_plan_billing_period_id: 1,
          payment_method_code: 'gcash',
          ip_address: '127.0.0.1',
        },
        causer,
      );

      expect(result.already_pending).toBe(true);
      expect(result.membership_payment_id).toBe(25);
      expect(mockMembershipRepository.create).not.toHaveBeenCalled();
      expect(mockMembershipPaymentRepository.create).not.toHaveBeenCalled();
    });

    it('should throw if membership plan does not exist', async () => {
      mockMembershipRepository.findActiveOrGraceByUserId.mockResolvedValue(
        null,
      );
      mockMembershipPlanRepository.findOne.mockResolvedValue(null);

      await expect(
        service.registerMembership(
          {
            membership_plan_id: 999,
            membership_plan_billing_period_id: 1,
            payment_method_code: 'gcash',
            ip_address: '127.0.0.1',
          },
          makeUser(15),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if billing period does not exist', async () => {
      mockMembershipPlanRepository.findOne.mockResolvedValue(makePlan());
      mockPlanBillingPeriodRepository.findOne.mockResolvedValue(null);

      await expect(
        service.registerMembership(
          {
            membership_plan_id: 1,
            membership_plan_billing_period_id: 999,
            payment_method_code: 'gcash',
            ip_address: '127.0.0.1',
          },
          makeUser(15),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ─── renewMembership ────────────────────────────────────────────────────

  describe('renewMembership', () => {
    it('should create a pending payment for renewal using the requested plan', async () => {
      const causer = makeUser(15);
      const membership = makeMembership();
      const plan = makePlan({ id: 3, plan_code: 'elite', plan_name: 'Elite' });
      const period = makePlanBillingPeriod({ id: 5, membership_plan_id: 3 });
      const createdPayment = makePayment({
        id: 25,
        membership_plan_id: 3,
        membership_plan_code: 'elite',
      });

      mockMembershipRepository.findLatestByUserId.mockResolvedValue(membership);
      mockMembershipPlanRepository.findOne.mockResolvedValue(plan);
      mockPlanBillingPeriodRepository.findOne.mockResolvedValue(period);
      mockMembershipPaymentRepository.create.mockResolvedValue(createdPayment);

      const input: RenewMembershipDto = {
        membership_plan_id: 3,
        membership_plan_billing_period_id: 5,
      };
      const result = await service.renewMembership(input, causer);

      expect(mockMembershipPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          membership_id: 10,
          user_id: 15,
          membership_plan_id: 3,
          membership_plan_code: 'elite',
          payment_status: MembershipPaymentStatusEnum.PENDING,
        }),
      );
      expect(result.membership_id).toBe(10);
      expect(result.membership_payment_id).toBe(25);
    });

    it('should throw BadRequestException if membership does not belong to current user', async () => {
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(
        makeMembership({ user_id: 15 }),
      );

      await expect(
        service.renewMembership({ membership_plan_id: 1 }, makeUser(99)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if user has no membership', async () => {
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(null);

      await expect(
        service.renewMembership({ membership_plan_id: 1 }, makeUser(15)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ─── activateMembership ─────────────────────────────────────────────────

  describe('activateMembership', () => {
    it('should activate membership and update plan/billing period from the payment snapshot', async () => {
      const causer = makeUser(15);
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PAID,
        membership_plan_id: 3,
        membership_plan_billing_period_id: 5,
        membership_plan_code: 'elite',
        billing_duration_months: 1,
      });
      const membership = makeMembership({
        starts_at: null,
        ends_at: null,
        status: MembershipStatusEnum.PENDING,
      });
      const updatedMembership = {
        ...membership,
        status: MembershipStatusEnum.ACTIVE,
        membership_plan_id: 3,
      };

      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipVoucherGrantRepository.findAll.mockResolvedValue(
        emptyGrantResult(),
      );
      mockMembershipPaymentRepository.findByMembershipId.mockResolvedValue([
        payment,
      ]);
      mockMembershipVoucherConfigurationRepository.findAll.mockResolvedValue(
        emptyGrantResult(),
      );
      mockMembershipPaymentRepository.update.mockResolvedValue(payment);
      mockMembershipRepository.update.mockResolvedValue(
        updatedMembership as Membership,
      );

      const result = await service.activateMembership(
        { membership_payment_id: 25 } as ActivateMembershipDto,
        causer,
      );

      expect(mockMembershipRepository.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          status: MembershipStatusEnum.ACTIVE,
          membership_plan_id: 3,
          membership_plan_billing_period_id: 5,
        }),
      );
      expect(result.membership.membership_plan_id).toBe(3);
    });

    it('should throw if payment does not belong to current user', async () => {
      const payment = makePayment({ user_id: 99 });
      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);

      await expect(
        service.activateMembership(
          { membership_payment_id: 25 } as ActivateMembershipDto,
          makeUser(15),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if payment is not in PAID status', async () => {
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PENDING,
      });
      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);

      await expect(
        service.activateMembership(
          { membership_payment_id: 25 } as ActivateMembershipDto,
          makeUser(15),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return early if voucher grants already exist (idempotent)', async () => {
      const causer = makeUser(15);
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PAID,
      });
      const membership = makeMembership();
      const existingGrant = {
        id: 1,
        voucher_code: 'VOUCHER10',
        membership_id: 10,
        voucher_scope: 'categories',
      };

      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipVoucherGrantRepository.findAll.mockResolvedValue({
        data: [existingGrant as any],
        totalCount: 1,
        skip: 0,
        take: 10,
      });
      // buildGroupedActivationVoucherGrants calls voucherRepository.find
      mockVoucherRepository.find.mockResolvedValue([]);

      const result = await service.activateMembership(
        { membership_payment_id: 25 } as ActivateMembershipDto,
        causer,
      );

      expect(mockMembershipRepository.update).not.toHaveBeenCalled();
      expect(result.membership).toEqual(membership);
    });

    // ─── user_vouchers.expires_at sourcing ────────────────────────────────
    //
    // `createActivationVoucherGrants` was changed to derive the granted
    // user_voucher's `expires_at` from `grace_ends_at` (with `?? ends_at`
    // fallback) instead of `ends_at`. Three cases:
    //  1. Initial activation with `grace_ends_at` populated → expires_at
    //     equals grace_ends_at (DB value, NOT recomputed).
    //  2. Renewal with `grace_ends_at` populated → same sourcing rule on
    //     the renewal path (isRenewal=true).
    //  3. `grace_ends_at` null on the freshly-saved membership → fallback
    //     to ends_at so vouchers still have a valid expiry.

    it('should grant user_vouchers expiring at grace_ends_at on initial activation', async () => {
      const causer = makeUser(15);
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PAID,
      });
      const membership = makeMembership({
        starts_at: null,
        ends_at: null,
        status: MembershipStatusEnum.PENDING,
        grace_ends_at: null,
      });
      // Simulate `updateMembershipInTransaction` returning the updated row:
      // the repo mock above echoes whatever was saved, so `grace_ends_at`
      // will reflect the value computed inside the service (calculated from
      // `ends_at + grace_period`). We assert that the user_voucher save
      // payload uses THAT date — not `ends_at`.
      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipVoucherGrantRepository.findAll.mockResolvedValue(
        emptyGrantResult(),
      );
      mockMembershipPaymentRepository.findByMembershipId.mockResolvedValue([
        payment,
      ]);
      mockMembershipVoucherConfigurationRepository.findAll.mockResolvedValue({
        data: [
          {
            id: 1,
            membership_plan_id: 1,
            voucher_id: 77,
            voucher_code: 'WELCOME10',
            quantity: 1,
            is_active: true,
            created_at: new Date('2026-01-01T00:00:00.000Z'),
            updated_at: new Date('2026-01-01T00:00:00.000Z'),
          } as any,
        ],
        totalCount: 1,
        skip: 0,
        take: 500,
      });
      mockVoucherRepository.find.mockResolvedValue([]);

      const beforeNow: number = Date.now();
      await service.activateMembership(
        { membership_payment_id: 25 } as ActivateMembershipDto,
        causer,
      );
      const afterNow: number = Date.now();

      // grace_period parameter is unmocked → `calculateGraceEndDate` falls
      // back to 7 days. ends_at = renewalStartAt + 30 days; grace_ends_at
      // = ends_at + 7 days. expires_at on the user_voucher MUST equal
      // grace_ends_at, NOT ends_at.
      expect(userVoucherSaves).toHaveLength(1);
      const savedExpiresAt: Date = userVoucherSaves[0].expires_at as Date;
      // Lower bound: now + 30 days (= ends_at_min). expires_at must be
      // strictly past this — proving the grace window is honored.
      const endsAtMin: Date = new Date(beforeNow);
      endsAtMin.setDate(endsAtMin.getDate() + 30);
      expect(savedExpiresAt.getTime()).toBeGreaterThan(endsAtMin.getTime());
      // Upper bound: now + 30 + 7 + small slack. Must be approx ends_at + 7.
      const endsAtMax: Date = new Date(afterNow);
      endsAtMax.setDate(endsAtMax.getDate() + 37);
      expect(savedExpiresAt.getTime()).toBeLessThanOrEqual(
        endsAtMax.getTime() + 1000,
      );
    });

    it('should grant user_vouchers expiring at grace_ends_at on renewal', async () => {
      const causer = makeUser(15);
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PAID,
      });
      // Existing GRACE_PERIOD membership still within grace → renewal
      // anchors on existing ends_at (anti-abuse). resolveRenewalAnchor
      // returns `now` for ACTIVE, so we use GRACE_PERIOD here for a
      // deterministic anchor.
      const existingEndsAt: Date = new Date('2099-01-15T00:00:00.000Z');
      const existingGraceEndsAt: Date = new Date('2099-01-22T00:00:00.000Z');
      const membership = makeMembership({
        status: MembershipStatusEnum.GRACE_PERIOD,
        starts_at: new Date('2098-01-15T00:00:00.000Z'),
        ends_at: existingEndsAt,
        grace_ends_at: existingGraceEndsAt,
      });
      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipVoucherGrantRepository.findAll.mockResolvedValue(
        emptyGrantResult(),
      );
      // Two payments → isRenewal = true.
      mockMembershipPaymentRepository.findByMembershipId.mockResolvedValue([
        makePayment({ id: 24 }),
        payment,
      ]);
      mockMembershipVoucherConfigurationRepository.findAll.mockResolvedValue({
        data: [
          {
            id: 2,
            membership_plan_id: 1,
            voucher_id: 88,
            voucher_code: 'RENEW20',
            quantity: 1,
            is_active: true,
            created_at: new Date('2026-01-01T00:00:00.000Z'),
            updated_at: new Date('2026-01-01T00:00:00.000Z'),
          } as any,
        ],
        totalCount: 1,
        skip: 0,
        take: 500,
      });
      mockVoucherRepository.find.mockResolvedValue([]);

      await service.activateMembership(
        { membership_payment_id: 25 } as ActivateMembershipDto,
        causer,
      );

      // Renewal anchor = existing ends_at (ACTIVE stacks). New ends_at =
      // existingEndsAt + 30 days = 2099-02-14. New grace_ends_at =
      // ends_at + 7 days = 2099-02-21.
      expect(userVoucherSaves).toHaveLength(1);
      const savedExpiresAt: Date = userVoucherSaves[0].expires_at as Date;
      const expectedEndsAt: Date = new Date(existingEndsAt);
      expectedEndsAt.setDate(expectedEndsAt.getDate() + 30);
      const expectedGraceEndsAt: Date = new Date(expectedEndsAt);
      expectedGraceEndsAt.setDate(expectedGraceEndsAt.getDate() + 7);
      expect(savedExpiresAt.toISOString()).toBe(
        expectedGraceEndsAt.toISOString(),
      );
    });

    it('should fall back to ends_at when grace_ends_at resolves to null on the saved membership', async () => {
      const causer = makeUser(15);
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PAID,
      });
      const membership = makeMembership({
        starts_at: null,
        ends_at: null,
        status: MembershipStatusEnum.PENDING,
        grace_ends_at: null,
      });
      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipVoucherGrantRepository.findAll.mockResolvedValue(
        emptyGrantResult(),
      );
      mockMembershipPaymentRepository.findByMembershipId.mockResolvedValue([
        payment,
      ]);
      mockMembershipVoucherConfigurationRepository.findAll.mockResolvedValue({
        data: [
          {
            id: 3,
            membership_plan_id: 1,
            voucher_id: 99,
            voucher_code: 'NOGRACE',
            quantity: 1,
            is_active: true,
            created_at: new Date('2026-01-01T00:00:00.000Z'),
            updated_at: new Date('2026-01-01T00:00:00.000Z'),
          } as any,
        ],
        totalCount: 1,
        skip: 0,
        take: 500,
      });
      mockVoucherRepository.find.mockResolvedValue([]);

      // Force `nextMembership.grace_ends_at` to be null in the saved row.
      // The dataSource transaction mock for MembershipEntity echoes whatever
      // was saved; we override `save` to clear `grace_ends_at` so the
      // service must fall back to `endsAt`.
      const dataSourceMock = (service as any).dataSource;
      const originalTransaction = dataSourceMock.transaction;
      dataSourceMock.transaction = jest.fn(
        async (fnOrIso: any, maybeFn?: any) => {
          const fn = typeof maybeFn === 'function' ? maybeFn : fnOrIso;
          const manager = {
            getRepository: (entity: any) => {
              const name: string =
                typeof entity === 'string' ? entity : (entity?.name ?? '');
              if (name.includes('MembershipPayment')) {
                return {
                  findOne: (args: any) =>
                    mockMembershipPaymentRepository.findById(args?.where?.id),
                  save: jest.fn((x: any) => Promise.resolve(x)),
                  merge: (a: any, b: any) => ({ ...a, ...b }),
                  create: (x: any) => x,
                  update: jest.fn(),
                };
              }
              if (name.includes('MembershipVoucherGrant')) {
                return {
                  find: jest.fn().mockResolvedValue([]),
                  save: jest.fn((x: any) => Promise.resolve(x)),
                  create: (x: any) => x,
                };
              }
              if (name.includes('Membership')) {
                return {
                  findOne: (args: any) =>
                    mockMembershipRepository.findById(args?.where?.id),
                  // Force grace_ends_at to null on the saved membership row.
                  save: jest.fn((x: any) =>
                    Promise.resolve({ ...x, grace_ends_at: null }),
                  ),
                  merge: (a: any, b: any) => ({ ...a, ...b }),
                  create: (x: any) => x,
                  update: jest.fn(),
                };
              }
              if (name.includes('UserVoucher')) {
                return {
                  findOne: jest.fn().mockResolvedValue(null),
                  find: jest.fn().mockResolvedValue([]),
                  save: jest.fn((x: any) => {
                    userVoucherSaves.push(x);
                    return Promise.resolve(x);
                  }),
                  merge: (a: any, b: any) => ({ ...a, ...b }),
                  create: (x: any) => x,
                  update: jest.fn(),
                  createQueryBuilder: () => {
                    const qb: any = {
                      update: () => qb,
                      set: () => qb,
                      where: () => qb,
                      andWhere: () => qb,
                      execute: jest.fn().mockResolvedValue(undefined),
                    };
                    return qb;
                  },
                };
              }
              return {
                findOne: jest.fn().mockResolvedValue(null),
                find: jest.fn().mockResolvedValue([]),
                save: jest.fn(),
                merge: (a: any, b: any) => ({ ...a, ...b }),
                create: (x: any) => x,
                update: jest.fn(),
              };
            },
          };
          return await fn(manager);
        },
      );

      try {
        await service.activateMembership(
          { membership_payment_id: 25 } as ActivateMembershipDto,
          causer,
        );

        expect(userVoucherSaves).toHaveLength(1);
        const savedExpiresAt: Date = userVoucherSaves[0].expires_at as Date;
        // With grace_ends_at forced to null on the saved row, fallback
        // applies: expires_at = ends_at = renewalStartAt + 30 days.
        const now: Date = new Date();
        const expectedEndsAtMin: Date = new Date(now);
        expectedEndsAtMin.setDate(expectedEndsAtMin.getDate() + 29);
        const expectedEndsAtMax: Date = new Date(now);
        expectedEndsAtMax.setDate(expectedEndsAtMax.getDate() + 31);
        expect(savedExpiresAt.getTime()).toBeGreaterThan(
          expectedEndsAtMin.getTime(),
        );
        expect(savedExpiresAt.getTime()).toBeLessThan(
          expectedEndsAtMax.getTime(),
        );
      } finally {
        dataSourceMock.transaction = originalTransaction;
      }
    });
  });

  // ─── submitMembershipPayment ────────────────────────────────────────────

  describe('submitMembershipPayment', () => {
    const makeSubmitDto = (
      overrides: Partial<SubmitMembershipPaymentDto> = {},
    ): SubmitMembershipPaymentDto => ({
      membership_plan_id: 1,
      membership_plan_billing_period_id: 1,
      payment_method_code: 'gcash',
      ...overrides,
    });

    it('should create membership and payment as AWAITING_CONFIRMATION for a new user', async () => {
      const causer = makeUser(15);
      const plan = makePlan();
      const period = makePlanBillingPeriod();
      const createdMembership = makeMembership({
        status: MembershipStatusEnum.PENDING,
        starts_at: null,
        ends_at: null,
      });
      const createdPayment = makePayment({
        payment_status: MembershipPaymentStatusEnum.AWAITING_CONFIRMATION,
      });

      mockMembershipPlanRepository.findOne.mockResolvedValue(plan);
      mockPlanBillingPeriodRepository.findOne.mockResolvedValue(period);
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(null);
      mockMembershipRepository.create.mockResolvedValue(createdMembership);
      mockMembershipPaymentRepository.create.mockResolvedValue(createdPayment);

      const result = await service.submitMembershipPayment(
        makeSubmitDto(),
        causer,
      );

      expect(mockMembershipPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_status: MembershipPaymentStatusEnum.AWAITING_CONFIRMATION,
          payment_method_code: 'gcash',
        }),
      );
      expect(result.ui_status).toBe('awaiting_confirmation');
      expect(result.membership_payment_id).toBe(25);
    });

    it('should preserve starts_at/ends_at if existing membership is still within its valid period', async () => {
      const causer = makeUser(15);
      const futureDate = new Date('2099-06-01T00:00:00.000Z');
      const existingMembership = makeMembership({
        status: MembershipStatusEnum.CANCELLED,
        starts_at: new Date('2026-01-01T00:00:00.000Z'),
        ends_at: futureDate,
      });
      const updatedMembership = {
        ...existingMembership,
        status: MembershipStatusEnum.PENDING,
      };
      const createdPayment = makePayment({
        payment_status: MembershipPaymentStatusEnum.AWAITING_CONFIRMATION,
      });

      mockMembershipPlanRepository.findOne.mockResolvedValue(makePlan());
      mockPlanBillingPeriodRepository.findOne.mockResolvedValue(
        makePlanBillingPeriod(),
      );
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(
        existingMembership,
      );
      mockMembershipRepository.update.mockResolvedValue(
        updatedMembership as Membership,
      );
      mockMembershipPaymentRepository.create.mockResolvedValue(createdPayment);

      await service.submitMembershipPayment(makeSubmitDto(), causer);

      expect(mockMembershipRepository.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          starts_at: existingMembership.starts_at,
          ends_at: futureDate,
          status: MembershipStatusEnum.PENDING,
        }),
      );
    });

    it('should clear starts_at/ends_at if existing membership period has already expired', async () => {
      const causer = makeUser(15);
      const pastDate = new Date('2020-01-01T00:00:00.000Z');
      const existingMembership = makeMembership({
        status: MembershipStatusEnum.EXPIRED,
        starts_at: new Date('2019-01-01T00:00:00.000Z'),
        ends_at: pastDate,
      });
      const updatedMembership = {
        ...existingMembership,
        status: MembershipStatusEnum.PENDING,
        starts_at: null,
        ends_at: null,
      };
      const createdPayment = makePayment({
        payment_status: MembershipPaymentStatusEnum.AWAITING_CONFIRMATION,
      });

      mockMembershipPlanRepository.findOne.mockResolvedValue(makePlan());
      mockPlanBillingPeriodRepository.findOne.mockResolvedValue(
        makePlanBillingPeriod(),
      );
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(
        existingMembership,
      );
      mockMembershipRepository.update.mockResolvedValue(
        updatedMembership as Membership,
      );
      mockMembershipPaymentRepository.create.mockResolvedValue(createdPayment);

      await service.submitMembershipPayment(makeSubmitDto(), causer);

      expect(mockMembershipRepository.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ starts_at: null, ends_at: null }),
      );
    });

    it('should upload proof file and store url/key on payment', async () => {
      const causer = makeUser(15);
      const proofFile = {
        originalname: 'receipt.jpg',
        buffer: Buffer.from('data'),
      } as Express.Multer.File;
      const uploadedResult = {
        url: 'https://s3.example.com/proofs/receipt.jpg',
        key: 'proofs/receipt.jpg',
      };

      mockMembershipPlanRepository.findOne.mockResolvedValue(makePlan());
      mockPlanBillingPeriodRepository.findOne.mockResolvedValue(
        makePlanBillingPeriod(),
      );
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(null);
      mockMembershipRepository.create.mockResolvedValue(
        makeMembership({ status: MembershipStatusEnum.PENDING }),
      );
      mockStorageService.put.mockResolvedValue(uploadedResult as any);
      mockMembershipPaymentRepository.create.mockResolvedValue(
        makePayment({
          payment_proof_url: uploadedResult.url,
          payment_proof_key: uploadedResult.key,
        }),
      );

      await service.submitMembershipPayment(makeSubmitDto(), causer, proofFile);

      expect(mockStorageService.put).toHaveBeenCalledWith(
        proofFile,
        expect.stringContaining('membership-payment-proofs/'),
      );
      expect(mockMembershipPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_proof_url: uploadedResult.url,
          payment_proof_key: uploadedResult.key,
        }),
      );
    });

    it('should throw BadRequestException if plan does not exist', async () => {
      mockMembershipPlanRepository.findOne.mockResolvedValue(null);

      await expect(
        service.submitMembershipPayment(makeSubmitDto(), makeUser(15)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ─── reactivateMembership ───────────────────────────────────────────────

  describe('reactivateMembership', () => {
    it('should set status to ACTIVE and clear cancelled_at', async () => {
      const causer = makeUser(15);
      const cancelledMembership = makeMembership({
        status: MembershipStatusEnum.CANCELLED,
        ends_at: new Date('2099-01-01T00:00:00.000Z'),
        cancelled_at: new Date('2026-03-01T00:00:00.000Z'),
      });
      const reactivated = {
        ...cancelledMembership,
        status: MembershipStatusEnum.ACTIVE,
        cancelled_at: null,
      };

      mockMembershipRepository.findLatestByUserId.mockResolvedValue(
        cancelledMembership,
      );
      mockMembershipRepository.update.mockResolvedValue(
        reactivated as Membership,
      );

      const result = await service.reactivateMembership(causer);

      expect(mockMembershipRepository.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          status: MembershipStatusEnum.ACTIVE,
          cancelled_at: null,
        }),
      );
      expect(result.status).toBe(MembershipStatusEnum.ACTIVE);
    });

    it('should throw NotFoundException if no membership exists', async () => {
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(null);

      await expect(
        service.reactivateMembership(makeUser(15)),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException if membership is not cancelled', async () => {
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(
        makeMembership({ status: MembershipStatusEnum.ACTIVE }),
      );

      await expect(
        service.reactivateMembership(makeUser(15)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if membership period has already expired', async () => {
      const expiredCancelled = makeMembership({
        status: MembershipStatusEnum.CANCELLED,
        ends_at: new Date('2020-01-01T00:00:00.000Z'),
      });
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(
        expiredCancelled,
      );

      await expect(
        service.reactivateMembership(makeUser(15)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if ends_at is null', async () => {
      const membership = makeMembership({
        status: MembershipStatusEnum.CANCELLED,
        ends_at: null,
      });
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(membership);

      await expect(
        service.reactivateMembership(makeUser(15)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ─── cancelMembership ───────────────────────────────────────────────────

  describe('cancelMembership', () => {
    it('should set status to CANCELLED and record cancelled_at', async () => {
      const causer = makeUser(15);
      const membership = makeMembership({
        status: MembershipStatusEnum.ACTIVE,
      });
      const cancelled = {
        ...membership,
        status: MembershipStatusEnum.CANCELLED,
        cancelled_at: new Date(),
      };

      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipRepository.update.mockResolvedValue(
        cancelled as Membership,
      );

      const result = await service.cancelMembership(
        10,
        { reason: 'test' } as any,
        causer,
      );

      expect(mockMembershipRepository.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          status: MembershipStatusEnum.CANCELLED,
          cancelled_at: expect.any(Date),
        }),
      );
      expect(result.status).toBe(MembershipStatusEnum.CANCELLED);
    });

    it('should throw if membership is already cancelled', async () => {
      mockMembershipRepository.findById.mockResolvedValue(
        makeMembership({ status: MembershipStatusEnum.CANCELLED }),
      );

      await expect(
        service.cancelMembership(10, {} as any, makeUser(15)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException if membership does not exist', async () => {
      mockMembershipRepository.findById.mockResolvedValue(null);

      await expect(
        service.cancelMembership(999, {} as any, makeUser(15)),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cancel during ACTIVE preserves ends_at and grace_ends_at', async () => {
      const causer = makeUser(15);
      const endsAt = new Date('2099-06-01T00:00:00.000Z');
      const graceEndsAt = new Date('2099-06-08T00:00:00.000Z');
      const membership = makeMembership({
        status: MembershipStatusEnum.ACTIVE,
        ends_at: endsAt,
        grace_ends_at: graceEndsAt,
      });
      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipRepository.update.mockImplementation(
        async (_id, patch) => ({ ...membership, ...patch }) as Membership,
      );

      await service.cancelMembership(10, { reason: 'test' } as any, causer);

      const updateCall = mockMembershipRepository.update.mock.calls[0][1];
      expect(updateCall.status).toBe(MembershipStatusEnum.CANCELLED);
      expect(updateCall.cancelled_at).toBeInstanceOf(Date);
      // Dates must NOT be clamped for active cancellation
      expect(updateCall).not.toHaveProperty('ends_at');
      expect(updateCall).not.toHaveProperty('grace_ends_at');
    });

    it('cancel during GRACE_PERIOD clamps ends_at and grace_ends_at to now', async () => {
      const causer = makeUser(15);
      const endsAt = new Date('2026-04-10T00:00:00.000Z'); // already passed
      const graceEndsAt = new Date('2026-04-17T00:00:00.000Z'); // future at time of cancel
      const membership = makeMembership({
        status: MembershipStatusEnum.GRACE_PERIOD,
        ends_at: endsAt,
        grace_ends_at: graceEndsAt,
      });
      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipRepository.update.mockImplementation(
        async (_id, patch) => ({ ...membership, ...patch }) as Membership,
      );

      const before = Date.now();
      await service.cancelMembership(10, { reason: 'test' } as any, causer);
      const after = Date.now();

      const updateCall = mockMembershipRepository.update.mock.calls[0][1] as {
        status: MembershipStatusEnum;
        ends_at?: Date;
        grace_ends_at?: Date;
      };
      expect(updateCall.status).toBe(MembershipStatusEnum.CANCELLED);
      // Both ends_at and grace_ends_at must be clamped to "now"
      expect(updateCall.ends_at).toBeInstanceOf(Date);
      expect(updateCall.grace_ends_at).toBeInstanceOf(Date);
      expect(updateCall.ends_at!.getTime()).toBeGreaterThanOrEqual(before);
      expect(updateCall.ends_at!.getTime()).toBeLessThanOrEqual(after);
      expect(updateCall.grace_ends_at!.getTime()).toBeGreaterThanOrEqual(
        before,
      );
      expect(updateCall.grace_ends_at!.getTime()).toBeLessThanOrEqual(after);
    });
  });

  // ─── calculateGraceEndDate (reads parameter table, adds days) ──────────

  describe('calculateGraceEndDate', () => {
    const calc = (endsAt: Date): Promise<Date> =>
      (service as any).calculateGraceEndDate(endsAt);

    it('returns ends_at + grace_period from parameter table', async () => {
      (mockParametersService.findByCode as jest.Mock).mockResolvedValue({
        id: 3,
        code: 'grace_period',
        numeric_value: 7,
      });
      const endsAt = new Date('2026-05-20T00:00:00.000Z');
      const result = await calc(endsAt);
      // 7 days later
      expect(result.toISOString()).toBe('2026-05-27T00:00:00.000Z');
    });

    it('supports non-default grace periods (e.g. 14 days)', async () => {
      (mockParametersService.findByCode as jest.Mock).mockResolvedValue({
        id: 3,
        code: 'grace_period',
        numeric_value: 14,
      });
      const endsAt = new Date('2026-05-20T00:00:00.000Z');
      const result = await calc(endsAt);
      expect(result.toISOString()).toBe('2026-06-03T00:00:00.000Z');
    });

    it('falls back to 7 days when parameter is missing', async () => {
      (mockParametersService.findByCode as jest.Mock).mockResolvedValue(null);
      const endsAt = new Date('2026-05-20T00:00:00.000Z');
      const result = await calc(endsAt);
      expect(result.toISOString()).toBe('2026-05-27T00:00:00.000Z');
    });

    it('grace_ends_at is always AFTER ends_at (post-expiry grace)', async () => {
      (mockParametersService.findByCode as jest.Mock).mockResolvedValue({
        id: 3,
        code: 'grace_period',
        numeric_value: 7,
      });
      const endsAt = new Date('2026-05-20T00:00:00.000Z');
      const result = await calc(endsAt);
      expect(result.getTime()).toBeGreaterThan(endsAt.getTime());
    });
  });

  // ─── submitMembershipPayment status preservation for GRACE_PERIOD ─────

  describe('submitMembershipPayment (status preservation)', () => {
    const makeDto = (): SubmitMembershipPaymentDto =>
      ({
        membership_plan_id: 1,
        membership_plan_billing_period_id: 1,
        payment_method_code: 'gcash',
      }) as SubmitMembershipPaymentDto;

    const setup = (existing: Membership) => {
      mockMembershipPlanRepository.findOne.mockResolvedValue(makePlan());
      mockPlanBillingPeriodRepository.findOne.mockResolvedValue(
        makePlanBillingPeriod(),
      );
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(existing);
      mockMembershipRepository.update.mockImplementation(
        async (_id, patch) => ({ ...existing, ...patch }) as Membership,
      );
      mockMembershipPaymentRepository.create.mockResolvedValue(
        makePayment({
          payment_status: MembershipPaymentStatusEnum.AWAITING_CONFIRMATION,
        }),
      );
    };

    it('GRACE_PERIOD members retain GRACE_PERIOD status when submitting renewal (no PENDING downgrade)', async () => {
      const existing = makeMembership({
        status: MembershipStatusEnum.GRACE_PERIOD,
        ends_at: new Date(Date.now() - 2 * 86_400_000),
        grace_ends_at: new Date(Date.now() + 5 * 86_400_000),
      });
      setup(existing);

      await service.submitMembershipPayment(makeDto(), makeUser(15));

      const updateCall = mockMembershipRepository.update.mock.calls[0][1] as {
        status?: MembershipStatusEnum;
      };
      // Grace members must keep GRACE_PERIOD so access isn't revoked
      // while admin reviews the new payment.
      expect(updateCall.status).toBe(MembershipStatusEnum.GRACE_PERIOD);
    });

    it('ACTIVE members retain ACTIVE status when submitting renewal', async () => {
      const existing = makeMembership({
        status: MembershipStatusEnum.ACTIVE,
        ends_at: new Date(Date.now() + 30 * 86_400_000),
      });
      setup(existing);

      await service.submitMembershipPayment(makeDto(), makeUser(15));

      const updateCall = mockMembershipRepository.update.mock.calls[0][1] as {
        status?: MembershipStatusEnum;
      };
      expect(updateCall.status).toBe(MembershipStatusEnum.ACTIVE);
    });

    it('CANCELLED lapsed members go to PENDING on renewal submission', async () => {
      const existing = makeMembership({
        status: MembershipStatusEnum.CANCELLED,
        ends_at: new Date(Date.now() - 100 * 86_400_000),
      });
      setup(existing);

      await service.submitMembershipPayment(makeDto(), makeUser(15));

      const updateCall = mockMembershipRepository.update.mock.calls[0][1] as {
        status?: MembershipStatusEnum;
      };
      expect(updateCall.status).toBe(MembershipStatusEnum.PENDING);
    });
  });

  // ─── extendMembership (status flip on GRACE_PERIOD extension) ──────────

  describe('extendMembership', () => {
    beforeEach(() => {
      (mockParametersService.findByCode as jest.Mock).mockResolvedValue({
        id: 3,
        code: 'grace_period',
        numeric_value: 7,
      });
    });

    it('flips GRACE_PERIOD to ACTIVE when the extension pushes ends_at into the future', async () => {
      const causer = makeUser(15);
      const pastEndsAt = new Date(Date.now() - 3 * 86_400_000); // 3 days ago
      const pastGraceEndsAt = new Date(Date.now() + 4 * 86_400_000); // still in grace
      const membership = makeMembership({
        status: MembershipStatusEnum.GRACE_PERIOD,
        ends_at: pastEndsAt,
        grace_ends_at: pastGraceEndsAt,
      });
      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipRepository.update.mockImplementation(
        async (_id, patch) => ({ ...membership, ...patch }) as Membership,
      );

      // Extend by 30 days — new ends_at is 27 days in the future
      await service.extendMembership(10, { extension_days: 30 }, causer);

      const updateCall = mockMembershipRepository.update.mock.calls[0][1] as {
        status?: MembershipStatusEnum;
        ends_at?: Date;
      };
      expect(updateCall.status).toBe(MembershipStatusEnum.ACTIVE);
      expect(updateCall.ends_at!.getTime()).toBeGreaterThan(Date.now());
    });

    it('keeps status unchanged when ACTIVE membership is extended', async () => {
      const causer = makeUser(15);
      const futureEndsAt = new Date(Date.now() + 10 * 86_400_000);
      const membership = makeMembership({
        status: MembershipStatusEnum.ACTIVE,
        ends_at: futureEndsAt,
      });
      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipRepository.update.mockImplementation(
        async (_id, patch) => ({ ...membership, ...patch }) as Membership,
      );

      await service.extendMembership(10, { extension_days: 30 }, causer);

      const updateCall = mockMembershipRepository.update.mock.calls[0][1] as {
        status?: MembershipStatusEnum;
      };
      // ACTIVE extensions must not emit a redundant status change
      expect(updateCall.status).toBeUndefined();
    });

    it('does NOT flip to ACTIVE if extension is too small to push ends_at past now', async () => {
      const causer = makeUser(15);
      const pastEndsAt = new Date(Date.now() - 10 * 86_400_000); // 10 days ago
      const pastGraceEndsAt = new Date(Date.now() - 3 * 86_400_000); // grace also past
      const membership = makeMembership({
        status: MembershipStatusEnum.GRACE_PERIOD,
        ends_at: pastEndsAt,
        grace_ends_at: pastGraceEndsAt,
      });
      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipRepository.update.mockImplementation(
        async (_id, patch) => ({ ...membership, ...patch }) as Membership,
      );

      // Extend by only 5 days — still in the past
      await service.extendMembership(10, { extension_days: 5 }, causer);

      const updateCall = mockMembershipRepository.update.mock.calls[0][1] as {
        status?: MembershipStatusEnum;
      };
      // No status flip: the extended ends_at is still behind now
      expect(updateCall.status).toBeUndefined();
    });
  });

  // ─── resolveRenewalAnchor (anti-abuse helper) ───────────────────────────

  describe('resolveRenewalAnchor', () => {
    const anchor = (m: Membership, now: Date): Date =>
      (service as any).resolveRenewalAnchor(m, now);

    it('returns now when ends_at is null (fresh activation)', () => {
      const now = new Date('2026-04-24T00:00:00.000Z');
      const m = makeMembership({
        ends_at: null,
        status: MembershipStatusEnum.PENDING,
      });
      expect(anchor(m, now).getTime()).toBe(now.getTime());
    });

    it('returns ends_at for ACTIVE memberships still in period (stacks renewal)', () => {
      const now = new Date('2026-04-24T00:00:00.000Z');
      const endsAt = new Date('2026-05-24T00:00:00.000Z');
      const m = makeMembership({
        status: MembershipStatusEnum.ACTIVE,
        ends_at: endsAt,
      });
      expect(anchor(m, now).getTime()).toBe(endsAt.getTime());
    });

    it('returns ends_at for GRACE_PERIOD members still within grace (anti-abuse anchor)', () => {
      const now = new Date('2026-04-24T00:00:00.000Z');
      const endsAt = new Date('2026-04-20T00:00:00.000Z'); // 4 days ago
      const graceEndsAt = new Date('2026-04-27T00:00:00.000Z'); // 3 days ahead
      const m = makeMembership({
        status: MembershipStatusEnum.GRACE_PERIOD,
        ends_at: endsAt,
        grace_ends_at: graceEndsAt,
      });
      // Renewal must anchor to the original ends_at, NOT to now.
      // Otherwise the user gains free grace days.
      expect(anchor(m, now).getTime()).toBe(endsAt.getTime());
    });

    it('returns now when grace has fully lapsed (user is truly expired)', () => {
      const now = new Date('2026-04-24T00:00:00.000Z');
      const endsAt = new Date('2026-04-10T00:00:00.000Z'); // 14 days ago
      const graceEndsAt = new Date('2026-04-17T00:00:00.000Z'); // 7 days ago
      const m = makeMembership({
        status: MembershipStatusEnum.GRACE_PERIOD, // status may lag cron
        ends_at: endsAt,
        grace_ends_at: graceEndsAt,
      });
      expect(anchor(m, now).getTime()).toBe(now.getTime());
    });

    it('returns now when EXPIRED (fresh start after full lapse)', () => {
      const now = new Date('2026-04-24T00:00:00.000Z');
      const endsAt = new Date('2026-03-01T00:00:00.000Z');
      const m = makeMembership({
        status: MembershipStatusEnum.EXPIRED,
        ends_at: endsAt,
      });
      expect(anchor(m, now).getTime()).toBe(now.getTime());
    });
  });

  // ─── updateAutoRenewal ──────────────────────────────────────────────────

  describe('updateAutoRenewal', () => {
    it('should update is_auto_renew_enabled to true', async () => {
      const membership = makeMembership({ is_auto_renew_enabled: false });
      const updated = { ...membership, is_auto_renew_enabled: true };

      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipRepository.update.mockResolvedValue(updated as Membership);

      const result = await service.updateAutoRenewal(
        10,
        { is_auto_renew_enabled: true },
        makeUser(15),
      );

      expect(mockMembershipRepository.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ is_auto_renew_enabled: true }),
      );
      expect(result.is_auto_renew_enabled).toBe(true);
    });

    it('should update is_auto_renew_enabled to false', async () => {
      const membership = makeMembership({ is_auto_renew_enabled: true });
      const updated = { ...membership, is_auto_renew_enabled: false };

      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipRepository.update.mockResolvedValue(updated as Membership);

      const result = await service.updateAutoRenewal(
        10,
        { is_auto_renew_enabled: false },
        makeUser(15),
      );

      expect(result.is_auto_renew_enabled).toBe(false);
    });

    it('should throw NotFoundException if membership does not exist', async () => {
      mockMembershipRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateAutoRenewal(
          999,
          { is_auto_renew_enabled: true },
          makeUser(15),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ─── adminConfirmMembershipPayment ──────────────────────────────────────

  describe('adminConfirmMembershipPayment', () => {
    it('should mark payment as PAID and activate membership', async () => {
      const causer = makeUser(1);
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PENDING,
        billing_duration_months: 1,
      });
      const membership = makeMembership({
        status: MembershipStatusEnum.PENDING,
        starts_at: null,
        ends_at: null,
      });
      const updatedPayment = {
        ...payment,
        payment_status: MembershipPaymentStatusEnum.PAID,
      };
      const updatedMembership = {
        ...membership,
        status: MembershipStatusEnum.ACTIVE,
      };

      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipPaymentRepository.findByMembershipId.mockResolvedValue([
        payment,
      ]);
      mockMembershipPaymentRepository.update.mockResolvedValue(
        updatedPayment as MembershipPayment,
      );
      mockMembershipRepository.update.mockResolvedValue(
        updatedMembership as Membership,
      );
      mockMembershipVoucherConfigurationRepository.findAll.mockResolvedValue(
        emptyGrantResult(),
      );

      const result = await service.adminConfirmMembershipPayment(25, causer);

      expect(mockMembershipPaymentRepository.update).toHaveBeenCalledWith(
        25,
        expect.objectContaining({
          payment_status: MembershipPaymentStatusEnum.PAID,
          paid_at: expect.any(Date),
        }),
      );
      expect(mockMembershipRepository.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ status: MembershipStatusEnum.ACTIVE }),
      );
      expect(result.membership_payment_id).toBe(25);
      expect(result.message).toContain('confirmed');
    });

    it('should also confirm AWAITING_CONFIRMATION payments', async () => {
      const causer = makeUser(1);
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.AWAITING_CONFIRMATION,
        billing_duration_months: 1,
      });
      const membership = makeMembership({
        status: MembershipStatusEnum.PENDING,
        starts_at: null,
        ends_at: null,
      });

      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(membership);
      mockMembershipPaymentRepository.findByMembershipId.mockResolvedValue([
        payment,
      ]);
      mockMembershipPaymentRepository.update.mockResolvedValue({
        ...payment,
        payment_status: MembershipPaymentStatusEnum.PAID,
      } as MembershipPayment);
      mockMembershipRepository.update.mockResolvedValue({
        ...membership,
        status: MembershipStatusEnum.ACTIVE,
      } as Membership);
      mockMembershipVoucherConfigurationRepository.findAll.mockResolvedValue(
        emptyGrantResult(),
      );

      const result = await service.adminConfirmMembershipPayment(25, causer);
      expect(result.membership_payment_id).toBe(25);
    });

    it('should throw if payment is already PAID', async () => {
      mockMembershipPaymentRepository.findById.mockResolvedValue(
        makePayment({ payment_status: MembershipPaymentStatusEnum.PAID }),
      );

      await expect(
        service.adminConfirmMembershipPayment(25, makeUser(1)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if payment is in FAILED state', async () => {
      mockMembershipPaymentRepository.findById.mockResolvedValue(
        makePayment({ payment_status: MembershipPaymentStatusEnum.FAILED }),
      );

      await expect(
        service.adminConfirmMembershipPayment(25, makeUser(1)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should set ends_at relative to current membership ends_at for renewals (multiple payments)', async () => {
      const causer = makeUser(1);
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PENDING,
        billing_duration_months: 1,
      });
      const membership = makeMembership({
        status: MembershipStatusEnum.ACTIVE,
      });
      const secondPayment = makePayment({ id: 26 });

      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(membership);
      // Two existing payments = isRenewal = true → renewalStartAt = now
      mockMembershipPaymentRepository.findByMembershipId.mockResolvedValue([
        payment,
        secondPayment,
      ]);
      mockMembershipPaymentRepository.update.mockResolvedValue({
        ...payment,
        payment_status: MembershipPaymentStatusEnum.PAID,
      } as MembershipPayment);
      mockMembershipRepository.update.mockResolvedValue(membership);
      mockMembershipVoucherConfigurationRepository.findAll.mockResolvedValue(
        emptyGrantResult(),
      );

      await service.adminConfirmMembershipPayment(25, causer);

      const updateCall = mockMembershipRepository.update.mock
        .calls[0][1] as any;
      // For renewal, starts_at is preserved from the existing membership's starts_at
      expect(updateCall.starts_at).toEqual(membership.starts_at);
    });
  });

  // ─── adminVoidMembershipPayment ─────────────────────────────────────────

  describe('adminVoidMembershipPayment', () => {
    it('should mark payment as CANCELLED', async () => {
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PENDING,
      });
      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipPaymentRepository.update.mockResolvedValue({
        ...payment,
        payment_status: MembershipPaymentStatusEnum.CANCELLED,
      } as MembershipPayment);

      const result = await service.adminVoidMembershipPayment(25, makeUser(1));

      expect(mockMembershipPaymentRepository.update).toHaveBeenCalledWith(
        25,
        expect.objectContaining({
          payment_status: MembershipPaymentStatusEnum.CANCELLED,
        }),
      );
      expect(result.membership_payment_id).toBe(25);
      expect(result.message).toContain('voided');
    });

    it('should also void AWAITING_CONFIRMATION payments', async () => {
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.AWAITING_CONFIRMATION,
      });
      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipPaymentRepository.update.mockResolvedValue({
        ...payment,
        payment_status: MembershipPaymentStatusEnum.CANCELLED,
      } as MembershipPayment);

      const result = await service.adminVoidMembershipPayment(25, makeUser(1));
      expect(result.membership_payment_id).toBe(25);
    });

    it('should throw if payment is already voided', async () => {
      mockMembershipPaymentRepository.findById.mockResolvedValue(
        makePayment({ payment_status: MembershipPaymentStatusEnum.CANCELLED }),
      );

      await expect(
        service.adminVoidMembershipPayment(25, makeUser(1)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if payment is already PAID (use refund instead)', async () => {
      mockMembershipPaymentRepository.findById.mockResolvedValue(
        makePayment({ payment_status: MembershipPaymentStatusEnum.PAID }),
      );

      await expect(
        service.adminVoidMembershipPayment(25, makeUser(1)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ─── findMyMembership ───────────────────────────────────────────────────

  describe('findMyMembership', () => {
    it('should return membership and recent payments', async () => {
      const membership = makeMembership();
      const payments = [makePayment()];

      mockMembershipRepository.findLatestByUserId.mockResolvedValue(membership);
      mockMembershipPaymentRepository.findAll.mockResolvedValue({
        data: payments,
        totalCount: 1,
        skip: 0,
        take: 5,
      });
      mockMembershipVoucherGrantRepository.findAll.mockResolvedValue(
        emptyGrantResult(),
      );

      const result = await service.findMyMembership(makeUser(15));

      expect(result.membership).toEqual(membership);
      expect(result.membership_payments).toEqual(payments);
    });

    it('should include voucher grants when membership has valid active dates', async () => {
      const membership = makeMembership({
        starts_at: new Date('2026-01-01T00:00:00.000Z'),
        ends_at: new Date('2099-01-01T00:00:00.000Z'),
      });
      const grant = {
        id: 1,
        voucher_code: 'VOUCHER10',
        membership_id: 10,
        voucher_scope: 'categories',
      };

      mockMembershipRepository.findLatestByUserId.mockResolvedValue(membership);
      mockMembershipPaymentRepository.findAll.mockResolvedValue({
        data: [],
        totalCount: 0,
        skip: 0,
        take: 5,
      });
      mockMembershipVoucherGrantRepository.findAll.mockResolvedValue({
        data: [grant as any],
        totalCount: 1,
        skip: 0,
        take: 500,
      });
      // buildGroupedActivationVoucherGrants calls voucherRepository.find to enrich by scope
      mockVoucherRepository.find.mockResolvedValue([]);

      await service.findMyMembership(makeUser(15));

      expect(mockMembershipVoucherGrantRepository.findAll).toHaveBeenCalled();
    });

    it('should NOT return voucher grants when ends_at is in the past', async () => {
      const expiredMembership = makeMembership({
        starts_at: new Date('2020-01-01T00:00:00.000Z'),
        ends_at: new Date('2020-06-01T00:00:00.000Z'),
        status: MembershipStatusEnum.EXPIRED,
      });

      mockMembershipRepository.findLatestByUserId.mockResolvedValue(
        expiredMembership,
      );
      mockMembershipPaymentRepository.findAll.mockResolvedValue({
        data: [],
        totalCount: 0,
        skip: 0,
        take: 5,
      });

      await service.findMyMembership(makeUser(15));

      expect(
        mockMembershipVoucherGrantRepository.findAll,
      ).not.toHaveBeenCalled();
    });

    it('should NOT return voucher grants when starts_at is null (never activated)', async () => {
      const pendingMembership = makeMembership({
        starts_at: null,
        ends_at: null,
        status: MembershipStatusEnum.PENDING,
      });

      mockMembershipRepository.findLatestByUserId.mockResolvedValue(
        pendingMembership,
      );
      mockMembershipPaymentRepository.findAll.mockResolvedValue({
        data: [],
        totalCount: 0,
        skip: 0,
        take: 5,
      });

      await service.findMyMembership(makeUser(15));

      expect(
        mockMembershipVoucherGrantRepository.findAll,
      ).not.toHaveBeenCalled();
    });

    it('should return null membership and empty data when user has no membership', async () => {
      mockMembershipRepository.findLatestByUserId.mockResolvedValue(null);
      mockMembershipPaymentRepository.findAll.mockResolvedValue({
        data: [],
        totalCount: 0,
        skip: 0,
        take: 5,
      });

      const result = await service.findMyMembership(makeUser(15));

      expect(result.membership).toBeNull();
      expect(result.membership_payments).toEqual([]);
      expect(
        mockMembershipVoucherGrantRepository.findAll,
      ).not.toHaveBeenCalled();
    });
  });

  // ─── getMembershipPaymentPage ────────────────────────────────────────────

  describe('getMembershipPaymentPage', () => {
    it('should return payment page details for the correct user', async () => {
      const payment = makePayment({
        payment_method_code: 'maya',
        expires_at: null,
      });

      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(makeMembership());
      mockParametersService.findByCode.mockResolvedValue(null);

      const result = await service.getMembershipPaymentPage(25, makeUser(15));

      expect(result.membership_payment_id).toBe(25);
      expect(result.amount).toBe(1499);
      expect(result.plan_name).toBe('Starter');
      expect(result.billing_duration_months).toBe(1);
    });

    it('should throw NotFoundException if payment belongs to a different user', async () => {
      mockMembershipPaymentRepository.findById.mockResolvedValue(
        makePayment({ user_id: 99 }),
      );

      await expect(
        service.getMembershipPaymentPage(25, makeUser(15)),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should resolve ui_status as pending_payment for a fresh PENDING payment', async () => {
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PENDING,
        payment_proof_url: null,
      });

      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(
        makeMembership({ status: MembershipStatusEnum.PENDING }),
      );
      mockParametersService.findByCode.mockResolvedValue(null);

      const result = await service.getMembershipPaymentPage(25, makeUser(15));
      expect(result.ui_status).toBe('pending_payment');
    });

    it('should resolve ui_status as awaiting_confirmation when proof is uploaded', async () => {
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.AWAITING_CONFIRMATION,
        payment_proof_url: 'https://s3.example.com/proof.jpg',
      });

      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(
        makeMembership({ status: MembershipStatusEnum.PENDING }),
      );
      mockParametersService.findByCode.mockResolvedValue(null);

      const result = await service.getMembershipPaymentPage(25, makeUser(15));
      expect(result.ui_status).toBe('awaiting_confirmation');
    });

    it('should resolve ui_status as confirmed for a PAID payment', async () => {
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PAID,
      });

      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(
        makeMembership({ status: MembershipStatusEnum.ACTIVE }),
      );
      mockParametersService.findByCode.mockResolvedValue(null);

      const result = await service.getMembershipPaymentPage(25, makeUser(15));
      expect(result.ui_status).toBe('confirmed');
    });

    it('should resolve ui_status as cancelled when membership is CANCELLED', async () => {
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PENDING,
      });

      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(
        makeMembership({ status: MembershipStatusEnum.CANCELLED }),
      );
      mockParametersService.findByCode.mockResolvedValue(null);

      const result = await service.getMembershipPaymentPage(25, makeUser(15));
      expect(result.ui_status).toBe('cancelled');
    });
  });

  // ─── getMembershipPaymentStatus ─────────────────────────────────────────

  describe('getMembershipPaymentStatus', () => {
    it('should return current ui_status for a payment', async () => {
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.AWAITING_CONFIRMATION,
      });

      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockMembershipRepository.findById.mockResolvedValue(
        makeMembership({ status: MembershipStatusEnum.PENDING }),
      );

      const result = await service.getMembershipPaymentStatus(25, makeUser(15));

      expect(result.membership_payment_id).toBe(25);
      expect(result.ui_status).toBe('awaiting_confirmation');
    });

    it('should throw NotFoundException if payment belongs to a different user', async () => {
      mockMembershipPaymentRepository.findById.mockResolvedValue(
        makePayment({ user_id: 99 }),
      );

      await expect(
        service.getMembershipPaymentStatus(25, makeUser(15)),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ─── notifyMembershipPayment ─────────────────────────────────────────────

  describe('notifyMembershipPayment', () => {
    it('should update proof url and reference on the payment', async () => {
      const causer = makeUser(15);
      const payment = makePayment({
        payment_status: MembershipPaymentStatusEnum.PENDING,
      });
      const updatedPayment = {
        ...payment,
        payment_proof_url: 'https://s3/proof.jpg',
        payment_status: MembershipPaymentStatusEnum.AWAITING_CONFIRMATION,
      };
      const proofFile = {
        originalname: 'proof.jpg',
        buffer: Buffer.from(''),
      } as Express.Multer.File;
      const uploadResult = {
        url: 'https://s3/proof.jpg',
        key: 'key/proof.jpg',
      };

      mockMembershipPaymentRepository.findById.mockResolvedValue(payment);
      mockStorageService.put.mockResolvedValue(uploadResult as any);
      mockMembershipPaymentRepository.update.mockResolvedValue(
        updatedPayment as MembershipPayment,
      );
      mockMembershipRepository.findById.mockResolvedValue(
        makeMembership({ status: MembershipStatusEnum.PENDING }),
      );

      const result = await service.notifyMembershipPayment(
        25,
        causer,
        {},
        proofFile,
      );

      expect(mockStorageService.put).toHaveBeenCalled();
      expect(mockMembershipPaymentRepository.update).toHaveBeenCalledWith(
        25,
        expect.objectContaining({ payment_proof_url: uploadResult.url }),
      );
      expect(result.payment_proof_url).toBe('https://s3/proof.jpg');
    });

    it('should throw NotFoundException if payment belongs to a different user', async () => {
      mockMembershipPaymentRepository.findById.mockResolvedValue(
        makePayment({ user_id: 99 }),
      );

      await expect(
        service.notifyMembershipPayment(25, makeUser(15), {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException if payment is not PENDING', async () => {
      mockMembershipPaymentRepository.findById.mockResolvedValue(
        makePayment({ payment_status: MembershipPaymentStatusEnum.PAID }),
      );

      await expect(
        service.notifyMembershipPayment(25, makeUser(15), {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
