/**
 * Payment Gateway Routing Tests
 *
 * Covers two layers:
 *   1. PaymentGatewayResolver — picks the right gateway based on method code
 *      and the maya_enabled setting (DB param → env var → default true).
 *   2. CheckoutPaymentsService.initiatePayment — for a sales order, routes
 *      correctly to Maya (checkout URL) or GCash manual (QR URL) depending
 *      on the resolver's decision.
 *
 * Test IDs:
 *   PGR-001 … PGR-006  — resolver unit tests
 *   PGI-001 … PGI-006  — initiatePayment integration-style tests
 *   PGM-001 … PGM-004  — confirmManualPayment / rejectManualPayment tests
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentGatewayResolver } from '@/checkout-payments/gateways/payment-gateway.resolver';
import { MayaGateway } from '@/checkout-payments/gateways/maya.gateway';
import { QrManualGateway } from '@/checkout-payments/gateways/qr-manual.gateway';
import { DragonPayGateway } from '@/checkout-payments/gateways/dragonpay.gateway';
import { CodGateway } from '@/checkout-payments/gateways/cod.gateway';
import { CheckoutPaymentsService } from '@/checkout-payments/checkout-payments.service';
import { CheckoutPaymentStatusEnum } from '@/checkout-payments/enums/checkout-payment-status.enum';

// ─── shared mock helpers ────────────────────────────────────────────────────

const MAYA_CHECKOUT_URL =
  'https://payments-web-sandbox.maya.ph/v2/checkout?id=mock-id';
const GCASH_QR_URL = 'https://cdn.example.com/gcash-qr.png';

const makeMayaGateway = (): jest.Mocked<MayaGateway> =>
  ({
    gatewayName: 'maya',
    initiate: jest.fn().mockResolvedValue({
      gateway: 'maya',
      checkout_url: MAYA_CHECKOUT_URL,
      qr_image_url: null,
      reference_number: 'MAYA-REF-001',
      requires_manual_confirmation: false,
    }),
    supportsManualConfirmation: jest.fn().mockReturnValue(false),
  }) as any;

const makeGcashGateway = (): jest.Mocked<QrManualGateway> =>
  ({
    gatewayName: 'qr_manual',
    initiate: jest.fn().mockResolvedValue({
      gateway: 'qr_manual',
      checkout_url: null,
      qr_image_url: GCASH_QR_URL,
      reference_number: 'PAY-GCASH-001',
      requires_manual_confirmation: true,
    }),
    supportsManualConfirmation: jest.fn().mockReturnValue(true),
    resolveQrImageUrl: jest.fn().mockResolvedValue(GCASH_QR_URL),
  }) as any;

const makeDragonPayGateway = (): jest.Mocked<DragonPayGateway> =>
  ({
    gatewayName: 'dragonpay',
    initiate: jest.fn().mockResolvedValue({
      gateway: 'dragonpay',
      checkout_url: 'https://test.dragonpay.ph/pay/DP-001',
      qr_image_url: null,
      reference_number: 'DP-001',
      requires_manual_confirmation: false,
    }),
    supportsManualConfirmation: jest.fn().mockReturnValue(false),
  }) as any;

const makeCodGateway = (): jest.Mocked<CodGateway> =>
  ({
    gatewayName: 'cod',
    initiate: jest.fn().mockResolvedValue({
      gateway: 'cod',
      checkout_url: null,
      qr_image_url: null,
      reference_number: null,
      requires_manual_confirmation: false,
    }),
    supportsManualConfirmation: jest.fn().mockReturnValue(false),
  }) as any;

const makePaymentGatewaySettingsService = (mayaEnabled = true) => ({
  isMayaEnabled: jest.fn().mockResolvedValue(mayaEnabled),
});

const BUILTIN_QR_CODES = ['gcash', 'maya_qr', 'unionbank_qr'];

const makeCustomPaymentMethodRepository = () => ({
  findById: jest.fn().mockResolvedValue(null),
  findAll: jest.fn().mockResolvedValue([]),
  findAllEnabled: jest.fn().mockResolvedValue([]),
  findByCode: jest
    .fn()
    .mockImplementation((code: string) =>
      BUILTIN_QR_CODES.includes(code)
        ? Promise.resolve({ code, is_enabled: true })
        : Promise.resolve(null),
    ),
});

const buildResolver = ({
  mayaEnabled = true,
  maya = makeMayaGateway(),
  gcash = makeGcashGateway(),
  dragonpay = makeDragonPayGateway(),
  cod = makeCodGateway(),
} = {}) =>
  new PaymentGatewayResolver(
    maya,
    gcash,
    dragonpay,
    cod,
    makePaymentGatewaySettingsService(mayaEnabled) as any,
    makeCustomPaymentMethodRepository() as any,
  );

// ── shared CheckoutPaymentsService builder ───────────────────────────────────

const SAVED_PAYMENT_ID = 99;

const buildService = (resolverOverride?: PaymentGatewayResolver) => {
  const repository = {
    findBySalesOrderId: jest.fn().mockResolvedValue([]),
    findByTransactionNumber: jest.fn().mockResolvedValue(null), // null = no collision, unique txn
    findById: jest.fn(),
    create: jest
      .fn()
      .mockImplementation((p) => ({ id: SAVED_PAYMENT_ID, ...p })),
    transitionToAwaitingPaymentIfPending: jest
      .fn()
      .mockImplementation((_id, ref, url) =>
        Promise.resolve({
          id: SAVED_PAYMENT_ID,
          gateway_reference_number: ref,
          gateway_checkout_url: url,
        }),
      ),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const resolver = resolverOverride ?? buildResolver();

  const service = new CheckoutPaymentsService(
    repository as any,
    {} as any, // membershipPaymentRepository
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
    {} as any, /* dataSource */ {} as any, /* subscriptionPaymentRepository */ {} as any /* subscriptionPaymentsService */
  );

  return { service, repository, resolver };
};

const salesOrderInput = (methodCode: string) => ({
  sales_order_id: 1,
  payment_method_code: methodCode,
  amount: 2500,
  currency_code: 'PHP',
  description: 'Sales order payment',
});

const mockUser = {
  id: 77,
  email: 'buyer@example.com',
  first_name: 'Juan',
  last_name: 'dela Cruz',
} as any;

// ════════════════════════════════════════════════════════════════════════════
// 1. PaymentGatewayResolver unit tests
// ════════════════════════════════════════════════════════════════════════════

describe('PaymentGatewayResolver', () => {
  // PGR-001
  it('should route "maya" to MayaGateway when maya is enabled', async () => {
    const resolver = buildResolver({ mayaEnabled: true });
    const gateway = await resolver.resolve('maya');
    expect(gateway.gatewayName).toBe('maya');
  });

  // PGR-002
  it('should route "maya" to QrManualGateway when maya is disabled', async () => {
    const resolver = buildResolver({ mayaEnabled: false });
    const gateway = await resolver.resolve('maya');
    expect(gateway.gatewayName).toBe('qr_manual');
  });

  // PGR-003
  it('should route "maya" to QrManualGateway when settings service returns false', async () => {
    const resolver = buildResolver({ mayaEnabled: false });
    const gateway = await resolver.resolve('maya');
    expect(gateway.gatewayName).toBe('qr_manual');
  });

  // PGR-004
  it('should route "maya" to MayaGateway when settings service returns true', async () => {
    const resolver = buildResolver({ mayaEnabled: true });
    const gateway = await resolver.resolve('maya');
    expect(gateway.gatewayName).toBe('maya');
  });

  // PGR-005
  it('should always route "gcash" to QrManualGateway regardless of maya setting', async () => {
    const withMayaOn = buildResolver({ mayaEnabled: true });
    const withMayaOff = buildResolver({ mayaEnabled: false });

    expect((await withMayaOn.resolve('gcash')).gatewayName).toBe('qr_manual');
    expect((await withMayaOff.resolve('gcash')).gatewayName).toBe('qr_manual');
  });

  // PGR-006
  it('should route "paymaya" and "paymaya_direct" same as "maya"', async () => {
    const resolverOn = buildResolver({ mayaEnabled: true });
    const resolverOff = buildResolver({ mayaEnabled: false });

    expect((await resolverOn.resolve('paymaya')).gatewayName).toBe('maya');
    expect((await resolverOff.resolve('paymaya')).gatewayName).toBe(
      'qr_manual',
    );
    expect((await resolverOn.resolve('paymaya_direct')).gatewayName).toBe(
      'maya',
    );
    expect((await resolverOff.resolve('paymaya_direct')).gatewayName).toBe(
      'qr_manual',
    );
  });

  // PGR-007
  it('should route "cod" to CodGateway', async () => {
    const resolver = buildResolver();
    expect((await resolver.resolve('cod')).gatewayName).toBe('cod');
  });

  // PGR-008
  it('should route "credit_card", "bpi", "grabpay" to DragonPayGateway', async () => {
    const resolver = buildResolver();
    for (const method of [
      'credit_card',
      'bpi',
      'grabpay',
      'bdo',
      'shopeepay',
    ]) {
      expect((await resolver.resolve(method)).gatewayName).toBe('dragonpay');
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. CheckoutPaymentsService.initiatePayment — gateway routing for sales orders
// ════════════════════════════════════════════════════════════════════════════

describe('CheckoutPaymentsService.initiatePayment — gateway routing', () => {
  // PGI-001
  it('should return checkout URL from Maya gateway for maya payment', async () => {
    const { service, repository } = buildService(
      buildResolver({ mayaEnabled: true }),
    );

    const result = await service.initiatePayment(
      salesOrderInput('maya'),
      mockUser,
    );

    expect(repository.update).toHaveBeenCalledWith(
      SAVED_PAYMENT_ID,
      expect.objectContaining({ payment_gateway: 'maya' }),
    );
    expect(
      repository.transitionToAwaitingPaymentIfPending,
    ).toHaveBeenCalledWith(SAVED_PAYMENT_ID, 'MAYA-REF-001', MAYA_CHECKOUT_URL);
    expect(result.gateway_checkout_url).toBe(MAYA_CHECKOUT_URL);
  });

  // PGI-002
  it('should fall back to QR manual and return QR URL when maya is disabled', async () => {
    const { service, repository } = buildService(
      buildResolver({ mayaEnabled: false }),
    );

    const result = await service.initiatePayment(
      salesOrderInput('maya'),
      mockUser,
    );

    expect(repository.update).toHaveBeenCalledWith(
      SAVED_PAYMENT_ID,
      expect.objectContaining({ payment_gateway: 'qr_manual' }),
    );
    // For manual GCash, checkout_url receives the qr_image_url
    expect(
      repository.transitionToAwaitingPaymentIfPending,
    ).toHaveBeenCalledWith(SAVED_PAYMENT_ID, expect.any(String), GCASH_QR_URL);
    expect(result.gateway_checkout_url).toBe(GCASH_QR_URL);
  });

  // PGI-003
  it('should route paymaya to Maya when maya is enabled', async () => {
    const { service, repository } = buildService(
      buildResolver({ mayaEnabled: true }),
    );

    await service.initiatePayment(salesOrderInput('paymaya'), mockUser);

    expect(repository.update).toHaveBeenCalledWith(
      SAVED_PAYMENT_ID,
      expect.objectContaining({ payment_gateway: 'maya' }),
    );
  });

  // PGI-004
  it('should fall back to QR manual for paymaya when maya is disabled', async () => {
    const { service, repository } = buildService(
      buildResolver({ mayaEnabled: false }),
    );

    await service.initiatePayment(salesOrderInput('paymaya'), mockUser);

    expect(repository.update).toHaveBeenCalledWith(
      SAVED_PAYMENT_ID,
      expect.objectContaining({ payment_gateway: 'qr_manual' }),
    );
  });

  // PGI-005
  it('should always use QR manual gateway for gcash payment', async () => {
    // Even when Maya is enabled, gcash picks the manual gateway
    const { service, repository } = buildService(
      buildResolver({ mayaEnabled: true }),
    );

    await service.initiatePayment(salesOrderInput('gcash'), mockUser);

    expect(repository.update).toHaveBeenCalledWith(
      SAVED_PAYMENT_ID,
      expect.objectContaining({ payment_gateway: 'qr_manual' }),
    );
  });

  // PGI-006
  it('should mark payment as FAILED and re-throw on gateway failure', async () => {
    const failingMaya = makeMayaGateway();
    (failingMaya.initiate as jest.Mock).mockRejectedValue(
      new Error('Maya API timeout'),
    );

    const resolver = buildResolver({ mayaEnabled: true, maya: failingMaya });
    const { service, repository } = buildService(resolver);

    await expect(
      service.initiatePayment(salesOrderInput('maya'), mockUser),
    ).rejects.toThrow('Maya API timeout');

    expect(repository.update).toHaveBeenCalledWith(
      SAVED_PAYMENT_ID,
      expect.objectContaining({
        status: CheckoutPaymentStatusEnum.FAILED,
        failure_reason: 'Maya API timeout',
      }),
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. getPaymentStatusByTxnid — awaiting_confirmation state for GCash manual
// ════════════════════════════════════════════════════════════════════════════

describe('CheckoutPaymentsService.getPaymentStatusByTxnid', () => {
  const buildStatusService = (paymentOverride: Record<string, any>) => {
    const repository = {
      findByTransactionNumber: jest.fn().mockResolvedValue(paymentOverride),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      transitionToAwaitingPaymentIfPending: jest.fn(),
    };
    const paymentOrderRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    // Build service with real repository shape
    return new CheckoutPaymentsService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      paymentOrderRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any, // membershipsService
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any, /* dataSource */ {} as any, /* subscriptionPaymentRepository */ {} as any /* subscriptionPaymentsService */
    );
  };

  it('should return "awaiting_confirmation" for qr_manual payment in AWAITING_PAYMENT status', async () => {
    const service = buildStatusService({
      id: 1,
      status: CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
      payment_gateway: 'qr_manual',
    });

    const result = await service.getPaymentStatusByTxnid('PAY-001');
    expect(result.status).toBe('awaiting_confirmation');
  });

  it('should return "awaiting_payment" for maya payment in AWAITING_PAYMENT status', async () => {
    const service = buildStatusService({
      id: 1,
      status: CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
      payment_gateway: 'maya',
    });

    const result = await service.getPaymentStatusByTxnid('PAY-002');
    expect(result.status).toBe('awaiting_payment');
  });

  it('should return "paid" for any COMPLETED payment', async () => {
    const service = buildStatusService({
      id: 1,
      status: CheckoutPaymentStatusEnum.COMPLETED,
      payment_gateway: 'qr_manual',
    });

    const result = await service.getPaymentStatusByTxnid('PAY-003');
    expect(result.status).toBe('paid');
  });

  it('should return "failed" for FAILED payment', async () => {
    const service = buildStatusService({
      id: 1,
      status: CheckoutPaymentStatusEnum.FAILED,
      payment_gateway: 'qr_manual',
    });

    const result = await service.getPaymentStatusByTxnid('PAY-004');
    expect(result.status).toBe('failed');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. confirmManualPayment / rejectManualPayment
// ════════════════════════════════════════════════════════════════════════════

describe('CheckoutPaymentsService — manual payment confirmation', () => {
  const pendingGcashPayment = {
    id: 55,
    status: CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
    payment_gateway: 'qr_manual',
    sales_order_id: 10,
    metadata: {},
  };

  const buildManualService = (
    paymentStub: Record<string, any> | null = pendingGcashPayment,
  ) => {
    const repository = {
      findById: jest.fn().mockResolvedValue(paymentStub),
      update: jest.fn().mockResolvedValue(undefined),
      findBySalesOrderId: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      transitionToAwaitingPaymentIfPending: jest.fn(),
    };
    const salesOrderRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const paymentOrderRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    const service = new CheckoutPaymentsService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      salesOrderRepository as any,
      {} as any,
      {} as any,
      {} as any,
      paymentOrderRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any, // membershipsService
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any, /* dataSource */ {} as any, /* subscriptionPaymentRepository */ {} as any /* subscriptionPaymentsService */
    );

    return { service, repository };
  };

  // PGM-001
  it('should confirm a manual QR payment and transition to COMPLETED', async () => {
    const { service, repository } = buildManualService();

    await service.confirmManualPayment(55, mockUser);

    expect(repository.update).toHaveBeenCalledWith(
      55,
      expect.objectContaining({ status: CheckoutPaymentStatusEnum.COMPLETED }),
    );
  });

  // PGM-002
  it('should record who confirmed and when in metadata', async () => {
    const { service, repository } = buildManualService();

    await service.confirmManualPayment(55, mockUser);

    const [, updatePayload] = (repository.update as jest.Mock).mock.calls[0];
    expect(updatePayload.metadata).toMatchObject({
      manual_confirmed_by: mockUser.id,
    });
    expect(typeof updatePayload.metadata.manual_confirmed_at).toBe('string');
  });

  // PGM-003
  it('should reject a manual QR payment and transition to FAILED with reason', async () => {
    const { service, repository } = buildManualService();

    await service.rejectManualPayment(55, mockUser, 'Blurry screenshot');

    expect(repository.update).toHaveBeenCalledWith(
      55,
      expect.objectContaining({
        status: CheckoutPaymentStatusEnum.FAILED,
        failure_reason: 'Blurry screenshot',
      }),
    );
  });

  // PGM-004
  it('should throw BadRequestException when confirming a non-qr_manual payment', async () => {
    const { service } = buildManualService({
      ...pendingGcashPayment,
      payment_gateway: 'maya',
    });

    await expect(service.confirmManualPayment(55, mockUser)).rejects.toThrow(
      BadRequestException,
    );
  });

  // PGM-005
  it('should throw NotFoundException when payment does not exist', async () => {
    const { service } = buildManualService(null);

    await expect(service.confirmManualPayment(55, mockUser)).rejects.toThrow(
      NotFoundException,
    );
  });
});
