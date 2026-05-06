/**
 * PaymentGatewaySettingsService — cache behaviour
 *
 * PGC-001  getSettings() returns cached value on cache hit (no DB call)
 * PGC-002  getSettings() queries DB and writes cache on cache miss
 * PGC-003  updateSettings() invalidates the cache after writing to DB
 * PGC-004  getAvailableMethods() returns correct shape with label/icon/sort
 * PGC-005  getAvailableMethods() excludes disabled methods
 */

import { PaymentGatewaySettingsService } from '@/checkout-payments/payment-gateway-settings.service';
import { RedisHelper } from '@/utils/helpers/redis.helper';
import { ParametersService } from '@/parameters/parameters.service';
import { ConfigService } from '@nestjs/config';

const CACHED_SETTINGS = {
  cod_enabled: true,
  card_enabled: true,
  gcash_enabled: true,
  maya_enabled: true,
  gcash_qr_image_url: null,
  credit_card_enabled: true,
  grabpay_enabled: true,
  shopeepay_enabled: true,
  bpi_enabled: true,
  bdo_enabled: true,
  unionbank_enabled: false,
  metrobank_enabled: false,
  instapay_enabled: false,
  pesonet_enabled: false,
  seveneleven_enabled: false,
  bayad_enabled: false,
  cebuana_enabled: false,
  mlhuillier_enabled: false,
  ecpay_enabled: false,
};

const makeRedisHelper = (
  cachedValue: string | null = null,
): jest.Mocked<RedisHelper> =>
  ({
    get: jest.fn().mockResolvedValue(cachedValue),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  }) as any;

const makeParametersService = (): jest.Mocked<ParametersService> =>
  ({
    findByCode: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
  }) as any;

const makeConfigService = (): jest.Mocked<ConfigService> =>
  ({ get: jest.fn().mockReturnValue(undefined) }) as any;

const makeCustomRepo = () =>
  ({
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    findAllEnabled: jest.fn().mockResolvedValue([]),
  }) as any;

describe('PaymentGatewaySettingsService — cache', () => {
  // PGC-001
  it('should return cached settings without hitting DB on cache hit', async () => {
    const redis = makeRedisHelper(JSON.stringify(CACHED_SETTINGS));
    const params = makeParametersService();
    const svc = new PaymentGatewaySettingsService(
      params,
      makeConfigService(),
      redis,
      makeCustomRepo(),
    );

    const result = await svc.getSettings();

    expect(redis.get).toHaveBeenCalledWith('payment_gateway_settings');
    expect(params.findByCode).not.toHaveBeenCalled();
    expect(result).toEqual(CACHED_SETTINGS);
  });

  // PGC-002
  it('should query DB and write to cache on cache miss', async () => {
    const redis = makeRedisHelper(null);
    const params = makeParametersService();
    const svc = new PaymentGatewaySettingsService(
      params,
      makeConfigService(),
      redis,
      makeCustomRepo(),
    );

    await svc.getSettings();

    expect(params.findByCode).toHaveBeenCalled();
    expect(redis.set).toHaveBeenCalledWith(
      'payment_gateway_settings',
      expect.any(String),
      300,
    );
  });

  // PGC-003
  it('should invalidate cache after updateSettings()', async () => {
    const redis = makeRedisHelper(null);
    const params = makeParametersService();
    const svc = new PaymentGatewaySettingsService(
      params,
      makeConfigService(),
      redis,
      makeCustomRepo(),
    );

    await svc.updateSettings({ cod_enabled: false });

    expect(redis.del).toHaveBeenCalledWith('payment_gateway_settings');
  });

  // PGC-004
  it('should return methods with label, icon, and sort', async () => {
    const redis = makeRedisHelper(JSON.stringify(CACHED_SETTINGS));
    const svc = new PaymentGatewaySettingsService(
      makeParametersService(),
      makeConfigService(),
      redis,
      makeCustomRepo(),
    );

    const result = await svc.getAvailableMethods();

    expect(result.methods).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'cod',
          label: expect.any(String),
          icon: expect.any(String),
          sort: expect.any(Number),
          available: true,
        }),
        expect.objectContaining({
          code: 'maya',
          label: expect.any(String),
          available: true,
        }),
      ]),
    );
  });

  // PGC-005
  it('should exclude methods whose toggle is disabled', async () => {
    const settings = {
      ...CACHED_SETTINGS,
      cod_enabled: false,
      gcash_enabled: false,
    };
    const redis = makeRedisHelper(JSON.stringify(settings));
    const svc = new PaymentGatewaySettingsService(
      makeParametersService(),
      makeConfigService(),
      redis,
      makeCustomRepo(),
    );

    const result = await svc.getAvailableMethods();

    const codes = result.methods.map((m) => m.code);
    expect(codes).not.toContain('cod');
    expect(codes).not.toContain('gcash');
  });

  // PGC-006
  it('should include unionbank when unionbank_enabled is true', async () => {
    const settings = { ...CACHED_SETTINGS, unionbank_enabled: true };
    const redis = makeRedisHelper(JSON.stringify(settings));
    const svc = new PaymentGatewaySettingsService(
      makeParametersService(),
      makeConfigService(),
      redis,
      makeCustomRepo(),
    );

    const result = await svc.getAvailableMethods();

    const codes = result.methods.map((m) => m.code);
    expect(codes).toContain('unionbank');
    expect(codes).not.toContain('metrobank');
  });

  // PGC-007
  it('should exclude all dragonpay methods when all are disabled', async () => {
    const settings = {
      ...CACHED_SETTINGS,
      credit_card_enabled: false,
      grabpay_enabled: false,
      shopeepay_enabled: false,
      bpi_enabled: false,
      bdo_enabled: false,
      unionbank_enabled: false,
      metrobank_enabled: false,
      instapay_enabled: false,
      pesonet_enabled: false,
      seveneleven_enabled: false,
      bayad_enabled: false,
      cebuana_enabled: false,
      mlhuillier_enabled: false,
      ecpay_enabled: false,
    };
    const redis = makeRedisHelper(JSON.stringify(settings));
    const svc = new PaymentGatewaySettingsService(
      makeParametersService(),
      makeConfigService(),
      redis,
      makeCustomRepo(),
    );

    const result = await svc.getAvailableMethods();

    const dragonpayCodes = [
      'credit_card',
      'grabpay',
      'shopeepay',
      'bpi',
      'bdo',
      'unionbank',
      'metrobank',
      'instapay',
      'pesonet',
      '7eleven',
      'bayad',
      'cebuana',
      'mlhuillier',
      'ecpay',
    ];
    const returnedCodes = result.methods.map((m) => m.code);
    dragonpayCodes.forEach((code) => expect(returnedCodes).not.toContain(code));
  });

  // PGC-008
  it('should return unionbank with gateway dragonpay and correct label', async () => {
    const settings = { ...CACHED_SETTINGS, unionbank_enabled: true };
    const redis = makeRedisHelper(JSON.stringify(settings));
    const svc = new PaymentGatewaySettingsService(
      makeParametersService(),
      makeConfigService(),
      redis,
      makeCustomRepo(),
    );

    const result = await svc.getAvailableMethods();

    const unionbank = result.methods.find((m) => m.code === 'unionbank');
    expect(unionbank).toEqual(
      expect.objectContaining({
        code: 'unionbank',
        label: 'UnionBank',
        icon: 'unionbank',
        gateway: 'dragonpay',
        available: true,
      }),
    );
  });

  // PGC-009
  it('should return 7eleven with code "7eleven" when seveneleven_enabled is true', async () => {
    const settings = { ...CACHED_SETTINGS, seveneleven_enabled: true };
    const redis = makeRedisHelper(JSON.stringify(settings));
    const svc = new PaymentGatewaySettingsService(
      makeParametersService(),
      makeConfigService(),
      redis,
      makeCustomRepo(),
    );

    const result = await svc.getAvailableMethods();

    const sevenEleven = result.methods.find((m) => m.code === '7eleven');
    expect(sevenEleven).toBeDefined();
    expect(sevenEleven?.label).toBe('7-Eleven');
  });
});
