import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DragonPayV2Service } from '../dragonpay-v2.service';

describe('DragonPayV2Service', () => {
  const mockConfig: Record<string, string> = {
    DRAGONPAY_MERCHANT_ID: 'TEST_MERCHANT',
    DRAGONPAY_PASSWORD: 'test_password',
    DRAGONPAY_PAYOUT_PASSWORD: 'test_payout_token',
    DRAGONPAY_URL: 'https://test.dragonpay.ph/api/collect/v2',
    DRAGONPAY_PAYOUT_URL: 'https://test.dragonpay.ph/api/payout/merchant/v1',
  };

  describe('configuration', () => {
    it('should initialize with correct environment variables', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => mockConfig[key]),
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

      const service = module.get<DragonPayV2Service>(DragonPayV2Service);
      expect(service.isAvailable()).toBe(true);
    });

    it('should be disabled when credentials are missing', async () => {
      const mockConfigService = {
        get: jest.fn(() => undefined),
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

      const service = module.get<DragonPayV2Service>(DragonPayV2Service);
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('auth headers', () => {
    let service: DragonPayV2Service;

    beforeEach(async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => mockConfig[key]),
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

    it('should use Basic auth with Base64(merchantId:password) for collect API', async () => {
      // TEST_MERCHANT:test_password -> VEVTVF9NRVJDSEFOVDp0ZXN0X3Bhc3N3b3Jk
      const expectedBasicToken = 'Basic VEVTVF9NRVJDSEFOVDp0ZXN0X3Bhc3N3b3Jk';
      const mockPost = jest.fn().mockResolvedValue({
        data: { RefNo: 'REF-1', Status: 'S', Message: 'OK', Url: '' },
      });
      (service as any).http = { post: mockPost };

      await service.createPaymentIntent('TXN-TEST', {
        amount: 100,
        description: 'Test',
        email: 'test@test.com',
        procId: 'GCSH',
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expectedBasicToken,
          }),
        }),
      );
    });

    it('should use Bearer token for payout API', async () => {
      const expectedBearerToken = 'Bearer test_payout_token';
      const mockPost = jest.fn().mockResolvedValue({
        data: { Code: 0, Message: 'PO-REF' },
      });
      (service as any).http = { post: mockPost };

      await service.createPayout({
        firstName: 'John',
        lastName: 'Doe',
        amount: 500,
        description: 'Refund',
        procId: 'GCSH',
        procDetail: '09171234567',
        email: 'john@test.com',
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expectedBearerToken,
          }),
        }),
      );
    });
  });

  describe('isPayoutAvailable', () => {
    it('should return true when payout password is set', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => mockConfig[key]),
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

      const service = module.get<DragonPayV2Service>(DragonPayV2Service);
      expect(service.isPayoutAvailable()).toBe(true);
    });

    it('should return false when payout password is missing', async () => {
      const configWithoutPayout = { ...mockConfig };
      delete (configWithoutPayout as any).DRAGONPAY_PAYOUT_PASSWORD;

      const mockConfigService = {
        get: jest.fn((key: string) => configWithoutPayout[key]),
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

      const service = module.get<DragonPayV2Service>(DragonPayV2Service);
      expect(service.isPayoutAvailable()).toBe(false);
    });
  });

  describe('generateTxnId', () => {
    it('should generate unique transaction IDs', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => mockConfig[key]),
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

      const service = module.get<DragonPayV2Service>(DragonPayV2Service);
      const id1 = service.generateTxnId();
      const id2 = service.generateTxnId();

      expect(id1).toMatch(/^TXN-/);
      expect(id2).toMatch(/^TXN-/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('mapPaymentMethodToProcessor', () => {
    it('should map payment methods to DragonPay processor IDs', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => mockConfig[key]),
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

      const service = module.get<DragonPayV2Service>(DragonPayV2Service);

      expect(service.mapPaymentMethodToProcessor('gcash')).toBe('GCSH');
      expect(service.mapPaymentMethodToProcessor('maya')).toBe('PYMY');
      expect(service.mapPaymentMethodToProcessor('bpi')).toBe('BPI');
      expect(service.mapPaymentMethodToProcessor('credit_card')).toBe('CC');
      expect(service.mapPaymentMethodToProcessor('unknown')).toBeUndefined();
    });
  });

  describe('skipSignatureVerification', () => {
    async function buildService(
      config: Record<string, string>,
    ): Promise<DragonPayV2Service> {
      const mockConfigService = {
        get: jest.fn((key: string) => config[key]),
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DragonPayV2Service,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();
      return module.get<DragonPayV2Service>(DragonPayV2Service);
    }

    it('should skip verification when BOTH mockMode and DRAGONPAY_SKIP_SIGNATURE_VERIFICATION are true', async () => {
      const service = await buildService({
        DRAGONPAY_MOCK: 'true',
        DRAGONPAY_SKIP_SIGNATURE_VERIFICATION: 'true',
      });
      expect((service as any).skipSignatureVerification).toBe(true);
    });

    it('should skip verification when mockMode is true even if DRAGONPAY_SKIP_SIGNATURE_VERIFICATION is false', async () => {
      const service = await buildService({
        DRAGONPAY_MOCK: 'true',
        DRAGONPAY_SKIP_SIGNATURE_VERIFICATION: 'false',
      });
      expect((service as any).skipSignatureVerification).toBe(true);
    });

    it('should skip verification when DRAGONPAY_SKIP_SIGNATURE_VERIFICATION is true even if mockMode is false', async () => {
      const service = await buildService({
        DRAGONPAY_MERCHANT_ID: 'TEST_MERCHANT',
        DRAGONPAY_PASSWORD: 'test_password',
        DRAGONPAY_SKIP_SIGNATURE_VERIFICATION: 'true',
      });
      expect((service as any).skipSignatureVerification).toBe(true);
    });

    it('should NOT skip verification when neither flag is set (production default)', async () => {
      const service = await buildService({
        DRAGONPAY_MERCHANT_ID: 'TEST_MERCHANT',
        DRAGONPAY_PASSWORD: 'test_password',
      });
      expect((service as any).skipSignatureVerification).toBe(false);
    });
  });
});
