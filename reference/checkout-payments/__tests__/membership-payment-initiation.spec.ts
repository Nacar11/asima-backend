/**
 * Membership Payment Initiation Tests
 *
 * Covers initiatePaymentForMembership via:
 *   - Maya direct checkout (checkout URL returned)
 *   - Manual QR (GCash / Maya QR / UnionBank QR) — QR URL returned, expires_at set
 *   - Gateway failure → payment marked FAILED, error re-thrown
 *   - Guard: payment not found / wrong user / already paid
 *
 * Test IDs:
 *   MPI-001 … MPI-003  — Maya direct
 *   MPI-010 … MPI-014  — QR manual
 *   MPI-020 … MPI-023  — Guards & error paths
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CheckoutPaymentsService } from '@/checkout-payments/checkout-payments.service';
import { MembershipPaymentStatusEnum } from '@/memberships/enums/membership-payment-status.enum';
import { MayaGateway } from '@/checkout-payments/gateways/maya.gateway';
import { QrManualGateway } from '@/checkout-payments/gateways/qr-manual.gateway';
import { PaymentGatewayResolver } from '@/checkout-payments/gateways/payment-gateway.resolver';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAYA_CHECKOUT_URL =
  'https://payments-web-sandbox.maya.ph/v2/checkout?id=test-id';
const GCASH_QR_URL = 'https://cdn.example.com/gcash-qr.png';
const MAYA_QR_URL = 'https://cdn.example.com/maya-qr.png';
const UNIONBANK_QR_URL = 'https://cdn.example.com/unionbank-qr.png';

// ─── Mock Factories ──────────────────────────────────────────────────────────

const makeMembershipPayment = (overrides: Record<string, any> = {}) => ({
  id: 50,
  membership_id: 10,
  user_id: 77,
  membership_plan_id: 1,
  membership_plan_code: 'starter',
  membership_plan_name: 'Starter',
  billing_period_code: 'monthly',
  billing_duration_months: 1,
  amount: 1499,
  currency: 'PHP',
  payment_status: MembershipPaymentStatusEnum.PENDING,
  provider: null,
  provider_reference: null,
  payment_method_code: null,
  expires_at: null,
  ...overrides,
});

const makeUser = (id = 77) => ({
  id,
  email: 'member@example.com',
  first_name: 'Juan',
  last_name: 'Dela Cruz',
});

const makeMayaGateway = (
  checkoutUrl = MAYA_CHECKOUT_URL,
): jest.Mocked<MayaGateway> =>
  ({
    gatewayName: 'maya',
    initiate: jest.fn().mockResolvedValue({
      gateway: 'maya',
      checkout_url: checkoutUrl,
      qr_image_url: null,
      reference_number: 'MAYA-REF-001',
      requires_manual_confirmation: false,
    }),
  }) as any;

const makeQrGateway = (qrUrl: string): jest.Mocked<QrManualGateway> =>
  ({
    gatewayName: 'qr_manual',
    initiate: jest.fn().mockResolvedValue({
      gateway: 'qr_manual',
      checkout_url: null,
      qr_image_url: qrUrl,
      reference_number: null,
      requires_manual_confirmation: true,
    }),
  }) as any;

const makeResolver = (overrides: {
  method: string;
  gateway: any;
}): jest.Mocked<PaymentGatewayResolver> =>
  ({
    resolve: jest.fn().mockImplementation((code: string) => {
      if (code === overrides.method) return Promise.resolve(overrides.gateway);
      throw new NotFoundException(`No gateway for ${code}`);
    }),
  }) as any;

/**
 * Build CheckoutPaymentsService wired to a specific payment and resolver.
 * All other dependencies are stubbed with empty objects.
 */
const buildService = (
  membershipPaymentStub: Record<string, any> | null,
  resolver: jest.Mocked<PaymentGatewayResolver>,
) => {
  const membershipPaymentRepository = {
    findById: jest.fn().mockResolvedValue(membershipPaymentStub),
    update: jest.fn().mockResolvedValue(membershipPaymentStub),
  };

  const checkoutPaymentRepository = {
    findByTransactionNumber: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
    transitionToAwaitingPaymentIfPending: jest.fn(),
    findBySalesOrderId: jest.fn().mockResolvedValue([]),
  };

  const service = new CheckoutPaymentsService(
    checkoutPaymentRepository as any,
    membershipPaymentRepository as any,
    {} as any, // checkoutOrdersService
    {} as any, // payMongoService
    {} as any, // notificationsService
    {} as any, // dragonPayV2Service
    {} as any, // mayaCheckoutService
    {} as any, // mailService
    {} as any, // salesOrderRepository
    {} as any, // bookingRepository
    {} as any, // returnRequestRepository
    {} as any, // returnRequestItemRepository
    {} as any, // paymentOrderRepository
    {} as any, // shoppingCartRepository
    {} as any, // shoppingCartItemRepository
    {} as any, // mayaWebhookEventRepository
    {} as any, // salesOrdersService
    {} as any, // membershipsService
    {} as any, // orderTrackingService
    {} as any, // walletWithdrawalRepository
    {} as any, // walletTransactionService
    {} as any, // walletRepository
    {} as any, // sellerRepository
    {} as any, // inventoryStocksService
    resolver,
    {} as any, // dataSource
    {} as any, // subscriptionPaymentRepository
    {} as any, // subscriptionPaymentsService
  );

  return { service, membershipPaymentRepository, checkoutPaymentRepository };
};

// ════════════════════════════════════════════════════════════════════════════
// Maya Direct Checkout
// ════════════════════════════════════════════════════════════════════════════

describe('initiatePaymentForMembership — Maya direct', () => {
  it('should return Maya checkout_url and no qr_image_url for Maya direct (MPI-001)', async () => {
    const payment = makeMembershipPayment({ payment_method_code: 'maya' });
    const resolver = makeResolver({
      method: 'maya',
      gateway: makeMayaGateway(),
    });
    const { service } = buildService(payment, resolver);

    const result = await service.initiatePaymentForMembership(
      { membership_payment_id: 50, payment_method_code: 'maya' },
      makeUser() as any,
    );

    expect(result.checkout_url).toBe(MAYA_CHECKOUT_URL);
    expect(result.qr_image_url).toBeNull();
    expect(result.requires_manual_confirmation).toBe(false);
    expect(result.membership_payment_id).toBe(50);
  });

  it('should record provider and gateway_reference_number on the membership payment (MPI-002)', async () => {
    const payment = makeMembershipPayment({ payment_method_code: 'maya' });
    const resolver = makeResolver({
      method: 'maya',
      gateway: makeMayaGateway(),
    });
    const { service, membershipPaymentRepository } = buildService(
      payment,
      resolver,
    );

    await service.initiatePaymentForMembership(
      { membership_payment_id: 50, payment_method_code: 'maya' },
      makeUser() as any,
    );

    expect(membershipPaymentRepository.update).toHaveBeenCalledWith(
      50,
      expect.objectContaining({
        provider: 'maya',
        gateway_reference_number: 'MAYA-REF-001',
        payment_method_code: 'maya',
      }),
    );
  });

  it('should NOT set expires_at for Maya (not a QR method) (MPI-003)', async () => {
    const payment = makeMembershipPayment({ payment_method_code: 'maya' });
    const resolver = makeResolver({
      method: 'maya',
      gateway: makeMayaGateway(),
    });
    const { service, membershipPaymentRepository } = buildService(
      payment,
      resolver,
    );

    await service.initiatePaymentForMembership(
      { membership_payment_id: 50, payment_method_code: 'maya' },
      makeUser() as any,
    );

    const updateArg = (membershipPaymentRepository.update as jest.Mock).mock
      .calls[0][1];
    expect(updateArg.expires_at).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// QR Manual (GCash / Maya QR / UnionBank QR)
// ════════════════════════════════════════════════════════════════════════════

describe('initiatePaymentForMembership — QR manual', () => {
  const testQrMethods = [
    { method: 'gcash', qrUrl: GCASH_QR_URL },
    { method: 'maya_qr', qrUrl: MAYA_QR_URL },
    { method: 'unionbank_qr', qrUrl: UNIONBANK_QR_URL },
  ];

  it.each(testQrMethods)(
    'MPI-010: $method — returns qr_image_url and null checkout_url',
    async ({ method, qrUrl }) => {
      const payment = makeMembershipPayment({ payment_method_code: method });
      const resolver = makeResolver({ method, gateway: makeQrGateway(qrUrl) });
      const { service } = buildService(payment, resolver);

      const result = await service.initiatePaymentForMembership(
        { membership_payment_id: 50, payment_method_code: method },
        makeUser() as any,
      );

      expect(result.qr_image_url).toBe(qrUrl);
      expect(result.checkout_url).toBeNull();
      expect(result.requires_manual_confirmation).toBe(true);
    },
  );

  it('should set expires_at ~15 minutes from now for QR payment (MPI-011)', async () => {
    const payment = makeMembershipPayment({ payment_method_code: 'gcash' });
    const resolver = makeResolver({
      method: 'gcash',
      gateway: makeQrGateway(GCASH_QR_URL),
    });
    const { service, membershipPaymentRepository } = buildService(
      payment,
      resolver,
    );

    const before = Date.now();
    await service.initiatePaymentForMembership(
      { membership_payment_id: 50, payment_method_code: 'gcash' },
      makeUser() as any,
    );
    const after = Date.now();

    const updateArg = (membershipPaymentRepository.update as jest.Mock).mock
      .calls[0][1];
    const expiresAt: Date = updateArg.expires_at;
    expect(expiresAt).toBeInstanceOf(Date);
    const deltaMs = expiresAt.getTime() - before;
    const expectedMs = 15 * 60 * 1000;
    // should be within 15 minutes ± 1 second
    expect(deltaMs).toBeGreaterThanOrEqual(expectedMs - 1000);
    expect(deltaMs).toBeLessThanOrEqual(expectedMs + (after - before) + 1000);
  });

  it('should record provider as "qr_manual" on membership payment (MPI-012)', async () => {
    const payment = makeMembershipPayment({ payment_method_code: 'gcash' });
    const resolver = makeResolver({
      method: 'gcash',
      gateway: makeQrGateway(GCASH_QR_URL),
    });
    const { service, membershipPaymentRepository } = buildService(
      payment,
      resolver,
    );

    await service.initiatePaymentForMembership(
      { membership_payment_id: 50, payment_method_code: 'gcash' },
      makeUser() as any,
    );

    expect(membershipPaymentRepository.update).toHaveBeenCalledWith(
      50,
      expect.objectContaining({
        provider: 'qr_manual',
        payment_method_code: 'gcash',
      }),
    );
  });

  it('should keep payment_status PENDING until admin confirms QR flow (MPI-013)', async () => {
    const payment = makeMembershipPayment({ payment_method_code: 'gcash' });
    const resolver = makeResolver({
      method: 'gcash',
      gateway: makeQrGateway(GCASH_QR_URL),
    });
    const { service } = buildService(payment, resolver);

    const result = await service.initiatePaymentForMembership(
      { membership_payment_id: 50, payment_method_code: 'gcash' },
      makeUser() as any,
    );

    expect(result.payment_status).toBe(MembershipPaymentStatusEnum.PENDING);
  });

  it('should use QR gateway not Maya checkout and require manual confirmation (MPI-014)', async () => {
    const payment = makeMembershipPayment({ payment_method_code: 'maya_qr' });
    const qrGateway = makeQrGateway(MAYA_QR_URL);
    const resolver = makeResolver({ method: 'maya_qr', gateway: qrGateway });
    const { service } = buildService(payment, resolver);

    const result = await service.initiatePaymentForMembership(
      { membership_payment_id: 50, payment_method_code: 'maya_qr' },
      makeUser() as any,
    );

    expect(qrGateway.initiate).toHaveBeenCalled();
    expect(result.requires_manual_confirmation).toBe(true);
    expect(result.qr_image_url).toBe(MAYA_QR_URL);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Guards & Error Paths
// ════════════════════════════════════════════════════════════════════════════

describe('initiatePaymentForMembership — guards and error paths', () => {
  it('should throw NotFoundException when membership payment does not exist (MPI-020)', async () => {
    const resolver = makeResolver({
      method: 'maya',
      gateway: makeMayaGateway(),
    });
    const { service } = buildService(null, resolver);

    await expect(
      service.initiatePaymentForMembership(
        { membership_payment_id: 999, payment_method_code: 'maya' },
        makeUser() as any,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw NotFoundException when payment belongs to a different user (MPI-021)', async () => {
    const payment = makeMembershipPayment({ user_id: 99 }); // different user
    const resolver = makeResolver({
      method: 'maya',
      gateway: makeMayaGateway(),
    });
    const { service } = buildService(payment, resolver);

    await expect(
      service.initiatePaymentForMembership(
        { membership_payment_id: 50, payment_method_code: 'maya' },
        makeUser(77) as any, // current user id = 77
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw BadRequestException if payment is already PAID (MPI-022)', async () => {
    const payment = makeMembershipPayment({
      payment_status: MembershipPaymentStatusEnum.PAID,
    });
    const resolver = makeResolver({
      method: 'maya',
      gateway: makeMayaGateway(),
    });
    const { service } = buildService(payment, resolver);

    await expect(
      service.initiatePaymentForMembership(
        { membership_payment_id: 50, payment_method_code: 'maya' },
        makeUser() as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should mark membership payment as FAILED and re-throw on gateway failure (MPI-023)', async () => {
    const payment = makeMembershipPayment({ payment_method_code: 'maya' });
    const failingGateway = makeMayaGateway();
    (failingGateway.initiate as jest.Mock).mockRejectedValue(
      new Error('Maya timeout'),
    );
    const resolver = makeResolver({ method: 'maya', gateway: failingGateway });
    const { service, membershipPaymentRepository } = buildService(
      payment,
      resolver,
    );

    await expect(
      service.initiatePaymentForMembership(
        { membership_payment_id: 50, payment_method_code: 'maya' },
        makeUser() as any,
      ),
    ).rejects.toThrow('Maya timeout');

    expect(membershipPaymentRepository.update).toHaveBeenCalledWith(
      50,
      expect.objectContaining({
        payment_status: MembershipPaymentStatusEnum.FAILED,
      }),
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Scheduler — MembershipsSchedulerService
// ════════════════════════════════════════════════════════════════════════════

import { MembershipsSchedulerService } from '@/memberships/memberships-scheduler.service';
import { MembershipStatusEnum } from '@/memberships/enums/membership-status.enum';
import { Repository } from 'typeorm';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';

describe('MembershipsSchedulerService', () => {
  let scheduler: MembershipsSchedulerService;
  let mockRepo: jest.Mocked<Pick<Repository<MembershipEntity>, 'update'>>;

  beforeEach(() => {
    mockRepo = { update: jest.fn().mockResolvedValue({ affected: 0 }) };
    scheduler = new MembershipsSchedulerService(mockRepo as any);
  });

  it('should expire ACTIVE memberships whose ends_at has passed', async () => {
    (mockRepo.update as jest.Mock).mockResolvedValue({ affected: 3 });

    await scheduler.expireOverdueMemberships();

    expect(mockRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: MembershipStatusEnum.ACTIVE }),
      { status: MembershipStatusEnum.EXPIRED },
    );
  });

  it('should use a LessThan condition on ends_at', async () => {
    await scheduler.expireOverdueMemberships();

    const [condition] = (mockRepo.update as jest.Mock).mock.calls[0];
    // TypeORM LessThan wraps a Date value
    expect(condition.ends_at).toBeDefined();
    expect(typeof condition.ends_at).toBe('object'); // FindOperator
  });

  it('should not throw when no memberships need expiring (affected = 0)', async () => {
    (mockRepo.update as jest.Mock).mockResolvedValue({ affected: 0 });

    await expect(scheduler.expireOverdueMemberships()).resolves.not.toThrow();
  });

  it('should not update memberships that are already EXPIRED', async () => {
    await scheduler.expireOverdueMemberships();

    // The condition only targets ACTIVE — EXPIRED memberships are not in the criteria
    const [condition] = (mockRepo.update as jest.Mock).mock.calls[0];
    expect(condition.status).toBe(MembershipStatusEnum.ACTIVE);
  });
});
