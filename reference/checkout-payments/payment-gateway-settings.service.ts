import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ParametersService } from '@/parameters/parameters.service';
import { Parameter } from '@/parameters/domain/parameter';
import { UpdatePaymentGatewaySettingsDto } from '@/checkout-payments/dto/update-payment-gateway-settings.dto';
import { RedisHelper } from '@/utils/helpers/redis.helper';
import { CustomPaymentMethodRepository } from '@/checkout-payments/persistence/repositories/custom-payment-method.repository';

const PARAM_ITEM = 'payment_settings';
const SETTINGS_CACHE_KEY = 'payment_gateway_settings';
const SETTINGS_CACHE_TTL = 300; // 5 minutes

const CODES = {
  cod: 'payment_method_cod_enabled',
  card: 'payment_method_card_enabled',
  maya: 'payment_gateway_maya_enabled',
  credit_card: 'payment_method_credit_card_enabled',
  rcbc: 'payment_method_rcbc_enabled',
  chinabank: 'payment_method_chinabank_enabled',
  pnb: 'payment_method_pnb_enabled',
  gcash_dp: 'payment_method_gcash_dp_enabled',
  grabpay: 'payment_method_grabpay_enabled',
  shopeepay: 'payment_method_shopeepay_enabled',
  bpi: 'payment_method_bpi_enabled',
  bdo: 'payment_method_bdo_enabled',
  unionbank: 'payment_method_unionbank_enabled',
  metrobank: 'payment_method_metrobank_enabled',
  instapay: 'payment_method_instapay_enabled',
  pesonet: 'payment_method_pesonet_enabled',
  seveneleven: 'payment_method_7eleven_enabled',
  bayad: 'payment_method_bayad_enabled',
  cebuana: 'payment_method_cebuana_enabled',
  mlhuillier: 'payment_method_mlhuillier_enabled',
  ecpay: 'payment_method_ecpay_enabled',
} as const;

export type PaymentMethodSettings = {
  cod_enabled: boolean;
  card_enabled: boolean;
  maya_enabled: boolean;
  credit_card_enabled: boolean;
  rcbc_enabled: boolean;
  chinabank_enabled: boolean;
  pnb_enabled: boolean;
  gcash_dp_enabled: boolean;
  grabpay_enabled: boolean;
  shopeepay_enabled: boolean;
  bpi_enabled: boolean;
  bdo_enabled: boolean;
  unionbank_enabled: boolean;
  metrobank_enabled: boolean;
  instapay_enabled: boolean;
  pesonet_enabled: boolean;
  seveneleven_enabled: boolean;
  bayad_enabled: boolean;
  cebuana_enabled: boolean;
  mlhuillier_enabled: boolean;
  ecpay_enabled: boolean;
};

export type AvailablePaymentMethod = {
  code: string;
  label: string;
  description: string | null;
  icon: string;
  qr_image_url: string | null;
  sort: number;
  gateway: string;
  available: true;
};

/** A single manual QR sub-method as returned to mobile. Includes disabled ones so mobile can filter. */
export type ManualQrMethod = {
  code: string;
  label: string;
  is_enabled: boolean;
  qr_image_url: string | null;
  sort_order: number;
};

export type AvailableMethodsResponse = {
  payment_provider: 'maya' | 'manual';
  maya_enabled: boolean;
  cod_enabled: boolean;
  credit_card_enabled: boolean;
  rcbc_enabled: boolean;
  chinabank_enabled: boolean;
  pnb_enabled: boolean;
  gcash_dp_enabled: boolean;
  grabpay_enabled: boolean;
  shopeepay_enabled: boolean;
  bpi_enabled: boolean;
  bdo_enabled: boolean;
  unionbank_enabled: boolean;
  metrobank_enabled: boolean;
  instapay_enabled: boolean;
  pesonet_enabled: boolean;
  seveneleven_enabled: boolean;
  bayad_enabled: boolean;
  cebuana_enabled: boolean;
  mlhuillier_enabled: boolean;
  ecpay_enabled: boolean;
  methods: AvailablePaymentMethod[];
  /** All manual QR sub-methods (enabled and disabled) ordered by sort_order. Mobile filters on is_enabled. */
  manual_qr_methods: ManualQrMethod[];
};

const PAYMENT_METHOD_META: Record<
  string,
  { label: string; icon: string; sort: number; gateway: string }
> = {
  cod: { label: 'Cash on Delivery', icon: 'cod', sort: 1, gateway: 'cod' },
  maya: { label: 'Maya', icon: 'maya', sort: 2, gateway: 'maya' },
  gcash: { label: 'GCash QR', icon: 'gcash', sort: 3, gateway: 'qr_manual' },
  maya_qr: { label: 'Maya QR', icon: 'maya', sort: 4, gateway: 'qr_manual' },
  unionbank_qr: {
    label: 'UnionBank QR',
    icon: 'unionbank',
    sort: 5,
    gateway: 'qr_manual',
  },
  credit_card: {
    label: 'Credit Card',
    icon: 'credit_card',
    sort: 6,
    gateway: 'dragonpay',
  },
  rcbc: { label: 'RCBC', icon: 'rcbc', sort: 7, gateway: 'dragonpay' },
  chinabank: {
    label: 'China Bank',
    icon: 'chinabank',
    sort: 8,
    gateway: 'dragonpay',
  },
  pnb: { label: 'PNB', icon: 'pnb', sort: 9, gateway: 'dragonpay' },
  gcash_dp: {
    label: 'GCash (DragonPay)',
    icon: 'gcash',
    sort: 10,
    gateway: 'dragonpay',
  },
  grabpay: {
    label: 'GrabPay',
    icon: 'grabpay',
    sort: 11,
    gateway: 'dragonpay',
  },
  shopeepay: {
    label: 'ShopeePay',
    icon: 'shopeepay',
    sort: 12,
    gateway: 'dragonpay',
  },
  bpi: { label: 'BPI Online', icon: 'bpi', sort: 13, gateway: 'dragonpay' },
  bdo: { label: 'BDO Online', icon: 'bdo', sort: 14, gateway: 'dragonpay' },
  unionbank: {
    label: 'UnionBank',
    icon: 'unionbank',
    sort: 15,
    gateway: 'dragonpay',
  },
  metrobank: {
    label: 'Metrobank',
    icon: 'metrobank',
    sort: 16,
    gateway: 'dragonpay',
  },
  instapay: {
    label: 'InstaPay',
    icon: 'instapay',
    sort: 17,
    gateway: 'dragonpay',
  },
  pesonet: {
    label: 'PESONet',
    icon: 'pesonet',
    sort: 18,
    gateway: 'dragonpay',
  },
  '7eleven': {
    label: '7-Eleven',
    icon: '7eleven',
    sort: 19,
    gateway: 'dragonpay',
  },
  bayad: {
    label: 'Bayad Center',
    icon: 'bayad',
    sort: 20,
    gateway: 'dragonpay',
  },
  cebuana: {
    label: 'Cebuana Lhuillier',
    icon: 'cebuana',
    sort: 21,
    gateway: 'dragonpay',
  },
  mlhuillier: {
    label: 'M. Lhuillier',
    icon: 'mlhuillier',
    sort: 22,
    gateway: 'dragonpay',
  },
  ecpay: { label: 'ECPay', icon: 'ecpay', sort: 23, gateway: 'dragonpay' },
};

@Injectable()
export class PaymentGatewaySettingsService {
  constructor(
    private readonly parametersService: ParametersService,
    private readonly configService: ConfigService,
    private readonly redisHelper: RedisHelper,
    private readonly customPaymentMethodRepository: CustomPaymentMethodRepository,
  ) {}

  async getSettings(): Promise<PaymentMethodSettings> {
    try {
      const cached = await this.redisHelper.get(SETTINGS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as PaymentMethodSettings;
      }
    } catch {
      // Redis unavailable — fall through to DB
    }

    const [
      codParam,
      cardParam,
      mayaParam,
      creditCardParam,
      rcbcParam,
      chinabankParam,
      pnbParam,
      gcashDpParam,
      grabpayParam,
      shopeepayParam,
      bpiParam,
      bdoParam,
      unionbankParam,
      metrobankParam,
      instapayParam,
      pesonetParam,
      sevenElevenParam,
      bayadParam,
      cebuanaParam,
      mlhuillierParam,
      ecpayParam,
    ] = await Promise.all([
      this.findParamSafe(CODES.cod),
      this.findParamSafe(CODES.card),
      this.findParamSafe(CODES.maya),
      this.findParamSafe(CODES.credit_card),
      this.findParamSafe(CODES.rcbc),
      this.findParamSafe(CODES.chinabank),
      this.findParamSafe(CODES.pnb),
      this.findParamSafe(CODES.gcash_dp),
      this.findParamSafe(CODES.grabpay),
      this.findParamSafe(CODES.shopeepay),
      this.findParamSafe(CODES.bpi),
      this.findParamSafe(CODES.bdo),
      this.findParamSafe(CODES.unionbank),
      this.findParamSafe(CODES.metrobank),
      this.findParamSafe(CODES.instapay),
      this.findParamSafe(CODES.pesonet),
      this.findParamSafe(CODES.seveneleven),
      this.findParamSafe(CODES.bayad),
      this.findParamSafe(CODES.cebuana),
      this.findParamSafe(CODES.mlhuillier),
      this.findParamSafe(CODES.ecpay),
    ]);

    const settings: PaymentMethodSettings = {
      cod_enabled: this.boolParam(codParam, true),
      card_enabled: this.boolParam(cardParam, true),
      maya_enabled: this.resolveMayaEnabled(mayaParam),
      credit_card_enabled: this.boolParam(creditCardParam, false),
      rcbc_enabled: this.boolParam(rcbcParam, false),
      chinabank_enabled: this.boolParam(chinabankParam, false),
      pnb_enabled: this.boolParam(pnbParam, false),
      gcash_dp_enabled: this.boolParam(gcashDpParam, false),
      grabpay_enabled: this.boolParam(grabpayParam, false),
      shopeepay_enabled: this.boolParam(shopeepayParam, false),
      bpi_enabled: this.boolParam(bpiParam, false),
      bdo_enabled: this.boolParam(bdoParam, false),
      unionbank_enabled: this.boolParam(unionbankParam, false),
      metrobank_enabled: this.boolParam(metrobankParam, false),
      instapay_enabled: this.boolParam(instapayParam, false),
      pesonet_enabled: this.boolParam(pesonetParam, false),
      seveneleven_enabled: this.boolParam(sevenElevenParam, false),
      bayad_enabled: this.boolParam(bayadParam, false),
      cebuana_enabled: this.boolParam(cebuanaParam, false),
      mlhuillier_enabled: this.boolParam(mlhuillierParam, false),
      ecpay_enabled: this.boolParam(ecpayParam, false),
    };

    try {
      await this.redisHelper.set(
        SETTINGS_CACHE_KEY,
        JSON.stringify(settings),
        SETTINGS_CACHE_TTL,
      );
    } catch {
      // Redis unavailable — serve from DB result
    }

    return settings;
  }

  async updateSettings(
    dto: UpdatePaymentGatewaySettingsDto,
  ): Promise<PaymentMethodSettings> {
    const updates: Array<Promise<void>> = [];

    if (dto.cod_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.cod, 'Enable COD payment method', {
          boolean_value: dto.cod_enabled,
        }),
      );
    if (dto.card_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.card, 'Enable card payments (legacy)', {
          boolean_value: dto.card_enabled,
        }),
      );
    if (dto.maya_enabled !== undefined) {
      updates.push(
        this.upsertParam(CODES.maya, 'Enable Maya hosted checkout', {
          boolean_value: dto.maya_enabled,
        }),
      );
    }
    if (dto.credit_card_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.credit_card, 'Enable Credit Card (DragonPay)', {
          boolean_value: dto.credit_card_enabled,
        }),
      );
    if (dto.rcbc_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.rcbc, 'Enable RCBC (DragonPay)', {
          boolean_value: dto.rcbc_enabled,
        }),
      );
    if (dto.chinabank_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.chinabank, 'Enable China Bank (DragonPay)', {
          boolean_value: dto.chinabank_enabled,
        }),
      );
    if (dto.pnb_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.pnb, 'Enable PNB (DragonPay)', {
          boolean_value: dto.pnb_enabled,
        }),
      );
    if (dto.gcash_dp_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.gcash_dp, 'Enable GCash via DragonPay', {
          boolean_value: dto.gcash_dp_enabled,
        }),
      );
    if (dto.grabpay_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.grabpay, 'Enable GrabPay (DragonPay)', {
          boolean_value: dto.grabpay_enabled,
        }),
      );
    if (dto.shopeepay_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.shopeepay, 'Enable ShopeePay (DragonPay)', {
          boolean_value: dto.shopeepay_enabled,
        }),
      );
    if (dto.bpi_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.bpi, 'Enable BPI Online (DragonPay)', {
          boolean_value: dto.bpi_enabled,
        }),
      );
    if (dto.bdo_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.bdo, 'Enable BDO Online (DragonPay)', {
          boolean_value: dto.bdo_enabled,
        }),
      );
    if (dto.unionbank_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.unionbank, 'Enable UnionBank (DragonPay)', {
          boolean_value: dto.unionbank_enabled,
        }),
      );
    if (dto.metrobank_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.metrobank, 'Enable Metrobank (DragonPay)', {
          boolean_value: dto.metrobank_enabled,
        }),
      );
    if (dto.instapay_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.instapay, 'Enable InstaPay (DragonPay)', {
          boolean_value: dto.instapay_enabled,
        }),
      );
    if (dto.pesonet_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.pesonet, 'Enable PESONet (DragonPay)', {
          boolean_value: dto.pesonet_enabled,
        }),
      );
    if (dto.seveneleven_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.seveneleven, 'Enable 7-Eleven (DragonPay)', {
          boolean_value: dto.seveneleven_enabled,
        }),
      );
    if (dto.bayad_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.bayad, 'Enable Bayad Center (DragonPay)', {
          boolean_value: dto.bayad_enabled,
        }),
      );
    if (dto.cebuana_enabled !== undefined)
      updates.push(
        this.upsertParam(
          CODES.cebuana,
          'Enable Cebuana Lhuillier (DragonPay)',
          { boolean_value: dto.cebuana_enabled },
        ),
      );
    if (dto.mlhuillier_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.mlhuillier, 'Enable M. Lhuillier (DragonPay)', {
          boolean_value: dto.mlhuillier_enabled,
        }),
      );
    if (dto.ecpay_enabled !== undefined)
      updates.push(
        this.upsertParam(CODES.ecpay, 'Enable ECPay (DragonPay)', {
          boolean_value: dto.ecpay_enabled,
        }),
      );

    await Promise.all(updates);

    try {
      await this.redisHelper.del(SETTINGS_CACHE_KEY);
    } catch {
      // Redis unavailable — cache will expire naturally
    }

    return this.getSettings();
  }

  async isMayaEnabled(): Promise<boolean> {
    // DB param wins when explicitly set by admin
    const param = await this.findParamSafe(CODES.maya);
    if (param?.boolean_value !== null && param?.boolean_value !== undefined) {
      return Boolean(param.boolean_value);
    }
    return this.envMayaEnabled();
  }

  getPaymentProvider(): 'maya' | 'manual' {
    const val = this.configService.get<string>('PAYMENT_PROVIDER', {
      infer: true,
    });
    if (val?.trim().toLowerCase() === 'manual') return 'manual';
    if (val?.trim().toLowerCase() === 'maya') return 'maya';
    return this.envMayaEnabled() ? 'maya' : 'manual';
  }

  async getAvailableMethods(): Promise<AvailableMethodsResponse> {
    // Fetch ALL custom methods (enabled + disabled) so mobile can render disabled ones
    // with "Not available" state without needing a second API call.
    const [settings, customEntities] = await Promise.all([
      this.getSettings(),
      this.customPaymentMethodRepository.findAll(),
    ]);
    const paymentProvider = this.getPaymentProvider();
    const mayaEnabled = settings.maya_enabled;

    const methodToggles: Record<string, boolean> = {
      cod: settings.cod_enabled,
      maya: settings.maya_enabled,
      credit_card: settings.credit_card_enabled,
      rcbc: settings.rcbc_enabled,
      chinabank: settings.chinabank_enabled,
      pnb: settings.pnb_enabled,
      gcash_dp: settings.gcash_dp_enabled,
      grabpay: settings.grabpay_enabled,
      shopeepay: settings.shopeepay_enabled,
      bpi: settings.bpi_enabled,
      bdo: settings.bdo_enabled,
      unionbank: settings.unionbank_enabled,
      metrobank: settings.metrobank_enabled,
      instapay: settings.instapay_enabled,
      pesonet: settings.pesonet_enabled,
      '7eleven': settings.seveneleven_enabled,
      bayad: settings.bayad_enabled,
      cebuana: settings.cebuana_enabled,
      mlhuillier: settings.mlhuillier_enabled,
      ecpay: settings.ecpay_enabled,
    };

    const builtInMethods: AvailablePaymentMethod[] = Object.entries(
      methodToggles,
    )
      .filter(([, enabled]) => enabled)
      .flatMap(([code]) => {
        const meta = PAYMENT_METHOD_META[code];
        if (!meta) return [];
        const gateway =
          code === 'maya' && paymentProvider === 'manual'
            ? 'qr_manual'
            : meta.gateway;
        return [
          {
            code,
            label: meta.label,
            description: null as string | null,
            icon: meta.icon,
            qr_image_url: null as string | null,
            sort: meta.sort,
            gateway,
            available: true as const,
          },
        ];
      });

    // Only enabled custom methods go into the flat `methods` list (backward compat).
    const enabledCustomMethods: AvailablePaymentMethod[] = customEntities
      .filter((e) => e.is_enabled)
      .map((entity) => ({
        code: entity.is_builtin ? entity.code! : `custom-${entity.id}`,
        label: entity.name,
        description: entity.description ?? null,
        icon: entity.icon_url ?? '',
        qr_image_url: entity.qr_image_url ?? null,
        sort: entity.sort_order,
        gateway: 'qr_manual',
        available: true as const,
      }));

    const methods = [...builtInMethods, ...enabledCustomMethods].sort(
      (a, b) => a.sort - b.sort,
    );

    // Full list (enabled + disabled) for the mobile accordion.
    const manualQrMethods: ManualQrMethod[] = customEntities
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((entity) => ({
        code: entity.is_builtin ? entity.code! : `custom-${entity.id}`,
        label: entity.name,
        is_enabled: entity.is_enabled,
        qr_image_url: entity.qr_image_url ?? null,
        sort_order: entity.sort_order,
      }));

    return {
      payment_provider: paymentProvider,
      maya_enabled: mayaEnabled,
      cod_enabled: settings.cod_enabled,
      credit_card_enabled: settings.credit_card_enabled,
      rcbc_enabled: settings.rcbc_enabled,
      chinabank_enabled: settings.chinabank_enabled,
      pnb_enabled: settings.pnb_enabled,
      gcash_dp_enabled: settings.gcash_dp_enabled,
      grabpay_enabled: settings.grabpay_enabled,
      shopeepay_enabled: settings.shopeepay_enabled,
      bpi_enabled: settings.bpi_enabled,
      bdo_enabled: settings.bdo_enabled,
      unionbank_enabled: settings.unionbank_enabled,
      metrobank_enabled: settings.metrobank_enabled,
      instapay_enabled: settings.instapay_enabled,
      pesonet_enabled: settings.pesonet_enabled,
      seveneleven_enabled: settings.seveneleven_enabled,
      bayad_enabled: settings.bayad_enabled,
      cebuana_enabled: settings.cebuana_enabled,
      mlhuillier_enabled: settings.mlhuillier_enabled,
      ecpay_enabled: settings.ecpay_enabled,
      methods,
      manual_qr_methods: manualQrMethods,
    };
  }

  private resolveMayaEnabled(param: Parameter | null): boolean {
    // DB param wins when it has been explicitly set by the admin
    if (param?.boolean_value !== null && param?.boolean_value !== undefined) {
      return Boolean(param.boolean_value);
    }
    // Fall back to env var as default
    const providerEnv = this.configService.get<string>('PAYMENT_PROVIDER', {
      infer: true,
    });
    if (providerEnv?.trim().toLowerCase() === 'maya') return true;
    if (providerEnv?.trim().toLowerCase() === 'manual') return false;
    return this.envMayaEnabled();
  }

  private boolParam(param: Parameter | null, defaultValue: boolean): boolean {
    if (param?.boolean_value !== null && param?.boolean_value !== undefined) {
      return Boolean(param.boolean_value);
    }
    return defaultValue;
  }

  private envMayaEnabled(): boolean {
    const val = this.configService.get<string | boolean>(
      'PAYMENT_GATEWAY_MAYA_ENABLED',
      { infer: true },
    );
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const v = val.trim().toLowerCase();
      return v === 'true' || v === '1';
    }
    return true;
  }

  private async findParamSafe(code: string): Promise<Parameter | null> {
    try {
      return (await this.parametersService.findByCode(code)) ?? null;
    } catch {
      return null;
    }
  }

  private async upsertParam(
    code: string,
    description: string,
    values: Partial<Pick<Parameter, 'boolean_value' | 'string_value'>>,
  ): Promise<void> {
    const existing = await this.findParamSafe(code);
    if (existing) {
      await this.parametersService.update(existing.id, {
        param_items: existing.param_items ?? PARAM_ITEM,
        description: existing.description ?? description,
        ...values,
      });
    } else {
      await this.parametersService.create({
        code,
        param_items: PARAM_ITEM,
        description,
        string_value: '',
        numeric_value: null as any,
        boolean_value: false,
        date_value: null as any,
        ...values,
      });
    }
  }
}
