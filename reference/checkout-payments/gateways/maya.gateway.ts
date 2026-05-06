import { Injectable } from '@nestjs/common';
import {
  PaymentGateway,
  GatewayContext,
  GatewayInitiateResult,
} from './payment-gateway.interface';
import { MayaCheckoutService } from '@/checkout-payments/services/maya-checkout.service';

@Injectable()
export class MayaGateway implements PaymentGateway {
  readonly gatewayName = 'maya';

  constructor(private readonly mayaCheckoutService: MayaCheckoutService) {}

  async initiate(context: GatewayContext): Promise<GatewayInitiateResult> {
    const result = await this.mayaCheckoutService.createCheckoutSession({
      txnid: context.txnid,
      amount: context.amount,
      currency: context.currency,
      description: context.description,
      email: context.email,
      customerName: context.customerName,
      contactNumber: undefined,
      metadata: context.metadata,
    });

    return {
      gateway: 'maya',
      checkout_url: result.checkoutUrl || null,
      qr_image_url: null,
      reference_number: result.referenceNumber || null,
      requires_manual_confirmation: false,
    };
  }

  supportsManualConfirmation(): boolean {
    return false;
  }
}
