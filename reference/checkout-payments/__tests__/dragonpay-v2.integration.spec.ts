import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { DragonPayV2Service } from '../services/dragonpay-v2.service';
import { CheckoutPaymentsService } from '../checkout-payments.service';
import { CheckoutPaymentStatusEnum } from '../enums/checkout-payment-status.enum';

describe('DragonPayV2Service Integration', () => {
  let service: DragonPayV2Service;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          DRAGONPAY_MERCHANT_ID: 'TEST_MERCHANT',
          DRAGONPAY_PASSWORD: 'test_password',
          DRAGONPAY_PAYOUT_PASSWORD: 'test_payout_password',
          DRAGONPAY_URL: 'https://test.dragonpay.ph/api/collect/v2',
          DRAGONPAY_PAYOUT_URL:
            'https://test.dragonpay.ph/api/payout/merchant/v1',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DragonPayV2Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DragonPayV2Service>(DragonPayV2Service);
  });

  describe('createPayment', () => {
    it('should send correct V2 payload to DragonPay collect API', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        data: {
          RefNo: 'DP-REF-123',
          Status: 'S',
          Message: 'Success',
          Url: 'https://dragonpay.ph/pay/123',
        },
      });

      (service as any).http = { post: mockPost };

      const result = await service.createPaymentIntent('TXN-TEST-001', {
        amount: 1000,
        currency: 'PHP',
        description: 'Test payment',
        email: 'test@example.com',
        procId: 'GCSH',
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/post'),
        expect.objectContaining({
          Amount: '1000.00',
          Currency: 'PHP',
          Description: 'Test payment',
          Email: 'test@example.com',
          ProcId: 'GCSH',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: expect.stringContaining('Basic'),
          }),
        }),
      );

      expect(result.refNo).toBe('DP-REF-123');
      expect(result.status).toBe('S');
      expect(result.url).toBe('https://dragonpay.ph/pay/123');
    });

    it('should send BillingDetails with capitalized keys for credit card payments', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        data: {
          RefNo: 'DP-REF-CC',
          Status: 'S',
          Message: 'Success',
          Url: 'https://dragonpay.ph/pay/cc',
        },
      });

      (service as any).http = { post: mockPost };

      await service.createPaymentIntent('TXN-TEST-001', {
        amount: 100,
        currency: 'PHP',
        description: 'Sample Transaction',
        email: 'juan.dela.cruz@sampledomain.com',
        procId: 'CC',
        param1: 'Test parameter 1',
        param2: 'Test parameter 2',
        billingDetails: {
          firstName: 'Juan',
          middleName: 'Dela',
          lastName: 'Cruz',
          address1: '123 Sesame Street',
          address2: 'Childrens Television Workshop',
          city: 'Marikina',
          state: 'Metro Manila',
          country: 'PH',
          zipCode: '1800',
          telNo: '86556820',
          email: 'juan.dela.cruz@sampledomain.com',
        },
        ipAddress: '123.12.4.67',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36',
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/post'),
        expect.objectContaining({
          Amount: '100.00',
          Currency: 'PHP',
          Description: 'Sample Transaction',
          Email: 'juan.dela.cruz@sampledomain.com',
          ProcId: 'CC',
          Param1: 'Test parameter 1',
          Param2: 'Test parameter 2',
          BillingDetails: expect.objectContaining({
            FirstName: 'Juan',
            MiddleName: 'Dela',
            LastName: 'Cruz',
            Address1: '123 Sesame Street',
            Address2: 'Childrens Television Workshop',
            City: 'Marikina',
            Province: 'Metro Manila',
            Country: 'PH',
            ZipCode: '1800',
            TelNo: '86556820',
            Email: 'juan.dela.cruz@sampledomain.com',
          }),
          IpAddress: '123.12.4.67',
          UserAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36',
        }),
        expect.any(Object),
      );
    });

    it('should throw BadRequestException on API error', async () => {
      const mockPost = jest.fn().mockRejectedValue({
        response: {
          data: { Message: 'Invalid merchant' },
        },
      });

      (service as any).http = { post: mockPost };

      await expect(
        service.createPaymentIntent('TXN-TEST-001', {
          amount: 1000,
          description: 'Test',
          email: 'test@example.com',
        }),
      ).rejects.toThrow('Invalid merchant');
    });
  });

  describe('createPayout', () => {
    it('should send correct payload to DragonPay Payout API', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        data: {
          Code: 0,
          Message: 'PO-REF-456',
        },
      });

      (service as any).http = { post: mockPost };

      const result = await service.createPayout({
        firstName: 'John',
        lastName: 'Doe',
        amount: 500,
        currency: 'PHP',
        description: 'Refund for order 123',
        procId: 'GCSH',
        procDetail: '09171234567',
        email: 'john@example.com',
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('TEST_MERCHANT/post'),
        expect.objectContaining({
          FirstName: 'John',
          LastName: 'Doe',
          Amount: '500.00',
          Currency: 'PHP',
          Description: 'Refund for order 123',
          ProcId: 'GCSH',
          ProcDetail: '09171234567',
          Email: 'john@example.com',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test_payout_password',
          }),
        }),
      );

      expect(result.refNo).toBe('PO-REF-456');
      expect(result.status).toBe('Q'); // DragonPay returns Q (Queued) on acceptance; S arrives via payout callback
    });

    it('should throw BadRequestException when payout is not configured', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const config: Record<string, string> = {
            DRAGONPAY_MERCHANT_ID: 'TEST_MERCHANT',
            DRAGONPAY_PASSWORD: 'test_password',
            DRAGONPAY_URL: 'https://test.dragonpay.ph/api/collect/v2',
            DRAGONPAY_PAYOUT_URL:
              'https://test.dragonpay.ph/api/payout/merchant/v1',
          };
          return config[key];
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DragonPayV2Service,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const svcNoPayout = module.get<DragonPayV2Service>(DragonPayV2Service);

      await expect(
        svcNoPayout.createPayout({
          firstName: 'John',
          lastName: 'Doe',
          amount: 500,
          description: 'Refund',
          procId: 'GCSH',
          procDetail: '09171234567',
          email: 'john@example.com',
        }),
      ).rejects.toThrow('DragonPay V2 Payout is not configured');
    });
  });
});

describe('CheckoutPaymentsService — handleDragonPayCallback idempotency', () => {
  let service: CheckoutPaymentsService;

  /** Build a minimal payment object with only the fields handleDragonPayCallback uses */
  function makePayment(
    overrides: Partial<{
      id: number;
      status: CheckoutPaymentStatusEnum;
      sales_order_id: number | null;
      gateway_reference_number: string;
      transaction_number: string;
    }> = {},
  ) {
    return {
      id: 6,
      status: CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
      sales_order_id: null,
      gateway_reference_number: 'BA4JTRQRVG67',
      transaction_number: 'PAY-MMD5WUAT-03C26FB91B9E7CAC',
      ...overrides,
    };
  }

  /** Minimal callback DTO matching the idempotency check inputs */
  const baseCallback = {
    txnid: 'PAY-MMD5WUAT-03C26FB91B9E7CAC',
    refno: 'BA4JTRQRVG67',
    status: 'S',
    message: 'Test',
    amount: '1574.00',
    signatures: 'valid-signature',
  };

  beforeEach(() => {
    // Instantiate service without NestJS DI — set dependencies directly
    service = Object.create(CheckoutPaymentsService.prototype);

    // Mock dragonPayV2Service.processPostback — always passes signature check
    (service as any).dragonPayV2Service = {
      processPostback: jest.fn().mockResolvedValue({
        txnid: baseCallback.txnid,
        refno: baseCallback.refno,
        status: baseCallback.status,
        message: baseCallback.message,
        amount: parseFloat(baseCallback.amount),
      }),
    };

    // Mock logger to suppress output during tests
    (service as any).logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    // Mock notificationsService (used in catch block)
    (service as any).notificationsService = {
      sendPaymentFailed: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('should return OK and create order on first postback (awaiting_payment)', async () => {
    const payment = makePayment({
      status: CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
    });
    const completedPayment = {
      ...payment,
      status: CheckoutPaymentStatusEnum.COMPLETED,
    };

    (service as any).repository = {
      findByTransactionNumber: jest.fn().mockResolvedValue(payment),
      update: jest.fn().mockResolvedValue(completedPayment),
    };
    // First call (idempotency check, N/A here) — subsequent calls after order creation
    (service as any).paymentOrderRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    (service as any).createOrdersFromPaymentMetadata = jest
      .fn()
      .mockResolvedValue([9]);
    (service as any).sendPaymentSuccessNotificationsForOrderIds = jest
      .fn()
      .mockResolvedValue(undefined);
    (service as any).updateSalesOrderPaymentStatus = jest
      .fn()
      .mockResolvedValue(undefined);
    (service as any).orderTrackingService = {
      createEvent: jest.fn().mockResolvedValue(undefined),
    };
    (service as any).salesOrderRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 9, user_id: 2 }),
    };
    (service as any).shoppingCartRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    (service as any).shoppingCartItemRepository = {
      find: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const result = await service.handleDragonPayCallback(baseCallback as any);

    expect(result).toEqual({ result: 'OK' });
    expect(
      (service as any).createOrdersFromPaymentMetadata,
    ).toHaveBeenCalledWith(payment);
  });

  it('should throw BadRequestException when payment is completed and orders exist (session-based)', async () => {
    const payment = makePayment({
      status: CheckoutPaymentStatusEnum.COMPLETED,
      sales_order_id: null,
    });

    (service as any).repository = {
      findByTransactionNumber: jest.fn().mockResolvedValue(payment),
    };
    (service as any).paymentOrderRepository = {
      find: jest
        .fn()
        .mockResolvedValue([
          { id: 1, checkout_payment_id: 6, sales_order_id: 9 },
        ]),
    };

    await expect(
      service.handleDragonPayCallback(baseCallback as any),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.handleDragonPayCallback(baseCallback as any),
    ).rejects.toThrow('Payment already processed');
  });

  it('should throw BadRequestException when payment is completed (non-session-based, has sales_order_id)', async () => {
    const payment = makePayment({
      status: CheckoutPaymentStatusEnum.COMPLETED,
      sales_order_id: 9,
    });

    (service as any).repository = {
      findByTransactionNumber: jest.fn().mockResolvedValue(payment),
    };
    (service as any).paymentOrderRepository = {
      find: jest.fn().mockResolvedValue([{ id: 1 }]),
    };

    await expect(
      service.handleDragonPayCallback(baseCallback as any),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.handleDragonPayCallback(baseCallback as any),
    ).rejects.toThrow('Payment already processed');
  });

  it('should fall through and retry order creation when completed but no orders exist', async () => {
    const payment = makePayment({
      status: CheckoutPaymentStatusEnum.COMPLETED,
      sales_order_id: null,
    });

    (service as any).repository = {
      findByTransactionNumber: jest.fn().mockResolvedValue(payment),
      update: jest.fn().mockResolvedValue({
        ...payment,
        status: CheckoutPaymentStatusEnum.COMPLETED,
      }),
    };
    (service as any).paymentOrderRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    (service as any).createOrdersFromPaymentMetadata = jest
      .fn()
      .mockResolvedValue([10]);
    (service as any).sendPaymentSuccessNotificationsForOrderIds = jest
      .fn()
      .mockResolvedValue(undefined);
    (service as any).updateSalesOrderPaymentStatus = jest
      .fn()
      .mockResolvedValue(undefined);
    (service as any).orderTrackingService = {
      createEvent: jest.fn().mockResolvedValue(undefined),
    };
    (service as any).salesOrderRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 10, user_id: 2 }),
    };
    (service as any).shoppingCartRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    (service as any).shoppingCartItemRepository = {
      find: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const result = await service.handleDragonPayCallback(baseCallback as any);

    expect(result).toEqual({ result: 'OK' });
    expect(
      (service as any).createOrdersFromPaymentMetadata,
    ).toHaveBeenCalledWith(payment);
  });

  it('should throw BadRequestException when payment is already FAILED and same F postback arrives', async () => {
    const payment = makePayment({
      status: CheckoutPaymentStatusEnum.FAILED,
      gateway_reference_number: 'BA4JTRQRVG67',
    });

    const failedCallback = { ...baseCallback, status: 'F' };

    (service as any).dragonPayV2Service = {
      processPostback: jest.fn().mockResolvedValue({
        txnid: failedCallback.txnid,
        refno: failedCallback.refno,
        status: failedCallback.status,
        message: failedCallback.message,
        amount: parseFloat(failedCallback.amount),
      }),
    };
    (service as any).repository = {
      findByTransactionNumber: jest.fn().mockResolvedValue(payment),
    };
    (service as any).paymentOrderRepository = {
      find: jest.fn(),
    };

    await expect(
      service.handleDragonPayCallback(failedCallback as any),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.handleDragonPayCallback(failedCallback as any),
    ).rejects.toThrow('Payment already processed');
  });
});
