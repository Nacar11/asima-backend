import { Injectable } from '@nestjs/common';
import {
  PaymentGateway,
  GatewayContext,
  GatewayInitiateResult,
} from './payment-gateway.interface';
import { CustomPaymentMethodRepository } from '@/checkout-payments/persistence/repositories/custom-payment-method.repository';

@Injectable()
export class QrManualGateway implements PaymentGateway {
  readonly gatewayName = 'qr_manual';

  constructor(
    private readonly customPaymentMethodRepository: CustomPaymentMethodRepository,
  ) {}

  async initiate(context: GatewayContext): Promise<GatewayInitiateResult> {
    const qrImageUrl = await this.resolveQrImageUrl(
      context.payment_method_code,
    );

    return {
      gateway: 'qr_manual',
      checkout_url: null,
      qr_image_url: qrImageUrl,
      reference_number: context.txnid,
      requires_manual_confirmation: true,
    };
  }

  supportsManualConfirmation(): boolean {
    return true;
  }

  private async resolveQrImageUrl(methodCode?: string): Promise<string | null> {
    if (!methodCode) return null;

    // For builtin QR methods (gcash, maya_qr, unionbank_qr) and custom-{id} methods,
    // the QR image is stored in the custom_payment_methods record.
    const code = methodCode.toLowerCase().trim();

    if (code.startsWith('custom-')) {
      const id = parseInt(code.slice('custom-'.length), 10);
      if (!isNaN(id)) {
        const method = await this.customPaymentMethodRepository.findById(id);
        return method?.qr_image_url ?? null;
      }
      return null;
    }

    const method = await this.customPaymentMethodRepository.findByCode(code);
    return method?.qr_image_url ?? null;
  }
}
