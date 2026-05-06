import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { MayaCheckoutService } from '../maya-checkout.service';

describe('MayaCheckoutService', () => {
  const baseConfig: Record<string, string> = {
    USE_MOCK_MAYA: 'true',
    MAYA_SKIP_SIGNATURE_VERIFICATION: 'false',
    APP_URL: 'http://localhost:4080',
    FRONTEND_DOMAIN: 'http://localhost:3000',
    MAYA_CHECKOUT_BASE_URL: 'https://pg-sandbox.paymaya.com',
    MAYA_PUBLIC_KEY: '',
    MAYA_SECRET_KEY: '',
    MAYA_WEBHOOK_SECRET: '',
    MAYA_WEBHOOK_SIGNATURE_HEADER: 'x-signature',
  };

  const createService = async (overrides: Record<string, string> = {}) => {
    const mockConfigService = {
      get: jest.fn((key: string) => ({ ...baseConfig, ...overrides })[key]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MayaCheckoutService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    const service = module.get<MayaCheckoutService>(MayaCheckoutService);
    return { service };
  };

  it('creates mock checkout session without API keys when USE_MOCK_MAYA=true', async () => {
    const { service } = await createService({ USE_MOCK_MAYA: 'true' });

    const result = await service.createCheckoutSession({
      txnid: 'TXN-001',
      amount: 450,
      currency: 'PHP',
      description: 'Court booking',
      email: 'john@example.com',
      customerName: 'John Doe',
    });

    expect(result.checkoutUrl).toContain(
      '/api/v1/checkout-payments/maya/mock-pay?txnid=TXN-001',
    );
    expect(result.referenceNumber).toBe('MAYA-MOCK-TXN-001');
  });

  it('throws when non-mock mode has no Maya API key', async () => {
    const { service } = await createService({
      USE_MOCK_MAYA: 'false',
      MAYA_PUBLIC_KEY: '',
      MAYA_SECRET_KEY: '',
    });

    await expect(
      service.createCheckoutSession({
        txnid: 'TXN-002',
        amount: 450,
        currency: 'PHP',
        description: 'Court booking',
        email: 'john@example.com',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('uses MAYA_PUBLIC_KEY for checkout auth in non-mock mode', async () => {
    const { service } = await createService({
      USE_MOCK_MAYA: 'false',
      MAYA_PUBLIC_KEY: 'pub_key_123',
      MAYA_SECRET_KEY: 'sec_key_legacy',
    });

    const post = jest.fn().mockResolvedValue({
      data: {
        checkoutId: 'co_123',
        referenceNumber: 'ref_123',
        redirectUrl: 'https://checkout.maya.ph/session/co_123',
      },
    });
    (service as any).http = { post };

    await service.createCheckoutSession({
      txnid: 'TXN-003',
      amount: 450,
      currency: 'PHP',
      description: 'Court booking',
      email: 'john@example.com',
      customerName: 'John Doe',
    });

    expect(post).toHaveBeenCalledWith(
      expect.stringContaining('/checkout/v1/checkouts'),
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from('pub_key_123:').toString('base64')}`,
        }),
      }),
    );
  });

  it('parses Maya paymentStatus payloads as success', () => {
    const service = new MayaCheckoutService({
      get: (key: string) =>
        ({
          ...baseConfig,
          USE_MOCK_MAYA: 'true',
        })[key],
    } as any);

    const parsed = service.parseWebhookPayload({
      id: 'event_1',
      requestReferenceNumber: 'TXN-004',
      paymentStatus: 'AUTHORIZED',
      eventType: 'PAYMENT_SUCCESS',
    });

    expect(parsed.status).toBe('success');
    expect(parsed.txnid).toBe('TXN-004');
  });
});
