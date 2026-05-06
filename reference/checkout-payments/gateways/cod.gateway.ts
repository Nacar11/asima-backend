import { Injectable } from '@nestjs/common';
import {
  PaymentGateway,
  GatewayContext,
  GatewayInitiateResult,
} from './payment-gateway.interface';

@Injectable()
export class CodGateway implements PaymentGateway {
  readonly gatewayName = 'cod';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initiate(_context: GatewayContext): Promise<GatewayInitiateResult> {
    return Promise.resolve({
      gateway: 'cod',
      checkout_url: null,
      qr_image_url: null,
      reference_number: null,
      requires_manual_confirmation: false,
    });
  }

  supportsManualConfirmation(): boolean {
    return false;
  }
}
