import { Injectable } from '@nestjs/common';
import { PaymentGateway } from './payment-gateway.interface';
import { MayaGateway } from './maya.gateway';
import { QrManualGateway } from './qr-manual.gateway';
import { DragonPayGateway } from './dragonpay.gateway';
import { CodGateway } from './cod.gateway';
import { CustomPaymentMethodRepository } from '@/checkout-payments/persistence/repositories/custom-payment-method.repository';
import { PaymentGatewaySettingsService } from '@/checkout-payments/payment-gateway-settings.service';

@Injectable()
export class PaymentGatewayResolver {
  constructor(
    private readonly mayaGateway: MayaGateway,
    private readonly qrManualGateway: QrManualGateway,
    private readonly dragonPayGateway: DragonPayGateway,
    private readonly codGateway: CodGateway,
    private readonly paymentGatewaySettingsService: PaymentGatewaySettingsService,
    private readonly customPaymentMethodRepository: CustomPaymentMethodRepository,
  ) {}

  async resolve(paymentMethodCode: string): Promise<PaymentGateway> {
    const normalizedCode = paymentMethodCode.toLowerCase().trim();

    if (normalizedCode === 'cod') {
      return this.codGateway;
    }

    if (
      normalizedCode === 'maya' ||
      normalizedCode === 'paymaya' ||
      normalizedCode === 'paymaya_direct'
    ) {
      const mayaEnabled =
        await this.paymentGatewaySettingsService.isMayaEnabled();
      return mayaEnabled ? this.mayaGateway : this.qrManualGateway;
    }

    // Builtin QR methods stored in custom_payment_methods with a fixed code
    if (
      normalizedCode === 'gcash' ||
      normalizedCode === 'maya_qr' ||
      normalizedCode === 'unionbank_qr'
    ) {
      const method =
        await this.customPaymentMethodRepository.findByCode(normalizedCode);
      if (method?.is_enabled) return this.qrManualGateway;
    }

    if (normalizedCode.startsWith('custom-')) {
      const id = parseInt(normalizedCode.slice('custom-'.length), 10);
      if (!isNaN(id)) {
        const custom = await this.customPaymentMethodRepository.findById(id);
        if (custom?.is_enabled) {
          return this.qrManualGateway;
        }
      }
    }

    return this.dragonPayGateway;
  }

  async getAvailableGatewayForMethod(methodCode: string): Promise<string> {
    const gateway = await this.resolve(methodCode);
    return gateway.gatewayName;
  }
}
