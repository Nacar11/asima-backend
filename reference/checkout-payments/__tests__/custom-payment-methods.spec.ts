import { CustomPaymentMethodEntity } from '@/checkout-payments/persistence/entities/custom-payment-method.entity';

describe('CustomPaymentMethodEntity', () => {
  it('should have required fields defined', () => {
    const entity = new CustomPaymentMethodEntity();
    entity.id = 1;
    entity.name = 'Bank Transfer';
    entity.description = 'Manual bank transfer';
    entity.icon_url = null;
    entity.is_enabled = true;
    entity.sort_order = 1;

    expect(entity.name).toBe('Bank Transfer');
    expect(entity.is_enabled).toBe(true);
    expect(entity.icon_url).toBeNull();
  });
});

import { CustomPaymentMethodRepository } from '@/checkout-payments/persistence/repositories/custom-payment-method.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

describe('CustomPaymentMethodRepository', () => {
  let repo: CustomPaymentMethodRepository;
  const mockTypeOrmRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CustomPaymentMethodRepository,
        {
          provide: getRepositoryToken(CustomPaymentMethodEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();
    repo = module.get(CustomPaymentMethodRepository);
  });

  it('should find all enabled methods sorted by sort_order', async () => {
    const methods = [
      { id: 1, name: 'Bank Transfer', is_enabled: true, sort_order: 10 },
      { id: 2, name: 'Remittance', is_enabled: true, sort_order: 20 },
    ];
    mockTypeOrmRepo.find.mockResolvedValue(methods);

    const result = await repo.findAllEnabled();

    expect(mockTypeOrmRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { sort_order: 'ASC' } }),
    );
    expect(result).toHaveLength(2);
  });

  it('should find all methods for admin listing', async () => {
    const methods = [
      { id: 1, name: 'Bank Transfer', is_enabled: true },
      { id: 2, name: 'Old Method', is_enabled: false },
    ];
    mockTypeOrmRepo.find.mockResolvedValue(methods);

    const result = await repo.findAll();

    expect(mockTypeOrmRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { sort_order: 'ASC' } }),
    );
    expect(result).toHaveLength(2);
  });

  it('should create a new custom payment method', async () => {
    const data = {
      name: 'Bank Transfer',
      description: null,
      icon_url: null,
      is_enabled: true,
      sort_order: 100,
    };
    const saved = { id: 1, ...data };
    mockTypeOrmRepo.create.mockReturnValue(data);
    mockTypeOrmRepo.save.mockResolvedValue(saved);

    const result = await repo.create(data);

    expect(mockTypeOrmRepo.save).toHaveBeenCalled();
    expect(result.id).toBe(1);
  });

  it('should soft delete a method', async () => {
    mockTypeOrmRepo.softDelete.mockResolvedValue({ affected: 1 });

    await repo.softDelete(1);

    expect(mockTypeOrmRepo.softDelete).toHaveBeenCalledWith(1);
  });
});

import { PaymentGatewayResolver } from '@/checkout-payments/gateways/payment-gateway.resolver';

describe('PaymentGatewayResolver — custom methods', () => {
  const mockGcashManual = { gatewayName: 'qr_manual' } as any;
  const mockCod = { gatewayName: 'cod' } as any;
  const mockMaya = { gatewayName: 'maya' } as any;
  const mockDragonPay = { gatewayName: 'dragonpay' } as any;
  const mockSettingsService = {
    isMayaEnabled: jest.fn().mockResolvedValue(true),
  } as any;
  const mockCustomRepo = {
    findById: jest.fn(),
    findByCode: jest.fn().mockResolvedValue(null),
    findAll: jest.fn(),
    findAllEnabled: jest.fn(),
  } as any;

  let resolver: PaymentGatewayResolver;

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new PaymentGatewayResolver(
      mockMaya,
      mockGcashManual,
      mockDragonPay,
      mockCod,
      mockSettingsService,
      mockCustomRepo,
    );
  });

  it('should route custom-123 to qr_manual gateway', async () => {
    mockCustomRepo.findById.mockResolvedValue({ id: 123, is_enabled: true });
    const gateway = await resolver.resolve('custom-123');
    expect(gateway.gatewayName).toBe('qr_manual');
  });

  it('should fall through to dragonpay for unknown non-custom code', async () => {
    const gateway = await resolver.resolve('some_bank');
    expect(gateway.gatewayName).toBe('dragonpay');
  });

  it('should fall through to dragonpay if custom method is disabled', async () => {
    mockCustomRepo.findById.mockResolvedValue({ id: 99, is_enabled: false });
    const gateway = await resolver.resolve('custom-99');
    expect(gateway.gatewayName).toBe('dragonpay');
  });
});

import { PaymentGatewaySettingsService } from '@/checkout-payments/payment-gateway-settings.service';

describe('PaymentGatewaySettingsService — custom methods in available-methods', () => {
  const mockParams = { findByCode: jest.fn().mockResolvedValue(null) } as any;
  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'PAYMENT_PROVIDER') return 'manual';
      return undefined;
    }),
  } as any;
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  } as any;
  const mockCustomRepo = {
    findAllEnabled: jest.fn(),
  } as any;

  let service: PaymentGatewaySettingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentGatewaySettingsService(
      mockParams,
      mockConfig,
      mockRedis,
      mockCustomRepo,
    );
  });

  it('should append enabled custom methods to available-methods response', async () => {
    mockCustomRepo.findAllEnabled.mockResolvedValue([
      {
        id: 5,
        name: 'Bank Transfer — BDO',
        description: 'Transfer to BDO',
        icon_url: 'https://cdn.example.com/bdo.png',
        is_enabled: true,
        sort_order: 200,
      },
    ]);

    const result = await service.getAvailableMethods();

    const customMethod = result.methods.find((m) => m.code === 'custom-5');
    expect(customMethod).toBeDefined();
    expect(customMethod?.label).toBe('Bank Transfer — BDO');
    expect(customMethod?.gateway).toBe('qr_manual');
    expect(customMethod?.sort).toBe(200);
  });

  it('should return no custom methods when none exist', async () => {
    mockCustomRepo.findAllEnabled.mockResolvedValue([]);
    const result = await service.getAvailableMethods();
    const customMethods = result.methods.filter((m) =>
      m.code.startsWith('custom-'),
    );
    expect(customMethods).toHaveLength(0);
  });
});
