import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PaymentGateway,
  GatewayContext,
  GatewayInitiateResult,
} from './payment-gateway.interface';
import { DragonPayV2Service } from '@/checkout-payments/services/dragonpay-v2.service';

@Injectable()
export class DragonPayGateway implements PaymentGateway {
  readonly gatewayName = 'dragonpay';

  constructor(private readonly dragonPayV2Service: DragonPayV2Service) {}

  async initiate(context: GatewayContext): Promise<GatewayInitiateResult> {
    const procId = this.dragonPayV2Service.mapPaymentMethodToProcessor(
      context.metadata?.payment_method_code || '',
    );

    if (!procId) {
      throw new BadRequestException(
        `Unsupported payment method: ${context.metadata?.payment_method_code}`,
      );
    }

    const result = await this.dragonPayV2Service.createPaymentIntent(
      context.txnid,
      {
        amount: context.amount,
        currency: context.currency,
        description: context.description,
        email: context.email,
        procId,
        ipAddress: context.ipAddress,
        param1: JSON.stringify(context.metadata || {}),
      },
    );

    return {
      gateway: 'dragonpay',
      checkout_url: result.url || null,
      qr_image_url: null,
      reference_number: result.refNo || null,
      requires_manual_confirmation: false,
    };
  }

  supportsManualConfirmation(): boolean {
    return false;
  }
}
